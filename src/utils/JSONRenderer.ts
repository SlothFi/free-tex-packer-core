import { Bin, Rectangle } from "maxrects-packer";
import { Frame } from "..";
import { TexturePackerOptions, TrimMode } from "../types";

export namespace JSONRenderer {
  export function render(
    { trimMode }: TexturePackerOptions,
    frames: Frame[],
    bins: Bin<Rectangle>[]
  ) {
    return JSON.stringify({
      textures: bins.map(({ width: w, height: h, rects }, textureIndex) => ({
        image: `${textureIndex}.png`,
        format: "RGBA8888",
        size: { w, h },
        scale: 1,
        frames: rects.flatMap(({ x, y, data: frameGroup }) =>
          (frameGroup as Frame[]).map(
            ({
              name: filename,
              trimmed,
              sourceSize,
              spriteSourceSize,
              frame,
            }) =>
              trimmed && trimMode == TrimMode.CROP
                ? {
                    filename,
                    rotated: false,
                    trimmed: false,
                    sourceSize: {
                      ...sourceSize,
                      w: spriteSourceSize.w,
                      h: spriteSourceSize.h,
                    },
                    spriteSourceSize: { ...spriteSourceSize, x: 0, y: 0 },
                    frame: {
                      x,
                      y,
                      w: frame.w,
                      h: frame.h,
                    },
                  }
                : {
                    filename,
                    rotated: false,
                    trimmed,
                    sourceSize,
                    spriteSourceSize,
                    frame: {
                      x,
                      y,
                      w: frame.w,
                      h: frame.h,
                    },
                  }
          )
        ),
      })),
    });
  }
}
