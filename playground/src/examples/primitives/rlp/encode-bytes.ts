import { Hex, Rlp, Bytes } from "@tevm/voltaire";
// Example: Encode bytes with RLP

// Single byte < 0x80 encodes as itself
const singleByte = Bytes([0x42]);
const encoded1 = Rlp.encodeBytes(singleByte);
// Output: 0x42 (no prefix needed)

// Empty bytes encode as 0x80
const emptyBytes = Bytes.zero(0);
const encoded2 = Rlp.encodeBytes(emptyBytes);
// Output: 0x80

// Short string (< 56 bytes): prefix with 0x80 + length
const shortString = Bytes([0x64, 0x6f, 0x67]); // "dog"
const encoded3 = Rlp.encodeBytes(shortString);
// Output: 0x83646f67 (0x83 = 0x80 + 3)

// 55 bytes - maximum for short form
const fiftyFive = Bytes.repeat(0xff, 55);
const encoded4 = Rlp.encodeBytes(fiftyFive);
// Output: 56 bytes total - First byte: 0xb7 (0x80 + 55)

// 56 bytes - minimum for long form
const fiftySix = Bytes.repeat(0xaa, 56);
const encoded5 = Rlp.encodeBytes(fiftySix);
// Output: 58 bytes total - First bytes: 0xb838 (0xb8 = 0xb7 + 1, 0x38 = 56)

// Long string (256 bytes) - length needs 2 bytes
const twoFiftySix = Bytes.repeat(0xbb, 256);
const encoded6 = Rlp.encodeBytes(twoFiftySix);
// Output: 0xb90100 (0xb9 = 0xb7 + 2, 0x0100 = 256 in big-endian)
