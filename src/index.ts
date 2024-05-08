import fs from "fs";
import os from "os";
import path from "path";
import { PNG } from "pngjs";
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
  image: PNG;
  original?: Frame;
}

/**
 * Optimized version of texture packer for real-time texture atlas packing
 */
export default class OptimizedTexturePacker {
  readonly frames: Frame[] = [];
  readonly duplicateFrames: Frame[] = [];

  constructor(
    protected readonly assetFolderPaths: {
      path: string;
      customPrefix?: string;
    }[],
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
    for (const { path: folderPath, customPrefix } of this.assetFolderPaths)
      await this.addFrames(
        folderPath,
        customPrefix ?? path.basename(folderPath)
      );

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

    /**
     * Check if cache in file system exists
     */
    if (!fs.existsSync(jsonPath)) {
      /** Generate JSON Data */
      const jsonData = JSONRenderer.render(this.options, frames, bins);

      /** Save to file system   */
      await fs.promises.writeFile(jsonPath, jsonData, {
        encoding: "utf-8",
      });
    }

    return jsonPath;
  }

  async generateTexture(frames: Frame[], textureIndex: number = 0) {
    /** */
    const { hash, bins } = this.pack(frames);

    /** */
    if (!bins[textureIndex])
      throw new RangeError(`Texture index ${textureIndex} is out of range`);

    const texturePath = OptimizedTexturePacker.ConstructTempFileName(
      hash,
      true,
      textureIndex
    );

    /**
     * Check if we have generated texture already and cached it in file system
     */
    if (!fs.existsSync(texturePath)) {
      /** Generate Texture */
      const texture = TextureRenderer.render(bins[textureIndex]);

      /** Save */
      await new Promise((resolve, reject) =>
        texture
          .pipe(fs.createWriteStream(texturePath))
          .once("finish", resolve)
          .once("error", reject)
      );
    }

    return texturePath;
  }

  filterFrames(filterPredicate: (frameName: string, frame: Frame) => boolean) {
    return this.frames.filter((frame) => filterPredicate(frame.name, frame));
  }

  /**
   * Add Frames From target asset path which can be direct path to image or folder containing them
   */
  private async addFrames(folderPath: string, prefix: string) {
    const dir = await fs.promises.readdir(folderPath);

    await Promise.all(
      dir.map(async (_subDir) => {
        const subDir = path.join(folderPath, _subDir);
        /**
         * Check if it's supported image
         */ if (_subDir.endsWith(".png"))
          await this.addFrame(
            `${prefix}/${
              this.options.removeFileExtension
                ? _subDir.replace(".png", "")
                : _subDir
            }`,
            subDir
          );
        /**
         * Check if subDir is directory and recursively add frame from that folder too
         */ else if ((await fs.promises.lstat(subDir)).isDirectory())
          await this.addFrames(subDir, `${prefix}/${_subDir}`);
        else console.log("Texture Packer", subDir, "not supported, skipping");
      })
    );
  }

  private async addFrame(name: string, framePath: string) {
    const image = new PNG({
      filterType: 4,
    });

    await new Promise<void>((res) => {
      fs.createReadStream(framePath)
        .pipe(image)
        .on("parsed", () => {
          const { width: w, height: h } = image;

          /**
           * Check if we have identical frame already stored
           */
          const originalFrame = this.frames.find((frame) =>
            frame.image.data.equals(image.data)
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

          res();
        });
    });
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
      isTextureFile ? `${hash}-${textureIndex!}.png` : `${hash}.json`
    );
  }
}

export * from "./types";
export { hashFrames };
