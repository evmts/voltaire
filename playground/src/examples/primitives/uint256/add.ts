import { Uint256 } from "voltaire";
// Basic addition
const a = Uint256.fromNumber(100);
const b = Uint256.fromNumber(200);
const sum = Uint256.plus(a, b);

// Addition with large numbers
const wei1 = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const wei2 = Uint256.fromBigInt(5n * 10n ** 17n); // 0.5 ETH
const totalWei = Uint256.plus(wei1, wei2);

// Overflow wrapping (wraps to 0)
const max = Uint256.MAX;
const one = Uint256.ONE;
const overflow = Uint256.plus(max, one);

// Chaining additions using sum helper
const values = [
	Uint256.fromNumber(10),
	Uint256.fromNumber(20),
	Uint256.fromNumber(30),
];
const total = Uint256.sum(values);
