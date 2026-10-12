export function isRasterImage(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false
  }

  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const gif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
  const webp =
    ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP"

  return jpeg || png || gif || webp
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end))
}
