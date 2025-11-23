import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Validate values
console.log("Is 42 valid:", Uint256.isValid(42));
console.log("Is 0 valid:", Uint256.isValid(0));
console.log("Is bigint valid:", Uint256.isValid(123n));

// Check for zero
const zero = Uint256.ZERO;
console.log("Is zero:", Uint256.isZero(zero));

const notZero = Uint256.fromNumber(1);
console.log("Is 1 zero:", Uint256.isZero(notZero));

// Try from (safe constructor)
const valid = Uint256.tryFrom(42);
console.log("tryFrom 42:", valid !== undefined);

const invalid = Uint256.tryFrom(-1);
console.log("tryFrom -1:", invalid === undefined);

// Validate before operations
function safeDivide(a: bigint, b: bigint) {
	if (!Uint256.isValid(a) || !Uint256.isValid(b)) {
		console.log("Invalid input");
		return;
	}
	const ua = Uint256.fromBigInt(a);
	const ub = Uint256.fromBigInt(b);
	if (Uint256.isZero(ub)) {
		console.log("Division by zero");
		return;
	}
	return Uint256.dividedBy(ua, ub);
}

const result = safeDivide(100n, 10n);
console.log("Safe divide 100/10:", result ? Uint256.toNumber(result) : "error");
