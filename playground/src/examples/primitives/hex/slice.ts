import * as Hex from "../../../primitives/Hex/index.js";

// Slice hex strings by byte offsets
const hex = Hex.from("0x123456789abcdef0");

// Extract first 4 bytes
const first4 = hex.slice(0, 4);

// Extract last 4 bytes
const last4 = hex.slice(4, 8);

// Slice from middle
const middle = hex.slice(2, 6);

// Extract function selector (first 4 bytes of calldata)
const calldata = Hex.from(
	"0x70a08231000000000000000000000000742d35Cc6634C0532925a3b844Bc454e4438f44e",
);
const selector = calldata.slice(0, 4);
const params = calldata.slice(4);

// Negative offset (from end)
const fromEnd = hex.slice(-4);
