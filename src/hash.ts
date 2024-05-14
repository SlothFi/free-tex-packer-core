import murmur from "murmurhash-js";
import { compare } from "fast-string-compare";

import { Frame } from ".";

/**
 * Hash Unordered array of frames with unique names
 */
export function hashFrames(frames: Frame[]) {
  return murmur
    .murmur3(
      frames
        .sort((frameA, frameB) => frameA.name.localeCompare(frameB.name))
        .join(","),
      123
    )
    .toString();
}
