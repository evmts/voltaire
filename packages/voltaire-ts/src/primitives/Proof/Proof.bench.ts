/**
 * Proof Module Benchmarks
 *
 * Measures performance of Merkle proof operations
 */

import { bench, run } from "mitata";
import * as Proof from "./index.js";
import type { ProofType } from "./ProofType.js";

// ============================================================================
// Test Data - Realistic Merkle proofs
// ============================================================================

function createHash(seed: number): Uint8Array {
	const hash = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		hash[i] = (seed + i * 7) % 256;
	}
	return hash;
}

// Small proof (typical state proof depth)
const smallProof: ProofType = {
	value: createHash(1),
	proof: [createHash(10), createHash(20), createHash(30)],
};

// Medium proof (deeper trie)
const mediumProof: ProofType = {
	value: createHash(2),
	proof: Array.from({ length: 10 }, (_, i) => createHash(100 + i)),
};

// Large proof (maximum depth)
const largeProof: ProofType = {
	value: createHash(3),
	proof: Array.from({ length: 24 }, (_, i) => createHash(200 + i)), // Ethereum Patricia trie max depth ~64, but typical ~20-24
};

// Empty proof
const emptyProof: ProofType = {
	value: createHash(4),
	proof: [],
};

// Single node proof
const singleNodeProof: ProofType = {
	value: createHash(5),
	proof: [createHash(50)],
};

// Invalid proofs for testing
const invalidProofBadNodeSize = {
	value: createHash(6),
	proof: [createHash(60), new Uint8Array(16)], // Wrong size
};

const invalidProofNullValue = {
	value: null,
	proof: [createHash(70)],
};

const invalidProofNotArray = {
	value: createHash(7),
	proof: "not an array",
};

// ============================================================================
// Benchmarks - Proof.from
// ============================================================================

bench("Proof.from - small proof - voltaire", () => {
	Proof.from({
		value: createHash(1),
		proof: [createHash(10), createHash(20), createHash(30)],
	});
});

bench("Proof.from - medium proof - voltaire", () => {
	Proof.from({
		value: createHash(2),
		proof: Array.from({ length: 10 }, (_, i) => createHash(100 + i)),
	});
});

bench("Proof.from - large proof - voltaire", () => {
	Proof.from({
		value: createHash(3),
		proof: Array.from({ length: 24 }, (_, i) => createHash(200 + i)),
	});
});

bench("Proof.from - empty proof - voltaire", () => {
	Proof.from({
		value: createHash(4),
		proof: [],
	});
});

await run();

// ============================================================================
// Benchmarks - Proof.verify
// ============================================================================

bench("Proof.verify - small proof - voltaire", () => {
	Proof.verify(smallProof);
});

bench("Proof.verify - medium proof - voltaire", () => {
	Proof.verify(mediumProof);
});

bench("Proof.verify - large proof - voltaire", () => {
	Proof.verify(largeProof);
});

bench("Proof.verify - empty proof - voltaire", () => {
	Proof.verify(emptyProof);
});

bench("Proof.verify - single node - voltaire", () => {
	Proof.verify(singleNodeProof);
});

await run();

// ============================================================================
// Benchmarks - Proof.verify Invalid Cases
// ============================================================================

bench("Proof.verify - invalid node size - voltaire", () => {
	Proof.verify(invalidProofBadNodeSize as unknown as ProofType);
});

bench("Proof.verify - null value - voltaire", () => {
	Proof.verify(invalidProofNullValue as unknown as ProofType);
});

bench("Proof.verify - proof not array - voltaire", () => {
	Proof.verify(invalidProofNotArray as unknown as ProofType);
});

bench("Proof.verify - null input - voltaire", () => {
	Proof.verify(null as unknown as ProofType);
});

await run();

// ============================================================================
// Benchmarks - Proof.equals
// ============================================================================

const proofCopy: ProofType = {
	value: smallProof.value,
	proof: [...smallProof.proof],
};

const differentProof: ProofType = {
	value: createHash(99),
	proof: [createHash(990), createHash(991), createHash(992)],
};

bench("Proof.equals - same reference - voltaire", () => {
	Proof.equals(smallProof, smallProof);
});

bench("Proof.equals - equal values - voltaire", () => {
	Proof.equals(smallProof, proofCopy);
});

bench("Proof.equals - different values - voltaire", () => {
	Proof.equals(smallProof, differentProof);
});

bench("Proof.equals - different lengths - voltaire", () => {
	Proof.equals(smallProof, mediumProof);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

const proofBatch = Array.from({ length: 10 }, (_, i) => ({
	value: createHash(i * 10),
	proof: Array.from({ length: 5 + (i % 5) }, (_, j) => createHash(i * 100 + j)),
})) as ProofType[];

bench("Proof.verify x10 - voltaire", () => {
	for (const proof of proofBatch) {
		Proof.verify(proof);
	}
});

bench("Proof.from x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		Proof.from({
			value: createHash(i * 10),
			proof: Array.from({ length: 5 }, (_, j) => createHash(i * 100 + j)),
		});
	}
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("Proof.verify - proof with 1 node - voltaire", () => {
	Proof.verify({
		value: createHash(1000),
		proof: [createHash(1001)],
	} as ProofType);
});

bench("Proof.verify - proof with max typical depth (24) - voltaire", () => {
	Proof.verify({
		value: createHash(2000),
		proof: Array.from({ length: 24 }, (_, i) => createHash(2000 + i)),
	} as ProofType);
});

await run();
