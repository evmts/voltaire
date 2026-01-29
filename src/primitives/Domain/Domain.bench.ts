/**
 * Domain (EIP-712 Domain) Benchmarks - mitata format
 * Compares domain hashing operations
 */

import { bench, run } from "mitata";
import { keccak256 } from "../../crypto/keccak256/index.js";
import * as Domain from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

const crypto = { keccak256 };

// Minimal domain (just name)
const minimalDomain = {
	name: "TestApp",
};

// Basic domain (name + version)
const basicDomain = {
	name: "TestApp",
	version: "1",
};

// Standard domain (name, version, chainId)
const standardDomain = {
	name: "TestApp",
	version: "1",
	chainId: 1,
};

// Full domain (all fields)
const fullDomain = {
	name: "TestApp",
	version: "1",
	chainId: 1,
	verifyingContract: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
};

// Common token domains
const usdcDomain = {
	name: "USD Coin",
	version: "1",
	chainId: 1,
	verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

const uniswapDomain = {
	name: "Uniswap V3",
	version: "1",
	chainId: 1,
	verifyingContract: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
};

// Pre-create Domain instances
const minimalDomainInstance = Domain.from(minimalDomain);
const basicDomainInstance = Domain.from(basicDomain);
const standardDomainInstance = Domain.from(standardDomain);
const fullDomainInstance = Domain.from(fullDomain);
const usdcDomainInstance = Domain.from(usdcDomain);
const uniswapDomainInstance = Domain.from(uniswapDomain);

// ============================================================================
// Domain.from - construction
// ============================================================================

bench("Domain.from - minimal - voltaire", () => {
	Domain.from(minimalDomain);
});

bench("Domain.from - basic - voltaire", () => {
	Domain.from(basicDomain);
});

bench("Domain.from - standard - voltaire", () => {
	Domain.from(standardDomain);
});

bench("Domain.from - full - voltaire", () => {
	Domain.from(fullDomain);
});

await run();

// ============================================================================
// Domain.toHash - domain separator hashing
// ============================================================================

bench("Domain.toHash - minimal - voltaire", () => {
	Domain.toHash(minimalDomainInstance, crypto);
});

bench("Domain.toHash - basic - voltaire", () => {
	Domain.toHash(basicDomainInstance, crypto);
});

bench("Domain.toHash - standard - voltaire", () => {
	Domain.toHash(standardDomainInstance, crypto);
});

bench("Domain.toHash - full - voltaire", () => {
	Domain.toHash(fullDomainInstance, crypto);
});

await run();

// ============================================================================
// Domain.toHash - real-world domains
// ============================================================================

bench("Domain.toHash - USDC - voltaire", () => {
	Domain.toHash(usdcDomainInstance, crypto);
});

bench("Domain.toHash - Uniswap - voltaire", () => {
	Domain.toHash(uniswapDomainInstance, crypto);
});

await run();

// ============================================================================
// Domain.encodeType - type encoding
// ============================================================================

bench("Domain.encodeType - minimal - voltaire", () => {
	Domain.encodeType(
		"EIP712Domain",
		{ EIP712Domain: Domain.getEIP712DomainType(minimalDomainInstance) },
	);
});

bench("Domain.encodeType - full - voltaire", () => {
	Domain.encodeType(
		"EIP712Domain",
		{ EIP712Domain: Domain.getEIP712DomainType(fullDomainInstance) },
	);
});

await run();

// ============================================================================
// Domain.hashType - type hash
// ============================================================================

bench("Domain.hashType - minimal - voltaire", () => {
	Domain.hashType(
		"EIP712Domain",
		{ EIP712Domain: Domain.getEIP712DomainType(minimalDomainInstance) },
		crypto,
	);
});

bench("Domain.hashType - full - voltaire", () => {
	Domain.hashType(
		"EIP712Domain",
		{ EIP712Domain: Domain.getEIP712DomainType(fullDomainInstance) },
		crypto,
	);
});

await run();

// ============================================================================
// Domain.getEIP712DomainType
// ============================================================================

bench("Domain.getEIP712DomainType - minimal - voltaire", () => {
	Domain.getEIP712DomainType(minimalDomainInstance);
});

bench("Domain.getEIP712DomainType - full - voltaire", () => {
	Domain.getEIP712DomainType(fullDomainInstance);
});

await run();

// ============================================================================
// Domain.getFieldsBitmap
// ============================================================================

bench("Domain.getFieldsBitmap - minimal - voltaire", () => {
	Domain.getFieldsBitmap(minimalDomainInstance);
});

bench("Domain.getFieldsBitmap - full - voltaire", () => {
	Domain.getFieldsBitmap(fullDomainInstance);
});

await run();

// ============================================================================
// Domain.toErc5267Response
// ============================================================================

bench("Domain.toErc5267Response - minimal - voltaire", () => {
	Domain.toErc5267Response(minimalDomainInstance);
});

bench("Domain.toErc5267Response - full - voltaire", () => {
	Domain.toErc5267Response(fullDomainInstance);
});

await run();

// ============================================================================
// Round-trip: from + toHash
// ============================================================================

bench("roundtrip (from+toHash) - minimal - voltaire", () => {
	const d = Domain.from(minimalDomain);
	Domain.toHash(d, crypto);
});

bench("roundtrip (from+toHash) - full - voltaire", () => {
	const d = Domain.from(fullDomain);
	Domain.toHash(d, crypto);
});

bench("roundtrip (from+toHash) - USDC - voltaire", () => {
	const d = Domain.from(usdcDomain);
	Domain.toHash(d, crypto);
});

await run();
