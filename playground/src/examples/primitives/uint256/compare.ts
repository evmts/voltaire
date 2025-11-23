import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Equality
const a = Uint256.fromNumber(42);
const b = Uint256.fromNumber(42);
console.log("42 == 42:", Uint256.equals(a, b));

// Inequality
const c = Uint256.fromNumber(10);
const d = Uint256.fromNumber(20);
console.log("10 != 20:", Uint256.notEquals(c, d));

// Less than
console.log("10 < 20:", Uint256.lessThan(c, d));
console.log("20 < 10:", Uint256.lessThan(d, c));

// Greater than
console.log("20 > 10:", Uint256.greaterThan(d, c));
console.log("10 > 20:", Uint256.greaterThan(c, d));

// Less than or equal
console.log("10 <= 10:", Uint256.lessThanOrEqual(c, Uint256.fromNumber(10)));
console.log("10 <= 20:", Uint256.lessThanOrEqual(c, d));

// Greater than or equal
console.log("20 >= 20:", Uint256.greaterThanOrEqual(d, Uint256.fromNumber(20)));
console.log("20 >= 10:", Uint256.greaterThanOrEqual(d, c));

// Compare with constants
const value = Uint256.fromNumber(0);
console.log("Is zero:", Uint256.equals(value, Uint256.ZERO));
console.log("Is one:", Uint256.equals(Uint256.ONE, Uint256.fromNumber(1)));
console.log("Is max:", Uint256.lessThan(value, Uint256.MAX));
