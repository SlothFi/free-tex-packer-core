import fs from "fs";
import path from "path";
import os from "os";
import Jimp from "jimp";
import { TexturePackerOptions } from "./types";
import Trimmer from "./utils/Trimmer";
import {
  Bin,
  IOption as PackerOptions,
  MaxRectsPacker,
  Rectangle,
} from "maxrects-packer";
import { TextureRenderer } from "./utils/TextureRenderer";
import { hashFrames } from "./hash";
import { JSONRenderer } from "./utils/JSONRenderer";

export interface Frame {
  name: string;
  trimmed: boolean;
  sourceSize: { w: number; h: number };
  spriteSourceSize: { [key in "x" | "y" | "w" | "h"]: number };
  frame: { [key in "x" | "y" | "w" | "h"]: number };
  image: Jimp;
  original?: Frame;
}

/**
 * Optimized version of texture packer for real-time texture atlas packing
 */
export default class OptimizedTexturePacker {
  static readonly IMAGE_FORMATS = /(.jpg|.png)/;
  readonly frames: Frame[] = [];
  readonly duplicateFrames: Frame[] = [];

  constructor(
    protected readonly targetAssetFolders: string[],
    readonly options: TexturePackerOptions,
    readonly packerOptions?: Omit<PackerOptions, "allowRotation">
  ) {}

  /**
   * Initialize Texture packer
   * `Must be called only once at the startup`
   */
  async init() {
    /**
     * Go through all target asset folders and Add image textures
     */
    for (const targetAssetFolder of this.targetAssetFolders)
      await this.addFrames(targetAssetFolder);

    /**
     * Pre-trim frames
     */
    if (this.options.allowTrim)
      Trimmer.trim(
        this.frames,
        Math.min(this.options.alphaThreshold || 0, 255)
      );

    return this;
  }

  /**
   * Cache Packed Bins
   */
  private readonly bins: Record<string, Bin<Rectangle>[]> = {};
  getBinsByHash(hash: string) {
    return this.bins[hash];
  }

  /**
   * Packs Frames and save returns packed bins
   * Caches calculated bins for future executions
   */
  pack(frames: Frame[]) {
    /**
     * Generate Hash for frames
     */
    const hash = hashFrames(frames);

    /**
     * Check if we have already packed bins
     */
    if (this.bins[hash]) return { hash, bins: this.bins[hash] };

    /**
     * Group Identical Frames
     */
    const identicalFrames = new Map<Frame, Frame[]>();
    for (const frame of frames) {
      const key = frame.original || frame;
      if (identicalFrames.has(key)) identicalFrames.get(key)!.push(frame);
      else identicalFrames.set(key, [frame]);
    }

    /** Create Packer */
    const packer = new MaxRectsPacker(
      2048,
      2048,
      this.options.padding,
      this.packerOptions
    );

    /**
     * Populate with frames
     */
    for (const [originalFrame, frameGroup] of identicalFrames)
      packer.add(originalFrame.frame.w, originalFrame.frame.h, frameGroup);

    /** Save Packed bins */
    this.bins[hash] = packer.bins;

    return { hash, bins: packer.bins };
  }

  async generateJSON(frames: Frame[]) {
    /** */
    const { hash, bins } = this.pack(frames);

    /**
     * Check if we have generated data file already and cached it in filesystem
     */
    const jsonPath = OptimizedTexturePacker.ConstructTempFileName(hash, false);

    return await new Promise<string>((resolve) => {
      /**
       * Read texture file in fs and return it directly if it exists, otherwise generate
       */
      fs.readFile(jsonPath, "utf-8", async (err, data) => {
        if (!err) resolve(data);
        else {
          /** Generate JSON Data */
          const jsonData = JSONRenderer.render(frames, bins);

          /** Save to file system for future */
          await new Promise<void>((res, rej) =>
            fs.writeFile(jsonPath, jsonData, { encoding: "utf-8" }, (err) =>
              err ? rej(err) : res()
            )
          );

          /**
           * Return JSON Data
           */
          resolve(jsonData);
        }
      });
    });
  }

