/**
 * Basic Hex Usage Example
 *
 * Demonstrates:
 * - Creating hex strings from various input types
 * - Basic validation and type checking
 * - Converting between hex and other formats
 * - Size checking
 */

import { Hex } from "@tevm/voltaire";

// From hex string
const hex1 = Hex("0x1234");

// From bytes
const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
const hex2 = Hex.fromBytes(bytes);

// From number
const hex3 = Hex.fromNumber(255);

// From bigint with padding
const hex4 = Hex.fromBigInt(255n, 32);

// From string (UTF-8 encoding)
const hex5 = Hex.fromString("hello");

// From boolean
const hex6 = Hex.fromBoolean(true);
const hex7 = Hex.fromBoolean(false);

// Type guard
const maybeHex = "0x1234";
if (Hex.isHex(maybeHex)) {
	const size = Hex.size(maybeHex);
}

// Invalid examples
const invalid = ["1234", "0xGHI", "0x 123"];
invalid.forEach((val) => {});

const data = Hex("0x68656c6c6f"); // "hello" encoded

// To bytes
const convertedBytes = Hex.toBytes(data);

// To string (UTF-8 decode)
const str = Hex.toString(data);

// To number (for small values)
const smallHex = Hex("0xff");
const num = Hex.toNumber(smallHex);

// To bigint (for any size)
const bigint = Hex.toBigInt(data);

const addr = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Assert size (throws if wrong)
try {
	const validAddr = Hex.assertSize(addr, 20);
} catch (e) {}
