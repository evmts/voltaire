import { RIPEMD160 } from "voltaire";
import { Hex } from "voltaire";

// From string
const stringHash = RIPEMD160.from("hello");

// From Uint8Array
const bytes = new Uint8Array([1, 2, 3]);
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
