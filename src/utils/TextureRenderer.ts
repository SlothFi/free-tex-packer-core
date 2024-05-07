import { Bin, Rectangle } from "maxrects-packer";
import { Frame } from "..";
import { TexturePackerOptions } from "../types";
import { PNG } from "pngjs";

export namespace TextureRenderer {
  export function render(bin: Bin<Rectangle>) {
    /** */
    const { width, height, rects } = bin;

    /**
     * Create Blank Texture
     */
    const texture = new PNG({ width, height });

    /**
     * Render All Frames
     */
    for (const rect of rects) renderFrame(texture, rect, rect.data[0]);

    return texture.pack();
  }

  function renderFrame(texture: PNG, { x, y }: Rectangle, frame: Frame) {
    let dx = x;
    let dy = y;
    let sx = frame.spriteSourceSize.x;
    let sy = frame.spriteSourceSize.y;
    let sw = frame.spriteSourceSize.w;
    let sh = frame.spriteSourceSize.h;

    frame.image.bitblt(texture, sx, sy, sw, sh, dx, dy);
  }
}
