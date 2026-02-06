/**
 * Storage Module Benchmarks
 *
 * Measures performance of ERC-7201 and ERC-8042 storage slot calculations
 */

import { bench, run } from "mitata";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Storage from "./index.js";

// ============================================================================
// Test Data - Realistic namespace identifiers
// ============================================================================

// Short namespaces
const shortNamespace = "erc20.storage";
const mediumNamespace = "com.openzeppelin.storage.ERC20";
const longNamespace =
	"io.github.myproject.contracts.tokens.extensions.ERC20Burnable.storage.v1";

// Common OpenZeppelin-style namespaces
const ozErc20 = "openzeppelin.storage.ERC20";
const ozErc721 = "openzeppelin.storage.ERC721";
const ozAccessControl = "openzeppelin.storage.AccessControl";
const ozReentrancyGuard = "openzeppelin.storage.ReentrancyGuard";

// Diamond storage namespaces (ERC-2535)
const diamondFacet1 = "diamond.facet.DiamondCutFacet";
const diamondFacet2 = "diamond.facet.DiamondLoupeFacet";
const diamondFacet3 = "diamond.facet.OwnershipFacet";

// Custom project namespaces
const customNamespace1 = "myapp.storage.UserProfiles";
const customNamespace2 = "myapp.storage.Marketplace";
const customNamespace3 = "myapp.storage.Governance.Voting.v2";

// Unicode/special character namespaces (edge cases)
const _unicodeNamespace = "storage.namespace.test123";
const longNumericNamespace = "storage.slot.0x1234567890abcdef";

// ============================================================================
// Benchmarks - ERC-7201 (Namespaced Storage Layout)
// ============================================================================

bench("calculateErc7201 - short namespace - voltaire", () => {
	Storage.calculateErc7201(keccak256, shortNamespace);
});

bench("calculateErc7201 - medium namespace - voltaire", () => {
	Storage.calculateErc7201(keccak256, mediumNamespace);
});

bench("calculateErc7201 - long namespace - voltaire", () => {
	Storage.calculateErc7201(keccak256, longNamespace);
});

await run();

// ============================================================================
// Benchmarks - ERC-7201 Common Patterns
// ============================================================================

bench("calculateErc7201 - OZ ERC20 - voltaire", () => {
	Storage.calculateErc7201(keccak256, ozErc20);
});

bench("calculateErc7201 - OZ ERC721 - voltaire", () => {
	Storage.calculateErc7201(keccak256, ozErc721);
});

bench("calculateErc7201 - OZ AccessControl - voltaire", () => {
	Storage.calculateErc7201(keccak256, ozAccessControl);
});

bench("calculateErc7201 - OZ ReentrancyGuard - voltaire", () => {
	Storage.calculateErc7201(keccak256, ozReentrancyGuard);
});

await run();

// ============================================================================
// Benchmarks - ERC-8042 (Diamond Storage)
// ============================================================================

bench("calculateErc8042 - short namespace - voltaire", () => {
	Storage.calculateErc8042(keccak256, shortNamespace);
});

bench("calculateErc8042 - medium namespace - voltaire", () => {
	Storage.calculateErc8042(keccak256, mediumNamespace);
});

bench("calculateErc8042 - long namespace - voltaire", () => {
	Storage.calculateErc8042(keccak256, longNamespace);
});

await run();

// ============================================================================
// Benchmarks - ERC-8042 Diamond Facets
// ============================================================================

bench("calculateErc8042 - DiamondCutFacet - voltaire", () => {
	Storage.calculateErc8042(keccak256, diamondFacet1);
});

bench("calculateErc8042 - DiamondLoupeFacet - voltaire", () => {
	Storage.calculateErc8042(keccak256, diamondFacet2);
});

bench("calculateErc8042 - OwnershipFacet - voltaire", () => {
	Storage.calculateErc8042(keccak256, diamondFacet3);
});

await run();

// ============================================================================
// Benchmarks - Comparison ERC-7201 vs ERC-8042
// ============================================================================

bench("ERC-7201 vs ERC-8042 - same input (7201) - voltaire", () => {
	Storage.calculateErc7201(keccak256, customNamespace1);
});

bench("ERC-7201 vs ERC-8042 - same input (8042) - voltaire", () => {
	Storage.calculateErc8042(keccak256, customNamespace1);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("calculateErc7201 x10 different namespaces - voltaire", () => {
	Storage.calculateErc7201(keccak256, ozErc20);
	Storage.calculateErc7201(keccak256, ozErc721);
	Storage.calculateErc7201(keccak256, ozAccessControl);
	Storage.calculateErc7201(keccak256, ozReentrancyGuard);
	Storage.calculateErc7201(keccak256, diamondFacet1);
	Storage.calculateErc7201(keccak256, diamondFacet2);
	Storage.calculateErc7201(keccak256, diamondFacet3);
	Storage.calculateErc7201(keccak256, customNamespace1);
	Storage.calculateErc7201(keccak256, customNamespace2);
	Storage.calculateErc7201(keccak256, customNamespace3);
});

bench("calculateErc8042 x10 different namespaces - voltaire", () => {
	Storage.calculateErc8042(keccak256, ozErc20);
	Storage.calculateErc8042(keccak256, ozErc721);
	Storage.calculateErc8042(keccak256, ozAccessControl);
	Storage.calculateErc8042(keccak256, ozReentrancyGuard);
	Storage.calculateErc8042(keccak256, diamondFacet1);
	Storage.calculateErc8042(keccak256, diamondFacet2);
	Storage.calculateErc8042(keccak256, diamondFacet3);
	Storage.calculateErc8042(keccak256, customNamespace1);
	Storage.calculateErc8042(keccak256, customNamespace2);
	Storage.calculateErc8042(keccak256, customNamespace3);
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("calculateErc7201 - empty string - voltaire", () => {
	Storage.calculateErc7201(keccak256, "");
});

bench("calculateErc8042 - empty string - voltaire", () => {
	Storage.calculateErc8042(keccak256, "");
});

bench("calculateErc7201 - numeric namespace - voltaire", () => {
	Storage.calculateErc7201(keccak256, longNumericNamespace);
});

bench("calculateErc8042 - numeric namespace - voltaire", () => {
	Storage.calculateErc8042(keccak256, longNumericNamespace);
});

await run();

// ============================================================================
// Benchmarks - Storage.from
// ============================================================================

bench("Storage.from - zero slot - voltaire", () => {
	Storage.from(0n);
});

bench("Storage.from - small slot - voltaire", () => {
	Storage.from(42n);
});

bench("Storage.from - large slot - voltaire", () => {
	Storage.from(
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	);
});

bench("Storage.from - from number - voltaire", () => {
	Storage.from(1000000);
});

bench("Storage.from - from hex string - voltaire", () => {
	Storage.from("0x1234567890abcdef");
});

await run();
