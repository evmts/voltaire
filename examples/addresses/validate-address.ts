// @title Validate Ethereum Address
// @description Check if a string is a valid Ethereum address with EIP-55 checksum validation

// SNIPPET:START
import { Address } from "../../src/primitives/Address/index.js";

// Valid checksummed address
const validAddr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3";
const isValid = Address.isValid(validAddr);

// Invalid checksum
const invalidChecksum = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
const hasValidChecksum = Address.isValidChecksum(invalidChecksum);

// Not an address
const notAddress = "0x123";
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(isValid, true);
assert.equal(hasValidChecksum, false);
assert.equal(Address.isValid(notAddress), false);
process.exit(0);
