/**
 * Trim mode for sprites
 *
 * @see TexturePackerOptions.trimMode
 * @see TexturePackerOptions.allowTrim
 */
export enum TrimMode {
  /**
   * Remove transparent pixels from sides, but left original frame size
   *
   * For example:
   *  Original sprite has size 64x64, after removing transparent pixels its real size will be reduced to 32x28,
   *  which will be written as frame size, but original frame size will stay the same: 64x64
   */
  TRIM = "trim",
  /**
   * Remove transparent pixels from sides, and update frame size
   *
   * For example:
   *  Original sprite has size 64x64, after removing transparent pixels its real size will be reduced to 32x28,
   *  which will be written as frame size, and original frame size will be reduced to the same dimensions
   */
  CROP = "crop",
}

/**
 * Texture packer options
 */
export interface TexturePackerOptions {
  /**
   * Spaces in pixels around images
   *
   * @default 0
   */
  padding?: number;
  /**
   * Allow trim images
   *
   * @default true
   */
  allowTrim?: boolean;
  /**
   * Trim mode
   *
   * @default {@link TrimMode.TRIM}
   * @see {@link TrimMode}
   * @see {@link allowTrim}
   */
  trimMode?: TrimMode;
  /**
   * Threshold alpha value
   *
   * @default 0
   */
  alphaThreshold?: number;
  /**
   * Remove file extensions from frame names
   *
   * @default false
   */
  removeFileExtension?: boolean;
}
