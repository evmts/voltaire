/**
 * ProtocolVersion Benchmarks: Voltaire TS
 *
 * Compares performance of protocol version operations.
 * ProtocolVersion represents Ethereum protocol versions (eth/66, eth/67, etc).
 */

import { bench, run } from "mitata";
import * as ProtocolVersion from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Protocol version strings
const ETH_66_STR = "eth/66";
const ETH_67_STR = "eth/67";
const ETH_68_STR = "eth/68";
const SNAP_1_STR = "snap/1";

// Pre-created versions
const _eth66 = ProtocolVersion.from(ETH_66_STR);
const _eth67 = ProtocolVersion.from(ETH_67_STR);
const _eth68 = ProtocolVersion.from(ETH_68_STR);
const _snap1 = ProtocolVersion.from(SNAP_1_STR);

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - eth/66 - voltaire", () => {
	ProtocolVersion.from(ETH_66_STR);
});

bench("from - eth/67 - voltaire", () => {
	ProtocolVersion.from(ETH_67_STR);
});

bench("from - eth/68 - voltaire", () => {
	ProtocolVersion.from(ETH_68_STR);
});

bench("from - snap/1 - voltaire", () => {
	ProtocolVersion.from(SNAP_1_STR);
});

await run();

// ============================================================================
// toString benchmarks
// ============================================================================

bench("toString - eth/66 - voltaire", () => {
	ProtocolVersion.toString(ETH_66_STR);
});

bench("toString - eth/67 - voltaire", () => {
	ProtocolVersion.toString(ETH_67_STR);
});

bench("toString - eth/68 - voltaire", () => {
	ProtocolVersion.toString(ETH_68_STR);
});

await run();

// ============================================================================
// equals benchmarks
// ============================================================================

bench("equals - same version - voltaire", () => {
	ProtocolVersion.equals(ETH_68_STR, ETH_68_STR);
});

bench("equals - different version - voltaire", () => {
	ProtocolVersion.equals(ETH_66_STR, ETH_68_STR);
});

bench("equals - different protocol - voltaire", () => {
	ProtocolVersion.equals(ETH_68_STR, SNAP_1_STR);
});

await run();

// ============================================================================
// compare benchmarks
// ============================================================================

bench("compare - same - voltaire", () => {
	ProtocolVersion.compare(ETH_68_STR, ETH_68_STR);
});

bench("compare - lower - voltaire", () => {
	ProtocolVersion.compare(ETH_66_STR, ETH_68_STR);
});

bench("compare - higher - voltaire", () => {
	ProtocolVersion.compare(ETH_68_STR, ETH_66_STR);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const versions = [ETH_66_STR, ETH_67_STR, ETH_68_STR, SNAP_1_STR];

bench("from - 4 versions - voltaire", () => {
	for (const v of versions) {
		ProtocolVersion.from(v);
	}
});

await run();

bench("toString - 4 versions - voltaire", () => {
	for (const v of versions) {
		ProtocolVersion.toString(v);
	}
});

await run();

// Protocol negotiation simulation
bench("compare - 4x4 negotiation - voltaire", () => {
	for (const local of versions) {
		for (const remote of versions) {
			ProtocolVersion.compare(local, remote);
		}
	}
});

await run();
