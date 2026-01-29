/**
 * StateDiff Module Benchmarks
 *
 * Measures performance of state diff operations
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import * as StateDiff from "./index.js";
import type { AccountDiff, StateDiffType } from "./StateDiffType.js";

// ============================================================================
// Test Data - Realistic state diffs
// ============================================================================

function createAddress(byte: number): AddressType {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as AddressType;
}

function createHash(seed: number): Uint8Array {
	const hash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		hash[i] = (seed + i * 7) % 256;
	}
	return hash;
}

// Common addresses
const addr1 = createAddress(0x01);
const addr2 = createAddress(0x02);
const addr3 = createAddress(0x03);
const addr4 = createAddress(0x04);
const addr5 = createAddress(0x05);

// Simple account diff (balance change only)
const simpleAccountDiff: AccountDiff = {
	balance: {
		from: 1000000000000000000n,
		to: 900000000000000000n,
	},
};

// Complex account diff (all fields)
const complexAccountDiff: AccountDiff = {
	nonce: {
		from: 5n,
		to: 6n,
	},
	balance: {
		from: 1000000000000000000n,
		to: 900000000000000000n,
	},
	code: {
		from: createHash(100),
		to: createHash(200),
	},
	storage: new Map([
		[0n, { from: createHash(10), to: createHash(11) }],
		[1n, { from: createHash(20), to: createHash(21) }],
		[2n, { from: createHash(30), to: createHash(31) }],
	]),
};

// Empty state diff
const emptyDiff = new Map<AddressType, AccountDiff>();

// Small state diff (1 account)
const smallDiff = new Map<AddressType, AccountDiff>([
	[addr1, simpleAccountDiff],
]);

// Medium state diff (5 accounts)
const mediumDiff = new Map<AddressType, AccountDiff>([
	[addr1, simpleAccountDiff],
	[addr2, { balance: { from: 500n, to: 600n } }],
	[addr3, { nonce: { from: 0n, to: 1n } }],
	[addr4, complexAccountDiff],
	[addr5, { balance: { from: 0n, to: 1000000000000000000n } }],
]);

// Large state diff (20 accounts)
const largeDiff = new Map<AddressType, AccountDiff>();
for (let i = 0; i < 20; i++) {
	largeDiff.set(createAddress(i + 10), {
		balance: { from: BigInt(i * 1000), to: BigInt(i * 1000 + 500) },
		nonce: { from: BigInt(i), to: BigInt(i + 1) },
	});
}

// State diff with storage changes
const storageDiff = new Map<AddressType, AccountDiff>();
const storageChanges = new Map<bigint, { from: Uint8Array; to: Uint8Array }>();
for (let i = 0; i < 10; i++) {
	storageChanges.set(BigInt(i), {
		from: createHash(i * 10),
		to: createHash(i * 10 + 1),
	});
}
storageDiff.set(addr1, {
	storage: storageChanges,
});

// ============================================================================
// Benchmarks - StateDiff.from
// ============================================================================

bench("StateDiff.from - empty - voltaire", () => {
	StateDiff.from(new Map());
});

bench("StateDiff.from - small (1 account) - voltaire", () => {
	StateDiff.from(smallDiff);
});

bench("StateDiff.from - medium (5 accounts) - voltaire", () => {
	StateDiff.from(mediumDiff);
});

bench("StateDiff.from - large (20 accounts) - voltaire", () => {
	StateDiff.from(largeDiff);
});

bench("StateDiff.from - with storage changes - voltaire", () => {
	StateDiff.from(storageDiff);
});

await run();

// ============================================================================
// Benchmarks - StateDiff.isEmpty
// ============================================================================

const emptyStateDiff = StateDiff.from(emptyDiff);
const smallStateDiff = StateDiff.from(smallDiff);
const mediumStateDiff = StateDiff.from(mediumDiff);
const largeStateDiff = StateDiff.from(largeDiff);

bench("StateDiff.isEmpty - empty - voltaire", () => {
	StateDiff.isEmpty(emptyStateDiff);
});

bench("StateDiff.isEmpty - small - voltaire", () => {
	StateDiff.isEmpty(smallStateDiff);
});

bench("StateDiff.isEmpty - medium - voltaire", () => {
	StateDiff.isEmpty(mediumStateDiff);
});

bench("StateDiff.isEmpty - large - voltaire", () => {
	StateDiff.isEmpty(largeStateDiff);
});

await run();

// ============================================================================
// Benchmarks - StateDiff.getAddresses
// ============================================================================

bench("StateDiff.getAddresses - empty - voltaire", () => {
	StateDiff.getAddresses(emptyStateDiff);
});

bench("StateDiff.getAddresses - small - voltaire", () => {
	StateDiff.getAddresses(smallStateDiff);
});

bench("StateDiff.getAddresses - medium - voltaire", () => {
	StateDiff.getAddresses(mediumStateDiff);
});

bench("StateDiff.getAddresses - large - voltaire", () => {
	StateDiff.getAddresses(largeStateDiff);
});

await run();

// ============================================================================
// Benchmarks - StateDiff.getAccount
// ============================================================================

bench("StateDiff.getAccount - existing (small) - voltaire", () => {
	StateDiff.getAccount(smallStateDiff, addr1);
});

bench("StateDiff.getAccount - non-existing (small) - voltaire", () => {
	StateDiff.getAccount(smallStateDiff, createAddress(0xff));
});

bench("StateDiff.getAccount - existing (medium) - voltaire", () => {
	StateDiff.getAccount(mediumStateDiff, addr3);
});

bench("StateDiff.getAccount - existing (large) - voltaire", () => {
	StateDiff.getAccount(largeStateDiff, createAddress(15));
});

bench("StateDiff.getAccount - non-existing (large) - voltaire", () => {
	StateDiff.getAccount(largeStateDiff, createAddress(0xff));
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("StateDiff.getAccount x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		StateDiff.getAccount(largeStateDiff, createAddress(10 + i));
	}
});

bench("StateDiff.from + getAddresses - medium - voltaire", () => {
	const diff = StateDiff.from(mediumDiff);
	StateDiff.getAddresses(diff);
});

bench("StateDiff.from + isEmpty + getAddresses - voltaire", () => {
	const diff = StateDiff.from(mediumDiff);
	StateDiff.isEmpty(diff);
	StateDiff.getAddresses(diff);
});

await run();

// ============================================================================
// Benchmarks - Full Workflow
// ============================================================================

bench("StateDiff workflow - create, check, query - voltaire", () => {
	// Create diff
	const diff = StateDiff.from(mediumDiff);
	// Check if empty
	StateDiff.isEmpty(diff);
	// Get addresses
	const addresses = StateDiff.getAddresses(diff);
	// Query each account
	for (const addr of addresses) {
		StateDiff.getAccount(diff, addr);
	}
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("StateDiff.from - single storage change - voltaire", () => {
	const singleStorage = new Map<AddressType, AccountDiff>();
	singleStorage.set(addr1, {
		storage: new Map([[0n, { from: createHash(0), to: createHash(1) }]]),
	});
	StateDiff.from(singleStorage);
});

bench("StateDiff.from - only nonce changes - voltaire", () => {
	const nonceOnly = new Map<AddressType, AccountDiff>();
	for (let i = 0; i < 5; i++) {
		nonceOnly.set(createAddress(i + 50), {
			nonce: { from: BigInt(i), to: BigInt(i + 1) },
		});
	}
	StateDiff.from(nonceOnly);
});

bench("StateDiff.from - only balance changes - voltaire", () => {
	const balanceOnly = new Map<AddressType, AccountDiff>();
	for (let i = 0; i < 5; i++) {
		balanceOnly.set(createAddress(i + 60), {
			balance: { from: BigInt(i * 1000), to: BigInt(i * 1000 + 100) },
		});
	}
	StateDiff.from(balanceOnly);
});

await run();
