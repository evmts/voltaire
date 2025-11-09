/**
 * Authorization Performance Benchmarks
 *
 * Measures performance of EIP-7702 authorization operations
 */

import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedAuthorization } from "../Authorization/BrandedAuthorization/BrandedAuthorization.js";
import * as Authorization from "../Authorization/index.js";

// Benchmark runner
interface BenchmarkResult {
	name: string;
	opsPerSec: number;
	avgTimeMs: number;
	iterations: number;
}

function benchmark(
	name: string,
	fn: () => void,
	duration = 2000,
): BenchmarkResult {
	// Warmup
	for (let i = 0; i < 100; i++) {
		try {
			fn();
		} catch {
			// Ignore errors during warmup
		}
	}

	// Benchmark
	const startTime = performance.now();
	let iterations = 0;
	let endTime = startTime;

	while (endTime - startTime < duration) {
		try {
			fn();
		} catch {
			// Count iteration even if it throws
		}
		iterations++;
		endTime = performance.now();
	}

	const totalTime = endTime - startTime;
	const avgTimeMs = totalTime / iterations;
	const opsPerSec = (iterations / totalTime) * 1000;

	return {
		name,
		opsPerSec,
		avgTimeMs,
		iterations,
	};
}

// ============================================================================
// Test Data
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return Object.assign(bytes, { bytes }) as unknown as BrandedAddress;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);

const validAuth: BrandedAuthorization = {
	chainId: 1n,
	address: addr1,
	nonce: 0n,
	yParity: 0,
	r: 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn,
	s: 0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210n,
};

const validUnsigned: {
	chainId: bigint;
	address: BrandedAddress;
	nonce: bigint;
} = {
	chainId: 1n,
	address: addr1,
	nonce: 0n,
};

// Small list
const smallList: BrandedAuthorization[] = [
	{
		chainId: 1n,
		address: addr1,
		nonce: 0n,
		yParity: 0,
		r: 0x123n,
		s: 0x456n,
	},
	{
		chainId: 1n,
		address: addr2,
		nonce: 1n,
		yParity: 1,
		r: 0x789n,
		s: 0xabcn,
	},
];

// Medium list
const mediumList: BrandedAuthorization[] = [];
for (let i = 0; i < 10; i++) {
	mediumList.push({
		chainId: 1n,
		address: createAddress(i),
		nonce: BigInt(i),
		yParity: i % 2,
		r: BigInt(i * 2 + 1),
		s: BigInt(i * 2 + 2),
	});
}

// Large list
const largeList: BrandedAuthorization[] = [];
for (let i = 0; i < 100; i++) {
	largeList.push({
		chainId: 1n,
		address: createAddress(i % 50),
		nonce: BigInt(i),
		yParity: i % 2,
		r: BigInt(i * 2 + 1),
		s: BigInt(i * 2 + 2),
	});
}

const results: BenchmarkResult[] = [];
results.push(
	benchmark("isItem - valid", () => Authorization.isItem(validAuth)),
);
results.push(
	benchmark("isItem - invalid (null)", () => Authorization.isItem(null)),
);
results.push(
	benchmark("isItem - invalid (partial)", () =>
		Authorization.isItem({ chainId: 1n }),
	),
);
results.push(
	benchmark("isUnsigned - valid", () =>
		Authorization.isUnsigned(validUnsigned),
	),
);
results.push(
	benchmark("isUnsigned - invalid (null)", () =>
		Authorization.isUnsigned(null),
	),
);

const invalidChainAuth = { ...validAuth, chainId: 0n };
const invalidAddressAuth = { ...validAuth, address: createAddress(0) };
const invalidYParityAuth = { ...validAuth, yParity: 2 };
const invalidRAuth = { ...validAuth, r: 0n };
results.push(
	benchmark("validate - valid", () => Authorization.validate.call(validAuth)),
);
results.push(
	benchmark("validate - invalid chain ID", () => {
		try {
			Authorization.validate.call(invalidChainAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid address", () => {
		try {
			Authorization.validate.call(invalidAddressAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid yParity", () => {
		try {
			Authorization.validate.call(invalidYParityAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("validate - invalid r", () => {
		try {
			Authorization.validate.call(invalidRAuth);
		} catch {
			// Expected
		}
	}),
);
results.push(
	benchmark("calculateGasCost - empty list", () =>
		Authorization.calculateGasCost.call([], 0),
	),
);
results.push(
	benchmark("calculateGasCost - small list", () =>
		Authorization.calculateGasCost.call(smallList, 1),
	),
);
results.push(
	benchmark("calculateGasCost - medium list", () =>
		Authorization.calculateGasCost.call(mediumList, 5),
	),
);
results.push(
	benchmark("calculateGasCost - large list", () =>
		Authorization.calculateGasCost.call(largeList, 50),
	),
);
results.push(
	benchmark("getGasCost - not empty", () =>
		Authorization.getGasCost.call(validAuth, false),
	),
);
results.push(
	benchmark("getGasCost - empty account", () =>
		Authorization.getGasCost.call(validAuth, true),
	),
);
results.push(
	benchmark("hash", () => {
		try {
			Authorization.hash.call(validUnsigned);
		} catch {
			// Expected - not implemented
		}
	}),
);

const privateKey = new Uint8Array(32);
results.push(
	benchmark("sign", () => {
		try {
			Authorization.sign.call(validUnsigned, privateKey);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("verify", () => {
		try {
			Authorization.verify.call(validAuth);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("process", () => {
		try {
			Authorization.process.call(validAuth);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("processAll - empty", () => Authorization.processAll.call([])),
);
results.push(
	benchmark("processAll - small list", () => {
		try {
			Authorization.processAll.call(smallList);
		} catch {
			// Expected - not implemented
		}
	}),
);
results.push(
	benchmark("format - signed", () => Authorization.format.call(validAuth)),
);
results.push(
	benchmark("format - unsigned", () =>
		Authorization.format.call(validUnsigned),
	),
);
const auth2 = { ...validAuth };
const auth3 = { ...validAuth, nonce: 1n };
results.push(
	benchmark("equals - same", () => Authorization.equals.call(validAuth, auth2)),
);
results.push(
	benchmark("equals - different", () =>
		Authorization.equals.call(validAuth, auth3),
	),
);

// Find fastest and slowest operations
const sorted = [...results].sort((a, b) => b.opsPerSec - a.opsPerSec);

// Export results for analysis
if (typeof Bun !== "undefined") {
	const resultsFile =
		"/Users/williamcory/primitives/src/primitives/authorization-results.json";
	await Bun.write(resultsFile, JSON.stringify(results, null, 2));
}
