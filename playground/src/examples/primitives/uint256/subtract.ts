import { Uint256 } from "voltaire";
// Basic subtraction
const a = Uint256.fromNumber(200);
const b = Uint256.fromNumber(100);
const diff = Uint256.minus(a, b);

// Subtraction with large numbers
const balance = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const fee = Uint256.fromBigInt(10n ** 16n); // 0.01 ETH
const remaining = Uint256.minus(balance, fee);

// Underflow wrapping (wraps to MAX)
const zero = Uint256.ZERO;
const one = Uint256.ONE;
const underflow = Uint256.minus(zero, one);

// Subtract to zero
const value = Uint256.fromNumber(42);
const result = Uint256.minus(value, value);
