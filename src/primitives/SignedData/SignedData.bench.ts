/**
 * Benchmark: SignedData (EIP-191) operations
 * Tests signed data creation and hashing
 */

import { bench, run } from "mitata";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { VERSION_PERSONAL_MESSAGE } from "./constants.js";
import * as SignedData from "./index.js";

// Test data - various message sizes
const shortMessage = new TextEncoder().encode("Hello, World!");
const mediumMessage = new TextEncoder().encode("This is a medium-length message for signing that contains more content and testing data.");
const longMessage = new TextEncoder().encode("A".repeat(1000));

// Pre-create Hash factory
const Hash = SignedData.Hash({ keccak256 });

// Pre-create signed data instances (EIP-191 personal message format: 0x19 0x45 <data>)
const signedDataShort = SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), shortMessage);
const signedDataMedium = SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), mediumMessage);
const signedDataLong = SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), longMessage);

// ============================================================================
// from (constructor - personal message version)
// ============================================================================

bench("SignedData.from - short message - voltaire", () => {
	SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), shortMessage);
});

bench("SignedData.from - medium message - voltaire", () => {
	SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), mediumMessage);
});

bench("SignedData.from - long message - voltaire", () => {
	SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), longMessage);
});

await run();

// ============================================================================
// Hash (EIP-191 hash)
// ============================================================================

bench("SignedData.Hash - short message - voltaire", () => {
	Hash(signedDataShort);
});

bench("SignedData.Hash - medium message - voltaire", () => {
	Hash(signedDataMedium);
});

bench("SignedData.Hash - long message - voltaire", () => {
	Hash(signedDataLong);
});

await run();

// ============================================================================
// Full workflow: from + Hash
// ============================================================================

bench("SignedData workflow - from + Hash - short - voltaire", () => {
	const data = SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), shortMessage);
	Hash(data);
});

bench("SignedData workflow - from + Hash - long - voltaire", () => {
	const data = SignedData.from(VERSION_PERSONAL_MESSAGE, new Uint8Array(0), longMessage);
	Hash(data);
});

await run();
