// Keccak256: Ethereum's primary hash function
import { Hex, Keccak256 } from "@tevm/voltaire";

// Hash a string - returns 32-byte Uint8Array
const hash = Keccak256.hashString("Hello Voltaire!");

// Hash raw bytes
const data = new TextEncoder().encode("Test");
const bytesHash = Keccak256.hash(data);

// Hash empty data
const emptyHash = Keccak256.hash(new Uint8Array(0));
