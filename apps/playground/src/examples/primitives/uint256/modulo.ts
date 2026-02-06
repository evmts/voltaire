import { Uint256 } from "@tevm/voltaire";
// Basic modulo operation
const a = Uint256.fromNumber(10);
const b = Uint256.fromNumber(3);
const remainder = Uint256.modulo(a, b);

// Check if even (mod 2)
const value = Uint256.fromNumber(42);
const isEven = Uint256.isZero(Uint256.modulo(value, Uint256.fromNumber(2)));

// Modulo with large numbers
const large = Uint256.fromBigInt(123456789012345678901234567890n);
const divisor = Uint256.fromBigInt(10n ** 18n);
const mod = Uint256.modulo(large, divisor);

// Modulo by 1 always returns 0
const zero = Uint256.modulo(Uint256.fromNumber(999), Uint256.ONE);

// Get last digit (mod 10)
const number = Uint256.fromNumber(12345);
const lastDigit = Uint256.modulo(number, Uint256.fromNumber(10));
