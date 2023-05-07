import Jimp from "jimp";
import { Bin, Rectangle } from "maxrects-packer";
import { Frame } from "..";
import { TexturePackerOptions } from "../types";

export namespace TextureRenderer {
  export async function render(bin: Bin<Rectangle>) {
    /** */
    const { width, height, rects } = bin;

    /**
     * Create Blank Texture
     */
    const texture = new Jimp(width, height, 0x0);

    /**
     * Render All Frames
     */
    for (const rect of rects) renderFrame(texture, rect, rect.data[0]);

    return await texture.getBufferAsync("image/png");
  }

  function renderFrame(texture: Jimp, { x, y }: Rectangle, frame: Frame) {
    let img = frame.image;

    let dx = x;
    let dy = y;
    let sx = frame.spriteSourceSize.x;
    let sy = frame.spriteSourceSize.y;
    let sw = frame.spriteSourceSize.w;
    let sh = frame.spriteSourceSize.h;

    texture.blit(img, dx, dy, sx, sy, sw, sh);
  }
}
