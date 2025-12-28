import { Uint256 } from "@tevm/voltaire";
// Equality
const a = Uint256.fromNumber(42);
const b = Uint256.fromNumber(42);

// Inequality
const c = Uint256.fromNumber(10);
const d = Uint256.fromNumber(20);

// Compare with constants
const value = Uint256.fromNumber(0);
