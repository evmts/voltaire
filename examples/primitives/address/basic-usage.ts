/**
 * Basic Address Usage Example
 *
 * Demonstrates:
 * - Creating addresses from various input types (hex, bytes, numbers)
 * - Basic conversions (hex, checksummed, short display)
 * - Validation and type checking
 */

import { Address } from "../../../src/primitives/Address/index.js";

// From hex string (most common)
const addr1 = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// From number/bigint (takes lower 160 bits)
const addr2 = Address.fromNumber(69n);

// From bytes
const bytes = new Uint8Array(20);
bytes[19] = 42; // Last byte = 42
const addr3 = Address.fromBytes(bytes);

// Zero address
const zeroAddr = Address.zero();

const addr = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

const validAddr = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const invalidAddr = "0x742d35Cc"; // Too short
const wrongChecksum = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e"; // All lowercase

function processValue(value: unknown) {
	if (Address.is(value)) {
	} else {
	}
}

processValue(addr);
processValue("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
processValue(new Uint8Array(20));
processValue(new Uint8Array(32)); // Wrong length

const addrA = Address(100n);
const addrB = Address(100n);
const addrC = Address(200n);
