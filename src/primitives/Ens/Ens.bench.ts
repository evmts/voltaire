/**
 * Benchmark: ENS name operations
 * Compares voltaire ENS normalization, namehash, and labelhash
 */

import { bench, run } from "mitata";
import { namehash as viemNamehash, normalize as viemNormalize } from "viem/ens";
import * as Ens from "./index.js";

// Test data
const simpleName = "vitalik.eth";
const complexName = "sub.domain.example.eth";
const unicodeName = "brantly.eth";
const longName = "this.is.a.very.long.subdomain.chain.example.eth";

// Pre-normalized names for namehash benchmarks
const normalizedSimple = Ens.normalize(simpleName);
const normalizedComplex = Ens.normalize(complexName);
const normalizedLong = Ens.normalize(longName);

// ============================================================================
// normalize
// ============================================================================

bench("Ens.normalize - simple (vitalik.eth) - voltaire", () => {
	Ens.normalize(simpleName);
});

bench("Ens.normalize - simple (vitalik.eth) - viem", () => {
	viemNormalize(simpleName);
});

await run();

bench("Ens.normalize - complex subdomain - voltaire", () => {
	Ens.normalize(complexName);
});

bench("Ens.normalize - complex subdomain - viem", () => {
	viemNormalize(complexName);
});

await run();

bench("Ens.normalize - long chain - voltaire", () => {
	Ens.normalize(longName);
});

bench("Ens.normalize - long chain - viem", () => {
	viemNormalize(longName);
});

await run();

// ============================================================================
// namehash
// ============================================================================

bench("Ens.namehash - simple (vitalik.eth) - voltaire", () => {
	Ens.namehash(normalizedSimple);
});

bench("Ens.namehash - simple (vitalik.eth) - viem", () => {
	viemNamehash(simpleName);
});

await run();

bench("Ens.namehash - complex subdomain - voltaire", () => {
	Ens.namehash(normalizedComplex);
});

bench("Ens.namehash - complex subdomain - viem", () => {
	viemNamehash(complexName);
});

await run();

bench("Ens.namehash - long chain - voltaire", () => {
	Ens.namehash(normalizedLong);
});

bench("Ens.namehash - long chain - viem", () => {
	viemNamehash(longName);
});

await run();

// ============================================================================
// labelhash
// ============================================================================

bench("Ens.labelhash - short label - voltaire", () => {
	Ens.labelhash("vitalik");
});

await run();

bench("Ens.labelhash - long label - voltaire", () => {
	Ens.labelhash("averylonglabelfortesting");
});

await run();

// ============================================================================
// isValid
// ============================================================================

bench("Ens.isValid - valid name - voltaire", () => {
	Ens.isValid(simpleName);
});

bench("Ens.isValid - invalid name - voltaire", () => {
	Ens.isValid("");
});

await run();

// ============================================================================
// Full workflow: normalize + namehash
// ============================================================================

bench("Ens workflow - normalize + namehash - voltaire", () => {
	const normalized = Ens.normalize(simpleName);
	Ens.namehash(normalized);
});

bench("Ens workflow - normalize + namehash - viem", () => {
	const normalized = viemNormalize(simpleName);
	viemNamehash(normalized);
});

await run();
