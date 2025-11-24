import * as Hex from "../../../primitives/Hex/index.js";

// Convert hex to boolean (0x00 = false, anything else = true)
const hexFalse = "0x00";
const hexTrue = "0x01";

// Non-zero values are truthy
const nonZero = "0xff";

const hex42 = "0x2a";

// Padded values
const paddedFalse =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
const paddedTrue =
	"0x0000000000000000000000000000000000000000000000000000000000000001";

// Round-trip
const original = true;
const hexed = Hex.fromBoolean(original);
const restored = Hex.toBoolean(hexed);
