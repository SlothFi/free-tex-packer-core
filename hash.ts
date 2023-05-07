import { Frame } from ".";

export function hashString(str: string) {
  const l = str.length;
  let sum = 0;
  for (let i = 0; i < l; i++) sum += str.charCodeAt(i) * (i + 1);
  return sum;
}

/**
 * Hash Unordered array of frames with unique names
 */
export function hashFrames(frames: Frame[]) {
  let result = 17;
  for (const { name } of frames) result ^= hashString(name);
  return result.toString(16);
}
