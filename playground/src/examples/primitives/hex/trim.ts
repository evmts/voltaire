import * as Hex from "../../../primitives/Hex/index.js";

// Remove leading zeros from hex
const padded = Hex.from(
	"0x000000000000000000000000000000000000000000000000000000000000002a",
);
const trimmed = padded.trim();
console.log("Padded:", padded.toString());
console.log("Trimmed:", trimmed.toString());
console.log("Padded size:", padded.size(), "bytes");
console.log("Trimmed size:", trimmed.size(), "bytes");

// Trim address from padded calldata parameter
const paddedAddress = Hex.from(
	"0x000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const address = paddedAddress.trim();
console.log("\nPadded address:", paddedAddress.toString());
console.log("Trimmed address:", address.toString());

// All zeros
const zeros = Hex.from("0x0000000000");
const trimmedZeros = zeros.trim();
console.log("\nAll zeros:", zeros.toString());
console.log("Trimmed:", trimmedZeros.toString());

// No leading zeros
const noZeros = Hex.from("0xdeadbeef");
const unchanged = noZeros.trim();
console.log("\nNo leading zeros:", noZeros.toString());
console.log("After trim:", unchanged.toString());
console.log("Unchanged:", noZeros.toString() === unchanged.toString());

// Round-trip pad and trim
const original = Hex.from("0x1234");
const padded32 = original.pad(32);
const restored = padded32.trim();
console.log("\nOriginal:", original.toString());
console.log("Padded:", padded32.toString());
console.log("Restored:", restored.toString());
console.log("Match:", original.toString() === restored.toString());
