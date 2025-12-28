import { Hex, Keccak256 } from "@tevm/voltaire";
// Example: Hash hex-encoded data
const hexData = "0xdeadbeef";
const hash = Keccak256.hashHex(hexData);

// Hash longer hex string
const longHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const longHash = Keccak256.hashHex(longHex);

// Hex without 0x prefix also works
const unprefixed = "cafebabe";
const unprefixedHash = Keccak256.hashHex(unprefixed);
