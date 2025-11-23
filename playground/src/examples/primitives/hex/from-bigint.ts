import * as Hex from "../../../primitives/Hex/index.js";

// Convert BigInt to hex (for large values beyond Number.MAX_SAFE_INTEGER)
const bigNum = 2n ** 256n - 1n; // Max uint256
const hex = Hex.fromBigInt(bigNum);
console.log("BigInt:", bigNum.toString());
console.log("Hex:", hex);
console.log("Size:", Hex.size(hex), "bytes");

// Ethereum amounts (wei)
const oneEther = 10n ** 18n; // 1 ETH in wei
const etherHex = Hex.fromBigInt(oneEther);
console.log("\n1 ETH (wei):", oneEther.toString());
console.log("Hex:", etherHex);

// Fixed size (32 bytes for uint256)
const small = 42n;
const hex32 = Hex.fromBigInt(small, 32);
console.log("\nSmall BigInt:", small);
console.log("Hex (32 bytes):", hex32);
console.log("Size:", Hex.size(hex32), "bytes");

// Zero
const zero = Hex.fromBigInt(0n);
console.log("\nZero BigInt:", zero);

// Large prime
const largePrime =
	115792089237316195423570985008687907853269984665640564039457584007913129639747n;
const primeHex = Hex.fromBigInt(largePrime);
console.log("\nLarge prime:", largePrime.toString());
console.log("Hex:", primeHex);
