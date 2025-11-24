import * as Hex from "../../../primitives/Hex/index.js";

// Remove leading zeros from hex
const padded = Hex.from(
	"0x000000000000000000000000000000000000000000000000000000000000002a",
);
const trimmed = padded.trim();

// Trim address from padded calldata parameter
const paddedAddress = Hex.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const address = paddedAddress.trim();

// All zeros
const zeros = Hex.from("0x0000000000");
const trimmedZeros = zeros.trim();

// No leading zeros
const noZeros = Hex.from("0xdeadbeef");
const unchanged = noZeros.trim();

// Round-trip pad and trim
const original = Hex.from("0x1234");
const padded32 = original.pad(32);
const restored = padded32.trim();
