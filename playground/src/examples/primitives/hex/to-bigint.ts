import * as Hex from "../../../primitives/Hex/index.js";

// Convert hex to BigInt (for values beyond Number.MAX_SAFE_INTEGER)
const hex1 =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const bigInt1 = Hex.toBigInt(hex1);
console.log("Hex:", hex1);
console.log("BigInt:", bigInt1.toString());
console.log("Is max uint256:", bigInt1 === 2n ** 256n - 1n);

// Ethereum amounts
const weiHex = "0x0de0b6b3a7640000"; // 1 ETH
const wei = Hex.toBigInt(weiHex);
console.log("\nWei hex:", weiHex);
console.log("Wei:", wei.toString());
console.log("ETH:", Number(wei) / 1e18);

// Small values
const small = "0x2a"; // 42
const smallBigInt = Hex.toBigInt(small);
console.log("\nSmall hex:", small);
console.log("BigInt:", smallBigInt);

// Round-trip conversion
const original = 123456789012345678901234567890n;
const hexed = Hex.fromBigInt(original);
const restored = Hex.toBigInt(hexed);
console.log("\nOriginal BigInt:", original.toString());
console.log("Hex:", hexed);
console.log("Restored:", restored.toString());
console.log("Match:", original === restored);

// Zero
const zero = Hex.toBigInt("0x00");
console.log("\nZero:", zero);
