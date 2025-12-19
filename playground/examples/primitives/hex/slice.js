// Hex: Slice hex strings by byte offsets
import * as Hex from "../../../../src/primitives/Hex/index.js";

const hex = Hex.from("0x123456789abcdef0");

// Extract first 4 bytes
const first4 = Hex.slice(hex, 0, 4);

// Extract last 4 bytes
const last4 = Hex.slice(hex, 4, 8);

// Extract function selector
const calldata = Hex.from(
	"0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const selector = Hex.slice(calldata, 0, 4);
const params = Hex.slice(calldata, 4);
