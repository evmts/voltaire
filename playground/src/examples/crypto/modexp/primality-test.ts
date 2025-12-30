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

console.log("=== Primality Testing with ModExp ===\n");

// === Fermat Primality Test ===
console.log("--- Fermat Primality Test ---");
console.log("Fermat's Little Theorem: If p is prime and gcd(a,p)=1,");
console.log("then a^(p-1) = 1 (mod p)\n");

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
console.log("Testing known primes with witness 2:");
for (const p of knownPrimes) {
	const isPrime = fermatTest(p, 2n);
	console.log(`  ${p}: ${isPrime ? "probably prime" : "composite"}`);
}

// Test known composites
const knownComposites = [4n, 9n, 15n, 100n, 7920n];
console.log("\nTesting known composites with witness 2:");
for (const c of knownComposites) {
	const isPrime = fermatTest(c, 2n);
	console.log(`  ${c}: ${isPrime ? "FOOL (Carmichael?)" : "composite"}`);
}

// === Carmichael Numbers (Fermat liars) ===
console.log("\n--- Carmichael Numbers ---");
console.log(
	"Carmichael numbers fool the Fermat test for all coprime witnesses.\n",
);

// 561 = 3 * 11 * 17 is the smallest Carmichael number
const carmichael = 561n;
console.log(`Testing ${carmichael} (Carmichael number):`);
const witnesses = [2n, 3n, 5n, 7n, 11n, 13n];
for (const w of witnesses) {
	if (carmichael % w !== 0n) {
		// Only test if coprime
		const result = fermatTest(carmichael, w);
		console.log(
			`  Witness ${w}: ${result ? "FOOLED (false positive)" : "detected"}`,
		);
	}
}

// === Miller-Rabin Primality Test ===
console.log("\n--- Miller-Rabin Primality Test ---");
console.log("More robust than Fermat - can detect Carmichael numbers.\n");

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

// Miller-Rabin on Carmichael number
console.log(`Testing Carmichael number ${carmichael} with Miller-Rabin:`);
for (const w of witnesses) {
	const result = millerRabinTest(carmichael, w);
	console.log(`  Witness ${w}: ${result ? "probably prime" : "COMPOSITE"}`);
}

// === Multi-Round Miller-Rabin ===
console.log("\n--- Multi-Round Miller-Rabin ---");

/**
 * Multiple rounds of Miller-Rabin for higher confidence
 * Error probability <= 4^(-rounds)
 */
function isProbablyPrime(n: bigint, rounds: number = 10): boolean {
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
		const w = deterministicWitnesses[i]!;
		if (w >= n) continue;
		if (!millerRabinTest(n, w)) {
			return false;
		}
	}
	return true;
}

// Test various numbers
console.log("Multi-round primality test:");
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
	console.log(`  ${n}: ${result ? "prime" : "composite"} [${status}]`);
}

// === Finding Large Primes ===
console.log("\n--- Finding Large Primes ---");

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
console.log(`First prime >= ${startSearch}: ${foundPrime}`);

// Verify by checking small factor
const smallPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
const hasSmallFactor = smallPrimes.some((p) => foundPrime % p === 0n);
console.log(`Has small factor: ${hasSmallFactor}`);

// === Performance Comparison ===
console.log("\n--- Performance ---");

const largeCandidate = 2n ** 127n - 1n; // Mersenne prime M127

const startFermat = performance.now();
const fermatResult = fermatTest(largeCandidate, 2n);
const fermatTime = performance.now() - startFermat;

const startMR = performance.now();
const mrResult = isProbablyPrime(largeCandidate, 5);
const mrTime = performance.now() - startMR;

console.log(`Testing 2^127 - 1 (${largeCandidate.toString().length} digits):`);
console.log(
	`  Fermat (1 round): ${fermatResult ? "prime" : "composite"} in ${fermatTime.toFixed(2)}ms`,
);
console.log(
	`  Miller-Rabin (5 rounds): ${mrResult ? "prime" : "composite"} in ${mrTime.toFixed(2)}ms`,
);
