import { Bytes, RIPEMD160 } from "@tevm/voltaire";
import { Hex } from "@tevm/voltaire";

// From string
const stringHash = RIPEMD160.from("hello");

// From Uint8Array
const bytes = Bytes([1, 2, 3]);
const bytesHash = RIPEMD160.from(bytes);

// Equivalent to specific methods
const hashStringResult = RIPEMD160.hashString("hello");
const hashResult = RIPEMD160.hash(bytes);

// Legacy method names
const legacy1 = RIPEMD160.hash("test");
const legacy2 = RIPEMD160.hashString("test");

// New constructor names
const new1 = RIPEMD160.from("test");
const new2 = RIPEMD160.fromString("test");
