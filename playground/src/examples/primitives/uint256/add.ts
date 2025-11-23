import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Basic addition
const a = Uint256.fromNumber(100);
const b = Uint256.fromNumber(200);
const sum = Uint256.plus(a, b);
console.log("100 + 200 =", Uint256.toNumber(sum));

// Addition with large numbers
const wei1 = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const wei2 = Uint256.fromBigInt(5n * 10n ** 17n); // 0.5 ETH
const totalWei = Uint256.plus(wei1, wei2);
console.log("1.5 ETH in wei:", Uint256.toBigInt(totalWei));

// Overflow wrapping (wraps to 0)
const max = Uint256.MAX;
const one = Uint256.ONE;
const overflow = Uint256.plus(max, one);
console.log("MAX + 1 wraps to zero:", Uint256.isZero(overflow));

// Chaining additions using sum helper
const values = [
	Uint256.fromNumber(10),
	Uint256.fromNumber(20),
	Uint256.fromNumber(30),
];
const total = Uint256.sum(values);
console.log("10 + 20 + 30 =", Uint256.toNumber(total));
