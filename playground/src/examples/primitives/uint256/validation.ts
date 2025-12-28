import { Uint256 } from "@tevm/voltaire";
// Check for zero
const zero = Uint256.ZERO;

const notZero = Uint256.fromNumber(1);

// Try from (safe constructor)
const valid = Uint256.tryFrom(42);

const invalid = Uint256.tryFrom(-1);

// Validate before operations
function safeDivide(a: bigint, b: bigint) {
	if (!Uint256.isValid(a) || !Uint256.isValid(b)) {
		return;
	}
	const ua = Uint256.fromBigInt(a);
	const ub = Uint256.fromBigInt(b);
	if (Uint256.isZero(ub)) {
		return;
	}
	return Uint256.dividedBy(ua, ub);
}

const result = safeDivide(100n, 10n);
