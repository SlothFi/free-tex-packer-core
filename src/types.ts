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
 * Output atlas texture format
 *
 * @see TexturePackerOptions.textureFormat
 */
export enum TextureFormat {
  PNG = "png",
  JPG = "jpg",
}

/**
 * Atlas packer type.
 * There are two implementations which could be used
 *
 * @see TexturePackerOptions.packer
 * @see TexturePackerOptions.packerMethod
 * @see MaxRectsBinMethod
 * @see MaxRectsPackerMethod
 */
export enum PackerType {
  MAX_RECTS_BIN = "MaxRectsBin",
  MAX_RECTS_PACKER = "MaxRectsPacker",
  OPTIMAL_PACKER = "OptimalPacker",
}

/**
 * MaxRectsBin packer method
 *
 * @see TexturePackerOptions.packerMethod
 */
export enum MaxRectsBinMethod {
  BEST_SHORT_SIDE_FIT = "BestShortSideFit",
  BEST_LONG_SIDE_FIT = "BestLongSideFit",
  BEST_AREA_FIT = "BestAreaFit",
  BOTTOM_LEFT_RULE = "BottomLeftRule",
  CONTACT_POINT_RULE = "ContactPointRule",
}

/**
 * MaxRectsPacker packer method
 *
 * @see TexturePackerOptions.packerMethod
 */
export enum MaxRectsPackerMethod {
  SMART = "Smart",
  SQUARE = "Square",
  SMART_SQUARE = "SmartSquare",
  SMART_AREA = "SmartArea",
  SQUARE_AREA = "SquareArea",
  SMART_SQUARE_AREA = "SmartSquareArea",
}

/**
 * Packer exporter type
 * Predefined exporter types (supported popular formats)
 * Instead of predefined type you could use custom exporter
 *
 * @see TexturePackerOptions.exporter
 * @see PackerExporter
 */
export enum PackerExporterType {
  JSON_HASH = "JsonHash",
  JSON_ARRAY = "JsonArray",
  CSS = "Css",
  OLD_CSS = "OldCss",
  PIXI = "Pixi",
  PHASER_HASH = "PhaserHash",
  PHASER_ARRAY = "PhaserArray",
  PHASER3 = "Phaser3",
  XML = "XML",
  STARLING = "Starling",
  COCOS2D = "Cocos2d",
  SPINE = "Spine",
  UNREAL = "Unreal",
  UIKIT = "UIKit",
  UNITY3D = "Unity3D",
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
  /**
   * Prepend folder name to frame names
   *
   * @default true
   */
  prependFolderName?: boolean;
  /**
   * Output file format
   *
   * @default {@link TextureFormat.PNG}
   * @see {@link TextureFormat}
   */
  textureFormat?: TextureFormat;
  /**
   * "Tinify" texture using TinyPNG
   *
   * @default false
   */
  tinify?: boolean;
  /**
   * TinyPNG key
   *
   * @default empty string
   */
  tinifyKey?: string;
  /**
   * Name of predefined exporter (), or custom exporter (see below)
   *
   * @default JsonHash
   */
  exporter?: PackerExporterType | PackerExporter;
}

export enum ScaleMethod {
  BILINEAR = "BILINEAR",
  NEAREST_NEIGHBOR = "NEAREST_NEIGHBOR",
  HERMITE = "HERMITE",
  BEZIER = "BEZIER",
}

/**
 * Texture packer uses {@link http://mustache.github.io/ | mustache} template engine.
 * Look at documentation how to create custom exporter:
 * {@link https://www.npmjs.com/package/free-tex-packer-core#custom-exporter}
 */
export interface PackerExporter {
  /**
   * File extension
   */
  fileExt: string;
  /**
   * Path to template file (content could be used instead)
   * @see {@link content}
   */
  template?: string;
  /**
   * Template content (template path could be used instead)
   * @see {@link template}
   */
  content?: string;
}
