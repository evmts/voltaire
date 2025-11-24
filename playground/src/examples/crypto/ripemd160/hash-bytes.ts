import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Hash raw byte arrays
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = RIPEMD160.hash(data);

// Hash accepts string or Uint8Array
const fromString = RIPEMD160.hash("test");

// Large data
const largeData = new Uint8Array(1000).fill(0xaa);
const largeHash = RIPEMD160.hash(largeData);

// Binary data with all byte values
const allBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
	allBytes[i] = i;
}
const allBytesHash = RIPEMD160.hash(allBytes);
