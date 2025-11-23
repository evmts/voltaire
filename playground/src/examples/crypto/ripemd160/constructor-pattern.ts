import * as RIPEMD160 from "../../../crypto/RIPEMD160/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Constructor pattern - auto-detects input type
console.log("=== Constructor Pattern (RIPEMD160.from) ===\n");

// From string
const stringHash = RIPEMD160.from("hello");
console.log("From string 'hello':", Hex.fromBytes(stringHash));

// From Uint8Array
const bytes = new Uint8Array([1, 2, 3]);
const bytesHash = RIPEMD160.from(bytes);
console.log("From bytes [1,2,3]:", Hex.fromBytes(bytesHash));

// Equivalent to specific methods
const hashStringResult = RIPEMD160.hashString("hello");
const hashResult = RIPEMD160.hash(bytes);

console.log(
	"\nConstructor matches hashString:",
	stringHash.equals(hashStringResult),
);
console.log("Constructor matches hash:", bytesHash.equals(hashResult));

console.log("\n=== Legacy API vs New API ===\n");

// Legacy method names
const legacy1 = RIPEMD160.hash("test");
const legacy2 = RIPEMD160.hashString("test");

// New constructor names
const new1 = RIPEMD160.from("test");
const new2 = RIPEMD160.fromString("test");

console.log("All methods produce same result:");
console.log("hash():", Hex.fromBytes(legacy1));
console.log("hashString():", Hex.fromBytes(legacy2));
console.log("from():", Hex.fromBytes(new1));
console.log("fromString():", Hex.fromBytes(new2));
console.log(
	"\nAll equal:",
	legacy1.equals(new1) && legacy2.equals(new2),
);
