// SHA256: Hash raw byte arrays
import { Hex, SHA256 } from "@tevm/voltaire";

const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
const hash = SHA256.hash(bytes);

// Hash larger byte array
const data = new Uint8Array(100).fill(0x42);
const dataHash = SHA256.hash(data);

// Hashing is deterministic
const hash2 = SHA256.hash(bytes);
const match = hash.every((byte, i) => byte === hash2[i]);
