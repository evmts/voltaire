/**
 * Primality Testing with ModExp
 *
 * Modular exponentiation is the core operation in probabilistic
 * primality tests like Fermat and Miller-Rabin.
 *
 * These tests are crucial for:
 * - RSA key generation (finding large primes)
 * - Cryptographic parameter validation
 * - Number theory applications
 */

import { ModExp } from "@tevm/voltaire";

/**
 * Fermat primality test
 * @param n - Number to test
 * @param witness - Base to use as witness
 * @returns true if probably prime, false if definitely composite
 */
function fermatTest(n: bigint, witness: bigint): boolean {
	if (n < 2n) return false;
	if (n === 2n) return true;
	if (n % 2n === 0n) return false;

	// Compute witness^(n-1) mod n
	const result = ModExp.modexp(witness, n - 1n, n);
	return result === 1n;
}

// Test known primes
const knownPrimes = [7n, 11n, 13n, 7919n, 104729n];
for (const p of knownPrimes) {
	const isPrime = fermatTest(p, 2n);
}

// Test known composites
const knownComposites = [4n, 9n, 15n, 100n, 7920n];
for (const c of knownComposites) {
	const isPrime = fermatTest(c, 2n);
}

// 561 = 3 * 11 * 17 is the smallest Carmichael number
const carmichael = 561n;
const witnesses = [2n, 3n, 5n, 7n, 11n, 13n];
for (const w of witnesses) {
	if (carmichael % w !== 0n) {
		// Only test if coprime
		const result = fermatTest(carmichael, w);
	}
}

/**
 * Miller-Rabin primality test
 * @param n - Number to test
 * @param witness - Witness to use
 * @returns true if probably prime, false if definitely composite
 */
function millerRabinTest(n: bigint, witness: bigint): boolean {
	if (n < 2n) return false;
	if (n === 2n || n === 3n) return true;
	if (n % 2n === 0n) return false;

	// Write n-1 as 2^r * d where d is odd
	let d = n - 1n;
	let r = 0n;
	while (d % 2n === 0n) {
		d /= 2n;
		r++;
	}

	// Compute witness^d mod n
	let x = ModExp.modexp(witness, d, n);

	if (x === 1n || x === n - 1n) {
		return true; // Probably prime
	}

	// Square r-1 times
	for (let i = 1n; i < r; i++) {
		x = ModExp.modexp(x, 2n, n);
		if (x === n - 1n) {
			return true; // Probably prime
		}
		if (x === 1n) {
			return false; // Definitely composite
		}
	}

	return false; // Definitely composite
}
for (const w of witnesses) {
	const result = millerRabinTest(carmichael, w);
}

/**
 * Multiple rounds of Miller-Rabin for higher confidence
 * Error probability <= 4^(-rounds)
 */
function isProbablyPrime(n: bigint, rounds = 10): boolean {
	if (n < 2n) return false;
	if (n === 2n || n === 3n) return true;
	if (n % 2n === 0n) return false;

	// Deterministic witnesses for numbers < 3,317,044,064,679,887,385,961,981
	const deterministicWitnesses = [
		2n,
		3n,
		5n,
		7n,
		11n,
		13n,
		17n,
		19n,
		23n,
		29n,
		31n,
		37n,
	];

	for (let i = 0; i < rounds && i < deterministicWitnesses.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: loop bounds checked
		const w = deterministicWitnesses[i]!;
		if (w >= n) continue;
		if (!millerRabinTest(n, w)) {
			return false;
		}
	}
	return true;
}
const testNumbers = [
	{ n: 7919n, expected: true },
	{ n: 7920n, expected: false },
	{ n: 104729n, expected: true },
	{ n: 561n, expected: false }, // Carmichael
	{ n: 2n ** 31n - 1n, expected: true }, // Mersenne prime
	{ n: 2n ** 61n - 1n, expected: true }, // Mersenne prime
];

for (const { n, expected } of testNumbers) {
	const result = isProbablyPrime(n, 10);
	const status = result === expected ? "OK" : "WRONG";
}

/**
 * Find next prime >= start
 */
function nextPrime(start: bigint): bigint {
	let candidate = start % 2n === 0n ? start + 1n : start;
	while (!isProbablyPrime(candidate, 10)) {
		candidate += 2n;
	}
	return candidate;
}

const startSearch = 1000000000000n;
const foundPrime = nextPrime(startSearch);

// Verify by checking small factor
const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
const hasSmallFactor = smallPrimes.some((p) => foundPrime % p === 0n);

const largeCandidate = 2n ** 127n - 1n; // Mersenne prime M127

const startFermat = performance.now();
const fermatResult = fermatTest(largeCandidate, 2n);
const fermatTime = performance.now() - startFermat;

const startMR = performance.now();
const mrResult = isProbablyPrime(largeCandidate, 5);
const mrTime = performance.now() - startMR;
