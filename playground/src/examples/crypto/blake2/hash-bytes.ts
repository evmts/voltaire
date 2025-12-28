import { Blake2, Bytes, Hex } from "@tevm/voltaire";
// Hash raw byte arrays
const bytes = Bytes([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = Blake2.hash(bytes);

// Hash larger byte array
const data = Bytes(Array(100).fill(0x42));
const dataHash = Blake2.hash(data);

// Hashing is deterministic
const hash2 = Blake2.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);
