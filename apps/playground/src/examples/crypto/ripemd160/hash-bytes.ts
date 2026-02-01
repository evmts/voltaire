import { Bytes, RIPEMD160 } from "@tevm/voltaire";
import { Hex } from "@tevm/voltaire";

// Hash raw byte arrays
const data = Bytes([1, 2, 3, 4, 5]);
const hash = RIPEMD160.hash(data);

// Hash accepts string or Uint8Array
const fromString = RIPEMD160.hash("test");

// Large data
const largeData = Bytes(Array(1000).fill(0xaa));
const largeHash = RIPEMD160.hash(largeData);

// Binary data with all byte values
const allBytes = Bytes(Array.from({ length: 256 }, (_, i) => i));
const allBytesHash = RIPEMD160.hash(allBytes);
