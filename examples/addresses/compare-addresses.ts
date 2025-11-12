// @title Compare and Sort Addresses
// @description Compare Ethereum addresses for equality and sorting

// SNIPPET:START
import { Address } from "../../src/primitives/Address/index.js";

// Create some addresses
const addr1 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const addr2 = Address.from("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
const addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"); // Same as addr1

// Check equality (case-insensitive)
const areEqual = Address.equals(addr1, addr3);

const notEqual = Address.equals(addr1, addr2);

// Compare for sorting (lexicographic order)
const comparison = Address.compare(addr1, addr2);

// Sort addresses
const addresses = [addr2, addr1, addr3];
const sorted = addresses.sort(Address.compare);
// SNIPPET:END

// Test assertions
import { strict as assert } from "node:assert";

assert.equal(areEqual, true);
assert.equal(notEqual, false);
assert.equal(comparison > 0, true); // addr1 > addr2 lexicographically
process.exit(0);
