import { Hex } from "@tevm/voltaire";
// Get size in bytes of hex strings
const hex1 = Hex("0x1234");

const hex2 = Hex("0xdeadbeef");

// Address (20 bytes)
const address = Hex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// Hash (32 bytes)
const hash = Hex(`0x${"42".repeat(32)}`);

// Empty
const empty = Hex("0x");

// Without prefix
const noPrefix = Hex("deadbeef");

// Size relationship: 2 hex chars = 1 byte
const testHex = Hex("0xaabbccdd");
const sizeInBytes = testHex.size();
const hexChars = testHex.toString().length - 2; // Remove '0x'
