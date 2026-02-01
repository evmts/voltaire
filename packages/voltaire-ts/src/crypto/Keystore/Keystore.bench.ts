/**
 * Benchmark: Keystore (Web3 Secret Storage) operations
 * Compares performance of keystore encrypt/decrypt operations
 *
 * Note: These operations are intentionally slow due to key derivation (scrypt/pbkdf2)
 */

import { bench, run } from "mitata";
import { Keystore } from "./index.js";

// Test data
const privateKey = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	privateKey[i] = i + 1;
}
const password = "test-password-123";

// Pre-encrypt for decryption benchmarks
// Using minimal iterations for benchmarking (real usage should use higher values)
const minimalScryptOptions = {
	kdf: "scrypt" as const,
	kdfparams: {
		n: 2, // Very low for benchmarks - real usage should be 262144+
		r: 8,
		p: 1,
		dklen: 32,
	},
};

const minimalPbkdf2Options = {
	kdf: "pbkdf2" as const,
	kdfparams: {
		c: 100, // Very low for benchmarks - real usage should be 262144+
		prf: "hmac-sha256" as const,
		dklen: 32,
	},
};

// Pre-encrypt keystores
const scryptKeystore = await Keystore.encrypt(
	privateKey,
	password,
	minimalScryptOptions,
);
const pbkdf2Keystore = await Keystore.encrypt(
	privateKey,
	password,
	minimalPbkdf2Options,
);

// ============================================================================
// Encryption Benchmarks - Scrypt (minimal iterations)
// ============================================================================

bench("encrypt - scrypt (n=2) - Voltaire", async () => {
	await Keystore.encrypt(privateKey, password, minimalScryptOptions);
});

await run();

// ============================================================================
// Encryption Benchmarks - PBKDF2 (minimal iterations)
// ============================================================================

bench("encrypt - pbkdf2 (c=100) - Voltaire", async () => {
	await Keystore.encrypt(privateKey, password, minimalPbkdf2Options);
});

await run();

// ============================================================================
// Decryption Benchmarks
// ============================================================================

bench("decrypt - scrypt (n=2) - Voltaire", async () => {
	await Keystore.decrypt(scryptKeystore, password);
});

await run();

bench("decrypt - pbkdf2 (c=100) - Voltaire", async () => {
	await Keystore.decrypt(pbkdf2Keystore, password);
});

await run();

// ============================================================================
// Round-trip Benchmarks
// ============================================================================

bench("roundtrip - scrypt (n=2) - Voltaire", async () => {
	const ks = await Keystore.encrypt(privateKey, password, minimalScryptOptions);
	await Keystore.decrypt(ks, password);
});

await run();

bench("roundtrip - pbkdf2 (c=100) - Voltaire", async () => {
	const ks = await Keystore.encrypt(privateKey, password, minimalPbkdf2Options);
	await Keystore.decrypt(ks, password);
});

await run();

// ============================================================================
// Higher Iteration Benchmarks (more realistic but slower)
// Skip in CI - run manually for realistic performance numbers
// ============================================================================

if (process.env.BENCH_REALISTIC === "true") {
	const realisticScryptOptions = {
		kdf: "scrypt" as const,
		kdfparams: {
			n: 8192, // Still lower than production (262144) for reasonable bench time
			r: 8,
			p: 1,
			dklen: 32,
		},
	};

	const realisticPbkdf2Options = {
		kdf: "pbkdf2" as const,
		kdfparams: {
			c: 10000,
			prf: "hmac-sha256" as const,
			dklen: 32,
		},
	};

	bench("encrypt - scrypt (n=8192) - Voltaire", async () => {
		await Keystore.encrypt(privateKey, password, realisticScryptOptions);
	});

	await run();

	bench("encrypt - pbkdf2 (c=10000) - Voltaire", async () => {
		await Keystore.encrypt(privateKey, password, realisticPbkdf2Options);
	});

	await run();
}
