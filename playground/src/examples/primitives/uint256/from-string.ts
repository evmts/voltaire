import * as Uint256 from "../../../../../src/primitives/Uint/index.js";

// Create Uint256 from decimal string
const decimal = Uint256.from("12345678901234567890");

// Create from hex string
const hex = Uint256.from("0x1234567890abcdef");

// Create from very large number string
const large = Uint256.from(
	"115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

// Zero string
const zero = Uint256.from("0");
