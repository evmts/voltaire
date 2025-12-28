import { Hex, SHA256 } from "voltaire";
// Hash raw byte arrays
const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = SHA256.hash(bytes);

// Hash larger byte array
const data = new Uint8Array(100).fill(0x42);
const dataHash = SHA256.hash(data);

// Hashing is deterministic
const hash2 = SHA256.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);

// Hash with from() constructor (accepts Uint8Array)
const fromHash = SHA256.from(bytes);
