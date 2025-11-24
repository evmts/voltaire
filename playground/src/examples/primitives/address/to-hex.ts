import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to hex string
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Basic hex conversion (lowercase with 0x prefix)
const hex = addr.toHex();

// Short hex (truncated for display)
const shortHex = addr.toShortHex();

// Custom short hex with different lengths
const custom = addr.toShortHex(6, 4);

// Uppercase and lowercase variants
const upper = addr.toUppercase();
const lower = addr.toLowercase();
