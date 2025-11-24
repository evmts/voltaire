import * as Hex from "../../../primitives/Hex/index.js";

// Convert hex to BigInt (for values beyond Number.MAX_SAFE_INTEGER)
const hex1 =
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const bigInt1 = Hex.toBigInt(hex1);

// Ethereum amounts
const weiHex = "0x0de0b6b3a7640000"; // 1 ETH
const wei = Hex.toBigInt(weiHex);

// Small values
const small = "0x2a"; // 42
const smallBigInt = Hex.toBigInt(small);

// Round-trip conversion
const original = 123456789012345678901234567890n;
const hexed = Hex.fromBigInt(original);
const restored = Hex.toBigInt(hexed);

// Zero
const zero = Hex.toBigInt("0x00");
