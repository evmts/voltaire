import { Bytes, Bytes32, Hash } from "@tevm/voltaire";
// Example: Validating hash values

// Valid hash hex string
const validHex =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// Invalid: wrong length
const tooShort = "0x1234";

// Invalid: not hex
const notHex =
	"0xZZZZ567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// Check if value is a Hash type
const hash = Hash.fromHex(validHex);
const zeroBytes = Bytes32.zero();
const zeroHash = Hash.fromBytes(zeroBytes);

// Assert throws on invalid input
try {
	Hash.assert(Bytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
} catch (e) {}
