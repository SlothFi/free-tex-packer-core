import { Frame } from ".";
import murmur from "murmurhash-js";
import { inPlaceSort } from "fast-sort";

/**
 * Hash Unordered array of frames with unique names
 */
export function hashFrames(frames: Frame[]) {
  /**
   * Sort Frames by name
   */
  inPlaceSort(frames).asc((frame) => frame.name);

  /** Concatenate all frame names */
  let str = "";
  for (const { name } of frames) str += name + ",";

  /**
   * Generate Hash
   */
  return murmur.murmur3(str, 123).toString(16);
}
