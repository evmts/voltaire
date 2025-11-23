import * as Hex from "../../../primitives/Hex/index.js";

// Create zero-filled hex values
const zero4 = Hex.zero(4);
console.log("4 zero bytes:", zero4);
console.log("Size:", Hex.size(zero4), "bytes");

const zero32 = Hex.zero(32);
console.log("\n32 zero bytes:", zero32);
console.log("Size:", Hex.size(zero32), "bytes");

// Verify they are all zeros
console.log("\nAs number:", Hex.toNumber(zero32));
console.log("As BigInt:", Hex.toBigInt(zero32));

// Zero address
const zeroAddress = Hex.zero(20);
console.log("\nZero address (20 bytes):", zeroAddress);

// Zero hash
const zeroHash = Hex.zero(32);
console.log("\nZero hash (32 bytes):", zeroHash);

// Compare with empty
const empty = "0x";
const zero0 = Hex.zero(0);
console.log("\nEmpty hex:", empty);
console.log("Zero(0):", zero0);
console.log("Are equal:", Hex.equals(empty, zero0));
