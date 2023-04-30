import fs from "fs";
import path from "path";
import Jimp from "jimp";
import { validateOptions } from "./utils/OptionValidator";
import { TexturePackerOptions } from "./types";
import FilesProcessor from "./FilesProcessor";

/**
 * Optimized version of texture packer for real-time texture atlas packing
 */
export class OptimizedTexturePacker {
  static readonly SUPPORTED_IMAGE_FORMATS = /(.jpg|.png)/;
  readonly frames: Record<string, Jimp> = {};
  frameNames!: string[];

  readonly options: TexturePackerOptions;

  constructor(
    protected readonly targetAssetFolders: string[],
    options: TexturePackerOptions
  ) {
    this.options = validateOptions(options);
  }

  async pack(filterPredicate: (frameName: string) => boolean) {
    const filteredFrames: Record<string, Jimp> = {};
    /**
     * Filter Frames
     */
    for (const frameName of this.frameNames)
      if (filterPredicate(frameName))
        filteredFrames[frameName] = this.frames[frameName];

    return await this.packFrames(filteredFrames);
  }

  async packFrames(frames: Record<string, Jimp>) {
    /** Pack Textures */
    const [{ buffer: JSONBuffer }, { buffer: TextureBuffer }] =
      await new Promise<{ name: string; buffer: Buffer }[]>((resolve, reject) =>
        FilesProcessor.start(frames, this.options, resolve, reject)
      );

    return { JSONBuffer, TextureBuffer };
  }

  async init() {
    /**
     * Go through all target asset folders and Add image textures
     */
    for (const targetAssetFolder of this.targetAssetFolders)
      await this.addFrames(targetAssetFolder);

    /**
     * Get All Frame names
     */
    this.frameNames = Object.keys(this.frames);
  }

  /**
   * Add Frames From target asset path which can be direct path to image or folder containing them
   */
  async addFrames(targetAssetPath: string, frameNamePrefix?: string) {
    const baseName = path.basename(targetAssetPath);
    let frameName = frameNamePrefix
      ? `${frameNamePrefix}/${baseName}`
      : baseName;
    /**
     * Check if it's image
     */
    if (OptimizedTexturePacker.SUPPORTED_IMAGE_FORMATS.test(targetAssetPath)) {
      /** Remove extension */
      frameName = frameName.replace(
        OptimizedTexturePacker.SUPPORTED_IMAGE_FORMATS,
        ""
      );
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

  private async addFrame(frameName: string, contents: Buffer) {
    /**
     * Preload Image as Texture-packer would do under the hood
     */
    const image = await Jimp.read(contents);

    //@ts-ignore
    image.name = frameName;
    //@ts-ignore
    image._base64 = contents.toString("base64");
    //@ts-ignore
    image.width = image.bitmap.width;
    //@ts-ignore
    image.height = image.bitmap.height;

    /** Save Image */
    this.frames[frameName] = image;
  }
}