  async generateTexture(frames: Frame[], textureIndex: number = 0) {
    /** */
    const { hash, bins } = this.pack(frames);

    /** */
    if (!bins[textureIndex])
      throw new RangeError(`Texture index ${textureIndex} is out of range`);

    /**
     * Check if we have generated texture already and cached it in filesystem
     */
    const texturePath = OptimizedTexturePacker.ConstructTempFileName(
      hash,
      true,
      textureIndex
    );

    return await new Promise<Buffer>((resolve) => {
      /**
       * Read texture file in fs and return it directly if it exists, otherwise generate
       */
      fs.readFile(texturePath, null, async (err, data) => {
        if (!err) resolve(data);
        else {
          /** Generate Texture */
          const textureBuffer = await TextureRenderer.render(
            bins[textureIndex]
          );

          /** Save to file system for future */
          await new Promise<void>((res, rej) =>
            fs.writeFile(texturePath, textureBuffer, (err) =>
              err ? rej(err) : res()
            )
          );

          /**
           * Return Texture Buffer
           */
          resolve(textureBuffer);
        }
      });
    });
  }

  filterFrames(filterPredicate: (frameName: string, frame: Frame) => boolean) {
    return this.frames.filter((frame) => filterPredicate(frame.name, frame));
  }

  /**
   * Add Frames From target asset path which can be direct path to image or folder containing them
   */
  private async addFrames(targetAssetPath: string, frameNamePrefix?: string) {
    const baseName = path.basename(targetAssetPath);
    let frameName =
      this.options.prependFolderName && frameNamePrefix
        ? `${frameNamePrefix}/${baseName}`
        : baseName;
    /**
     * Check if it's image
     */
    if (OptimizedTexturePacker.IMAGE_FORMATS.test(targetAssetPath)) {
      /** Remove extension */
      if (this.options.removeFileExtension)
        frameName = frameName.replace(OptimizedTexturePacker.IMAGE_FORMATS, "");

      /** Read Content */
      const contents = fs.readFileSync(targetAssetPath);

      /**
       * Add Frame
       */
      await this.addFrame(frameName, contents);
    } else {
      /**
       * Treat Path as folder and check for it's contents
       */
      const contents = fs.readdirSync(targetAssetPath, "utf-8");
      for (const contentPath of contents)
        await this.addFrames(
          path.join(targetAssetPath, contentPath),
          frameName
        );
    }
  }

  private async addFrame(name: string, contents: Buffer) {
    /**
     * Preload Image as Texture-packer would do under the hood
     */
    const image = await Jimp.read(contents);
    const { width: w, height: h } = image.bitmap;

    /**
     * Check if we have identical frame already stored
     */
    const originalFrame = this.frames.find((frame) =>
      frame.image.bitmap.data.equals(image.bitmap.data)
    );

    /**
     * Add Frame
     */
    const frame: Frame = {
      name,
      trimmed: false,
      frame: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      spriteSourceSize: { x: 0, y: 0, w, h },
      /** Only Save reference to original image to free up current one from memory */
      image: originalFrame?.image || image,
      original: originalFrame,
    };

    /** Save */
    this.frames.push(frame);
  }

  static readonly TEMP_ASSET_PATH = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
  /**
   * Construct the file name associated with hash for saving JSON or textures in temp location
   *
   * If `isTextureFile` is false, then it returns path for json data file
   */
  static ConstructTempFileName(
    hash: string,
    isTextureFile: true,
    textureIndex: number
  ): string;
  static ConstructTempFileName(hash: string, isTextureFile: false): string;
  static ConstructTempFileName(
    hash: string,
    isTextureFile: boolean,
    textureIndex?: number
  ) {
    return path.join(
      OptimizedTexturePacker.TEMP_ASSET_PATH,
      isTextureFile ? `${hash}.json` : `${hash}-${textureIndex!}.png`
    );
  }
}

export * from "./types";
export { hashFrames };
