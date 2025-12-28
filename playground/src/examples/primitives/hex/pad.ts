import { Hex } from "voltaire";
// Pad hex to specified size (left padding with zeros)
const hex = Hex.from("0x1234");

// Pad to 32 bytes (uint256)
const padded32 = hex.pad(32);

// Pad to 4 bytes
const padded4 = hex.pad(4);

// Right padding (pad on right side)
const rightPadded = hex.padRight(32);

// Already correct size (no padding)
const correct = Hex.from("0x12345678");
const unchanged = correct.pad(4);

// Address padding (20 bytes to 32 bytes)
const address = Hex.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const addressPadded = address.pad(32);
