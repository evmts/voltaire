import * as Address from "../../../primitives/Address/index.js";

// Example: Convert address to hex string
const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Basic hex conversion (lowercase with 0x prefix)
const hex = Address.toHex(addr);
console.log("Hex:", hex);

// Short hex (truncated for display)
const shortHex = Address.toShortHex(addr);
console.log("Short hex:", shortHex);

// Custom short hex with different lengths
const custom = Address.toShortHex(addr, 6, 4);
console.log("Custom short:", custom);

// Uppercase and lowercase variants
const upper = Address.toUppercase(addr);
const lower = Address.toLowercase(addr);
console.log("Uppercase:", upper);
console.log("Lowercase:", lower);
