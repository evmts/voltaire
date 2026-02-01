/**
 * Benchmark: ChainId operations
 * Tests chain ID validation, lookup, and comparison
 */

import { bench, run } from "mitata";
import * as ChainId from "./index.js";

// Test data
const mainnetId = 1;
const arbitrumId = 42161;
const unknownId = 999999;

// Pre-created chain IDs for comparison
const chainId1 = ChainId.from(1);
const chainId2 = ChainId.from(10);
const chainIdSame = ChainId.from(1);

// ============================================================================
// from (constructor)
// ============================================================================

bench("ChainId.from - mainnet - voltaire", () => {
	ChainId.from(mainnetId);
});

bench("ChainId.from - arbitrum - voltaire", () => {
	ChainId.from(arbitrumId);
});

bench("ChainId.from - unknown - voltaire", () => {
	ChainId.from(unknownId);
});

await run();

// ============================================================================
// isMainnet
// ============================================================================

bench("ChainId.isMainnet - true - voltaire", () => {
	ChainId.isMainnet(mainnetId);
});

bench("ChainId.isMainnet - false - voltaire", () => {
	ChainId.isMainnet(arbitrumId);
});

await run();

// ============================================================================
// isKnownChain
// ============================================================================

bench("ChainId.isKnownChain - known - voltaire", () => {
	ChainId.isKnownChain(mainnetId);
});

bench("ChainId.isKnownChain - unknown - voltaire", () => {
	ChainId.isKnownChain(unknownId);
});

await run();

// ============================================================================
// getChainName
// ============================================================================

bench("ChainId.getChainName - mainnet - voltaire", () => {
	ChainId.getChainName(mainnetId);
});

bench("ChainId.getChainName - arbitrum - voltaire", () => {
	ChainId.getChainName(arbitrumId);
});

bench("ChainId.getChainName - unknown - voltaire", () => {
	ChainId.getChainName(unknownId);
});

await run();

// ============================================================================
// equals
// ============================================================================

bench("ChainId.equals - same - voltaire", () => {
	ChainId.equals(mainnetId, mainnetId);
});

bench("ChainId.equals - different - voltaire", () => {
	ChainId.equals(mainnetId, arbitrumId);
});

await run();

// ============================================================================
// toNumber
// ============================================================================

bench("ChainId.toNumber - voltaire", () => {
	ChainId.toNumber(mainnetId);
});

await run();
