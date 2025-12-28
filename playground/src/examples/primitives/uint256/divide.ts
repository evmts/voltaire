import { Uint256 } from "voltaire";
// Basic division
const a = Uint256.fromNumber(100);
const b = Uint256.fromNumber(10);
const quotient = Uint256.dividedBy(a, b);

// Integer division (truncates)
const c = Uint256.fromNumber(100);
const d = Uint256.fromNumber(3);
const result = Uint256.dividedBy(c, d);

// Divide large numbers
const weiAmount = Uint256.fromBigInt(10n ** 18n); // 1 ETH
const divisor = Uint256.fromBigInt(10n ** 9n); // gwei
const gwei = Uint256.dividedBy(weiAmount, divisor);

// Divide by one (identity)
const value = Uint256.fromNumber(42);
const identity = Uint256.dividedBy(value, Uint256.ONE);

// Self-division equals one
const self = Uint256.fromNumber(999);
const one = Uint256.dividedBy(self, self);
