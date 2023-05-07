import { Bin, Rectangle } from "maxrects-packer";
import { Frame } from "..";

export namespace JSONRenderer {
  export function render(frames: Frame[], bins: Bin<Rectangle>[]) {
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
            }) => ({
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
            })
          )
        ),
      })),
    });
  }
}
