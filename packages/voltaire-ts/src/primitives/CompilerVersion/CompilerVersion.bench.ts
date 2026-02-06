/**
 * Benchmark: Solidity Compiler Version operations
 * Tests version parsing, comparison, and compatibility checks
 */

import { bench, run } from "mitata";
import * as CompilerVersion from "./index.js";

// Test data
const simpleVersion = "0.8.20";
const complexVersion = "0.8.20+commit.a1b2c3d4";
const prereleaseVersion = "0.8.20-alpha.1";

// Pre-created versions for comparison
const version1 = "0.8.19";
const version2 = "0.8.20";
const version3 = "0.7.6";

// ============================================================================
// from (constructor)
// ============================================================================

bench("CompilerVersion.from - simple - voltaire", () => {
	CompilerVersion.from(simpleVersion);
});

bench("CompilerVersion.from - with commit - voltaire", () => {
	CompilerVersion.from(complexVersion);
});

bench("CompilerVersion.from - prerelease - voltaire", () => {
	CompilerVersion.from(prereleaseVersion);
});

await run();

// ============================================================================
// parse
// ============================================================================

bench("CompilerVersion.parse - simple - voltaire", () => {
	CompilerVersion.parse(simpleVersion);
});

bench("CompilerVersion.parse - with commit - voltaire", () => {
	CompilerVersion.parse(complexVersion);
});

bench("CompilerVersion.parse - prerelease - voltaire", () => {
	CompilerVersion.parse(prereleaseVersion);
});

await run();

// ============================================================================
// getMajor / getMinor / getPatch
// ============================================================================

bench("CompilerVersion.getMajor - voltaire", () => {
	CompilerVersion.getMajor(simpleVersion);
});

bench("CompilerVersion.getMinor - voltaire", () => {
	CompilerVersion.getMinor(simpleVersion);
});

bench("CompilerVersion.getPatch - voltaire", () => {
	CompilerVersion.getPatch(simpleVersion);
});

await run();

// ============================================================================
// compare
// ============================================================================

bench("CompilerVersion.compare - equal - voltaire", () => {
	CompilerVersion.compare(version1, version1);
});

bench("CompilerVersion.compare - less than - voltaire", () => {
	CompilerVersion.compare(version1, version2);
});

bench("CompilerVersion.compare - greater than - voltaire", () => {
	CompilerVersion.compare(version2, version1);
});

bench("CompilerVersion.compare - major difference - voltaire", () => {
	CompilerVersion.compare(version2, version3);
});

await run();

// ============================================================================
// isCompatible
// ============================================================================

bench("CompilerVersion.isCompatible - exact match - voltaire", () => {
	CompilerVersion.isCompatible(version2, "0.8.20");
});

bench("CompilerVersion.isCompatible - range ^0.8.0 - voltaire", () => {
	CompilerVersion.isCompatible(version2, "^0.8.0");
});

bench("CompilerVersion.isCompatible - range >=0.8.0 - voltaire", () => {
	CompilerVersion.isCompatible(version2, ">=0.8.0");
});

await run();

// ============================================================================
// Full workflow: parse + compare
// ============================================================================

bench("CompilerVersion workflow - parse + compare - voltaire", () => {
	const parsed1 = CompilerVersion.parse(version1);
	const parsed2 = CompilerVersion.parse(version2);
	if (parsed1.major === parsed2.major) {
		CompilerVersion.compare(version1, version2);
	}
});

await run();
