/**
 * ForkId Benchmarks: Voltaire TS
 *
 * Compares performance of ForkId operations.
 * ForkId identifies network forks per EIP-2124 for peer discovery.
 */

import { bench, run } from "mitata";
import * as ForkId from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Mainnet fork IDs (crc32 + next fork block)
const CANCUN_FORK_ID = {
	hash: 0x9f3d2254,
	next: 0n,
};

const SHANGHAI_FORK_ID = {
	hash: 0xdce96c2d,
	next: 1681338455n, // Cancun timestamp
};

const PARIS_FORK_ID = {
	hash: 0xb715077d,
	next: 17034870n, // Shanghai block
};

const LONDON_FORK_ID = {
	hash: 0x20c327fc,
	next: 15537394n, // Paris block
};

// Sepolia fork IDs
const SEPOLIA_CANCUN = {
	hash: 0x132bc63e,
	next: 0n,
};

// Pre-created ForkIds
const cancunFork = ForkId.from(CANCUN_FORK_ID);
const shanghaiFork = ForkId.from(SHANGHAI_FORK_ID);
const parisFork = ForkId.from(PARIS_FORK_ID);
const londonFork = ForkId.from(LONDON_FORK_ID);

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - Cancun (latest) - voltaire", () => {
	ForkId.from(CANCUN_FORK_ID);
});

bench("from - Shanghai - voltaire", () => {
	ForkId.from(SHANGHAI_FORK_ID);
});

bench("from - Paris - voltaire", () => {
	ForkId.from(PARIS_FORK_ID);
});

bench("from - London - voltaire", () => {
	ForkId.from(LONDON_FORK_ID);
});

await run();

bench("from - Sepolia Cancun - voltaire", () => {
	ForkId.from(SEPOLIA_CANCUN);
});

await run();

// ============================================================================
// toBytes benchmarks
// ============================================================================

bench("toBytes - Cancun - voltaire", () => {
	ForkId.toBytes(CANCUN_FORK_ID);
});

bench("toBytes - Shanghai - voltaire", () => {
	ForkId.toBytes(SHANGHAI_FORK_ID);
});

bench("toBytes - Paris - voltaire", () => {
	ForkId.toBytes(PARIS_FORK_ID);
});

await run();

// ============================================================================
// matches benchmarks
// ============================================================================

bench("matches - same fork - voltaire", () => {
	ForkId.matches(CANCUN_FORK_ID, CANCUN_FORK_ID);
});

bench("matches - compatible forks - voltaire", () => {
	ForkId.matches(SHANGHAI_FORK_ID, CANCUN_FORK_ID);
});

bench("matches - different forks - voltaire", () => {
	ForkId.matches(LONDON_FORK_ID, CANCUN_FORK_ID);
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const mainnetForks = [
	CANCUN_FORK_ID,
	SHANGHAI_FORK_ID,
	PARIS_FORK_ID,
	LONDON_FORK_ID,
];

bench("from - 4 mainnet forks - voltaire", () => {
	for (const fork of mainnetForks) {
		ForkId.from(fork);
	}
});

await run();

bench("toBytes - 4 mainnet forks - voltaire", () => {
	for (const fork of mainnetForks) {
		ForkId.toBytes(fork);
	}
});

await run();

// Peer compatibility check simulation
bench("matches - 4x4 compatibility check - voltaire", () => {
	for (const local of mainnetForks) {
		for (const remote of mainnetForks) {
			ForkId.matches(local, remote);
		}
	}
});

await run();
