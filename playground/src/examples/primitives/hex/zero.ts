import * as Hex from "../../../primitives/Hex/index.js";

// Create zero-filled hex values
const zero4 = Hex.zero(4);
console.log("4 zero bytes:", zero4.toString());
console.log("Size:", zero4.size(), "bytes");

const zero32 = Hex.zero(32);
console.log("\n32 zero bytes:", zero32.toString());
console.log("Size:", zero32.size(), "bytes");

// Verify they are all zeros
console.log("\nAs number:", zero32.toNumber());
console.log("As BigInt:", zero32.toBigInt());

// Zero address
const zeroAddress = Hex.zero(20);
console.log("\nZero address (20 bytes):", zeroAddress.toString());

// Zero hash
const zeroHash = Hex.zero(32);
console.log("\nZero hash (32 bytes):", zeroHash.toString());

// Compare with empty
const empty = Hex.from("0x");
const zero0 = Hex.zero(0);
console.log("\nEmpty hex:", empty.toString());
console.log("Zero(0):", zero0.toString());
console.log("Are equal:", empty.equals(zero0));
