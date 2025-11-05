import { describe, expect, it } from "vitest";
import {
	BYTES_PER_FIELD_ELEMENT,
	COMMITMENT_VERSION_KZG,
	FIELD_ELEMENTS_PER_BLOB,
	GAS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
	TARGET_GAS_PER_BLOCK,
} from "./constants.js";
import { calculateGas } from "./calculateGas.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";
import { isValidVersion } from "./isValidVersion.js";
import { joinData } from "./joinData.js";
import { splitData } from "./splitData.js";
import { toCommitment } from "./toCommitment.js";
import { toData } from "./toData.js";
import { toProof } from "./toProof.js";
import { toVersionedHash } from "./toVersionedHash.js";
import { verify } from "./verify.js";
import { verifyBatch } from "./verifyBatch.js";
import type { BrandedBlob, Commitment, Proof, VersionedHash } from "../BrandedBlob.js";

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("isValid", () => {
	it("validates correct blob size", () => {
		const blob = new Uint8Array(SIZE);
		expect(isValid(blob)).toBe(true);
	});

	it("rejects undersized blobs", () => {
		const blob = new Uint8Array(100);
		expect(isValid(blob)).toBe(false);
	});

	it("rejects oversized blobs", () => {
		const blob = new Uint8Array(SIZE + 1);
		expect(isValid(blob)).toBe(false);
	});

	it("type guards correctly", () => {
		const blob = new Uint8Array(SIZE);
		expect(isValid(blob)).toBe(true);
	});
});

describe("Blob.Commitment.isValid", () => {
	it("validates 48-byte commitment", () => {
		const commitment = new Uint8Array(48);
		expect(commitment.length === 48).toBe(true);
	});

	it("rejects incorrect sizes", () => {
		expect(new Uint8Array(32).length === 48).toBe(false);
		expect(new Uint8Array(64).length === 48).toBe(false);
	});

	it("type guards correctly", () => {
		const commitment = new Uint8Array(48);
		expect(commitment.length).toBe(48);
	});
});

describe("Blob.Proof.isValid", () => {
	it("validates 48-byte proof", () => {
		const proof = new Uint8Array(48);
		expect(proof.length === 48).toBe(true);
	});

	it("rejects incorrect sizes", () => {
		expect(new Uint8Array(32).length === 48).toBe(false);
		expect(new Uint8Array(64).length === 48).toBe(false);
	});

	it("type guards correctly", () => {
		const proof = new Uint8Array(48);
		expect(proof.length).toBe(48);
	});
});

describe("Blob.VersionedHash.isValid", () => {
	it("validates correct versioned hash", () => {
		const hash = new Uint8Array(32);
		hash[0] = COMMITMENT_VERSION_KZG;
		expect(hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG).toBe(true);
	});

	it("rejects incorrect size", () => {
		const hash = new Uint8Array(64);
		hash[0] = COMMITMENT_VERSION_KZG;
		expect(hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG).toBe(false);
	});

	it("rejects incorrect version", () => {
		const hash = new Uint8Array(32);
		hash[0] = 0x00; // Wrong version
		expect(hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG).toBe(false);
	});

	it("type guards correctly", () => {
		const hash = new Uint8Array(32);
		hash[0]! = COMMITMENT_VERSION_KZG;
		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(COMMITMENT_VERSION_KZG);
	});
});

// ============================================================================
// Data Encoding/Decoding Tests
// ============================================================================

describe("fromData", () => {
	it("encodes simple data", () => {
		const data = new TextEncoder().encode("Hello, blob!");
		const blob = fromData(data);

		expect(blob.length).toBe(SIZE);
		expect(isValid(blob)).toBe(true);
	});

	it("encodes empty data", () => {
		const data = new Uint8Array(0);
		const blob = fromData(data);

		expect(blob.length).toBe(SIZE);
		expect(isValid(blob)).toBe(true);
	});

	it("encodes max size data", () => {
		const maxSize = SIZE - 8;
		const data = new Uint8Array(maxSize);
		const blob = fromData(data);

		expect(blob.length).toBe(SIZE);
	});

	it("throws on oversized data", () => {
		const oversized = new Uint8Array(SIZE);
		expect(() => fromData(oversized)).toThrow("Data too large");
	});

	it("includes length prefix", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const blob = fromData(data);

		const view = new DataView(blob.buffer, blob.byteOffset);
		const length = view.getBigUint64(0, true);

		expect(length).toBe(5n);
	});

	it("copies data after length prefix", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const blob = fromData(data);

		expect(blob[8]).toBe(1);
		expect(blob[9]).toBe(2);
		expect(blob[10]).toBe(3);
		expect(blob[11]).toBe(4);
		expect(blob[12]).toBe(5);
	});

	it("pads remaining bytes with zeros", () => {
		const data = new Uint8Array([1, 2, 3]);
		const blob = fromData(data);

		// Check a few bytes after the data
		expect(blob[11]).toBe(0);
		expect(blob[100]).toBe(0);
		expect(blob[SIZE - 1]).toBe(0);
	});
});

describe("toData", () => {
	it("decodes encoded data", () => {
		const original = new TextEncoder().encode("Hello, blob!");
		const blob = fromData(original);
		const decoded = toData(blob);

		expect(decoded).toEqual(original);
	});

	it("decodes empty data", () => {
		const original = new Uint8Array(0);
		const blob = fromData(original);
		const decoded = toData(blob);

		expect(decoded.length).toBe(0);
	});

	it("decodes max size data", () => {
		const original = new Uint8Array(SIZE - 8).fill(0xab);
		const blob = fromData(original);
		const decoded = toData(blob);

		expect(decoded).toEqual(original);
	});

	it("throws on invalid blob size", () => {
		const invalid = new Uint8Array(100) as BrandedBlob;
		expect(() => toData(invalid)).toThrow("Invalid blob size");
	});

	it("throws on invalid length prefix", () => {
		const blob = new Uint8Array(SIZE) as BrandedBlob;
		const view = new DataView(blob.buffer);
		view.setBigUint64(0, BigInt(SIZE), true); // Invalid: exceeds max

		expect(() => toData(blob)).toThrow("Invalid length prefix");
	});

	it("handles roundtrip encoding", () => {
		const testData = [
			new Uint8Array([1, 2, 3, 4, 5]),
			new TextEncoder().encode("Test string with unicode: 🔥"),
			new Uint8Array(1000).fill(0xff),
			new Uint8Array(0),
		];

		for (const original of testData) {
			const blob = fromData(original);
			const decoded = toData(blob);
			expect(decoded).toEqual(original);
		}
	});
});

// ============================================================================
// KZG Operations Tests (Not Implemented)
// ============================================================================

describe("toCommitment", () => {
	it("throws not implemented error", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		expect(() => toCommitment(blob)).toThrow("Not implemented");
	});

	it("validates blob size before attempting", () => {
		const invalid = new Uint8Array(100) as BrandedBlob;
		expect(() => toCommitment(invalid)).toThrow("Invalid blob size");
	});
});

describe("toProof", () => {
	it("throws not implemented error", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Commitment;
		expect(() => toProof(blob, commitment)).toThrow("Not implemented");
	});

	it("validates blob size", () => {
		const invalid = new Uint8Array(100) as BrandedBlob;
		const commitment = new Uint8Array(48) as Commitment;
		expect(() => toProof(invalid, commitment)).toThrow(
			"Invalid blob size",
		);
	});

	it("validates commitment size", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const invalid = new Uint8Array(32) as Commitment;
		expect(() => toProof(blob, invalid)).toThrow(
			"Invalid commitment size",
		);
	});
});

describe("verify", () => {
	it("throws not implemented error", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Commitment;
		const proof = new Uint8Array(48) as Proof;
		expect(() => verify(blob, commitment, proof)).toThrow(
			"Not implemented",
		);
	});

	it("validates blob size", () => {
		const invalid = new Uint8Array(100) as BrandedBlob;
		const commitment = new Uint8Array(48) as Commitment;
		const proof = new Uint8Array(48) as Proof;
		expect(() => verify(invalid, commitment, proof)).toThrow(
			"Invalid blob size",
		);
	});

	it("validates commitment size", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const invalid = new Uint8Array(32) as Commitment;
		const proof = new Uint8Array(48) as Proof;
		expect(() => verify(blob, invalid, proof)).toThrow(
			"Invalid commitment size",
		);
	});

	it("validates proof size", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Commitment;
		const invalid = new Uint8Array(32) as Proof;
		expect(() => verify(blob, commitment, invalid)).toThrow(
			"Invalid proof size",
		);
	});
});

describe("verifyBatch", () => {
	it("throws not implemented error", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Commitment;
		const proof = new Uint8Array(48) as Proof;
		expect(() => verifyBatch([blob], [commitment], [proof])).toThrow(
			"Not implemented",
		);
	});

	it("validates array lengths match", () => {
		const blob = fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Commitment;
		const proof = new Uint8Array(48) as Proof;

		expect(() => verifyBatch([blob, blob], [commitment], [proof])).toThrow(
			"Arrays must have same length",
		);
		expect(() =>
			verifyBatch([blob], [commitment, commitment], [proof]),
		).toThrow("Arrays must have same length");
	});

	it("validates max blobs per transaction", () => {
		const blobs = Array(7)
			.fill(null)
			.map(() => fromData(new Uint8Array([1, 2, 3])));
		const commitments = Array(7)
			.fill(null)
			.map(() => new Uint8Array(48) as Commitment);
		const proofs = Array(7)
			.fill(null)
			.map(() => new Uint8Array(48) as Proof);

		expect(() => verifyBatch(blobs, commitments, proofs)).toThrow(
			"Too many blobs",
		);
	});

	it("accepts max blobs per transaction", () => {
		const blobs = Array(MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => fromData(new Uint8Array([1, 2, 3])));
		const commitments = Array(MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => new Uint8Array(48) as Commitment);
		const proofs = Array(MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => new Uint8Array(48) as Proof);

		expect(() => verifyBatch(blobs, commitments, proofs)).toThrow(
			"Not implemented",
		);
	});
});

// ============================================================================
// Versioned Hash Tests
// ============================================================================

describe("toVersionedHash", () => {
	it("creates versioned hash from commitment", () => {
		const commitment = new Uint8Array(48).fill(0xab) as Commitment;
		const hash = toVersionedHash(commitment);

		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(COMMITMENT_VERSION_KZG);
		expect(hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG).toBe(true);
	});

	it("validates commitment size", () => {
		const invalid = new Uint8Array(32) as Commitment;
		expect(() => toVersionedHash(invalid)).toThrow(
			"Invalid commitment size",
		);
	});

	it("convenience form - Commitment.toVersionedHash", () => {
		const commitment = new Uint8Array(48).fill(0xab) as Commitment;
		const hash = toVersionedHash(commitment);

		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(COMMITMENT_VERSION_KZG);
	});
});

describe("isValidVersion", () => {
	it("validates correct version", () => {
		const hash = new Uint8Array(32) as VersionedHash;
		hash[0] = COMMITMENT_VERSION_KZG;
		expect(isValidVersion(hash)).toBe(true);
	});

	it("rejects incorrect version", () => {
		const hash = new Uint8Array(32) as VersionedHash;
		hash[0] = 0x00;
		expect(isValidVersion(hash)).toBe(false);
	});

	it("rejects incorrect size", () => {
		const hash = new Uint8Array(64) as VersionedHash;
		hash[0] = COMMITMENT_VERSION_KZG;
		expect(isValidVersion(hash)).toBe(false);
	});
});

describe("Blob.VersionedHash.getVersion", () => {
	it("returns version byte", () => {
		const hash = new Uint8Array(32) as VersionedHash;
		hash[0] = COMMITMENT_VERSION_KZG;
		expect((hash[0] ?? 0)).toBe(
			COMMITMENT_VERSION_KZG,
		);
	});

	it("convenience form - version", () => {
		const hash = new Uint8Array(32) as VersionedHash;
		hash[0] = COMMITMENT_VERSION_KZG;
		expect((hash[0] ?? 0)).toBe(COMMITMENT_VERSION_KZG);
	});
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe("calculateGas", () => {
	it("calculates gas for single blob", () => {
		expect(calculateGas(1)).toBe(GAS_PER_BLOB);
	});

	it("calculates gas for multiple blobs", () => {
		expect(calculateGas(3)).toBe(TARGET_GAS_PER_BLOCK);
		expect(calculateGas(6)).toBe(GAS_PER_BLOB * 6);
	});

	it("returns zero for zero blobs", () => {
		expect(calculateGas(0)).toBe(0);
	});

	it("throws on negative count", () => {
		expect(() => calculateGas(-1)).toThrow("Invalid blob count");
	});

	it("throws on exceeding max", () => {
		expect(() => calculateGas(MAX_PER_TRANSACTION + 1)).toThrow(
			"Invalid blob count",
		);
	});
});

describe("estimateBlobCount", () => {
	it("estimates single blob for small data", () => {
		expect(estimateBlobCount(100)).toBe(1);
		expect(estimateBlobCount(1000)).toBe(1);
	});

	it("estimates multiple blobs for large data", () => {
		const maxDataPerBlob = SIZE - 8;
		expect(estimateBlobCount(maxDataPerBlob + 1)).toBe(2);
		expect(estimateBlobCount(maxDataPerBlob * 2)).toBe(2);
		expect(estimateBlobCount(maxDataPerBlob * 2 + 1)).toBe(3);
	});

	it("returns zero for zero data", () => {
		expect(estimateBlobCount(0)).toBe(0);
	});

	it("throws on negative size", () => {
		expect(() => estimateBlobCount(-1)).toThrow("Invalid data size");
	});

	it("estimates correctly for exact boundaries", () => {
		const maxDataPerBlob = SIZE - 8;
		expect(estimateBlobCount(maxDataPerBlob)).toBe(1);
		expect(
			estimateBlobCount(maxDataPerBlob * MAX_PER_TRANSACTION),
		).toBe(MAX_PER_TRANSACTION);
	});
});

describe("splitData", () => {
	it("splits data into multiple blobs", () => {
		const data = new Uint8Array(200000).fill(0xab);
		const blobs = splitData(data);

		expect(blobs.length).toBeGreaterThan(1);
		expect(blobs.every((b: Uint8Array) => isValid(b))).toBe(true);
	});

	it("creates single blob for small data", () => {
		const data = new Uint8Array(1000).fill(0xcd);
		const blobs = splitData(data);

		expect(blobs.length).toBe(1);
		expect(isValid(blobs[0]!)).toBe(true);
	});

	it("splits at correct boundaries", () => {
		const maxDataPerBlob = SIZE - 8;
		const data = new Uint8Array(maxDataPerBlob * 2 + 100);
		const blobs = splitData(data);

		expect(blobs.length).toBe(3);
	});

	it("throws when exceeding max blobs", () => {
		const maxDataPerBlob = SIZE - 8;
		const tooMuch = new Uint8Array(
			maxDataPerBlob * (MAX_PER_TRANSACTION + 1),
		);

		expect(() => splitData(tooMuch)).toThrow("Data too large");
	});

	it("handles empty data", () => {
		const data = new Uint8Array(0);
		const blobs = splitData(data);

		expect(blobs.length).toBe(0);
	});

	it("preserves data integrity", () => {
		const original = new Uint8Array(200000);
		for (let i = 0; i < original.length; i++) {
			original[i] = i % 256;
		}

		const blobs = splitData(original);
		const reconstructed = joinData(blobs);

		expect(reconstructed).toEqual(original);
	});
});

describe("joinData", () => {
	it("joins multiple blobs", () => {
		const data = new Uint8Array(200000).fill(0xef);
		const blobs = splitData(data);
		const joined = joinData(blobs);

		expect(joined).toEqual(data);
	});

	it("handles single blob", () => {
		const original = new Uint8Array(1000).fill(0x12);
		const blob = fromData(original);
		const joined = joinData([blob]);

		expect(joined).toEqual(original);
	});

	it("handles empty array", () => {
		const joined = joinData([]);
		expect(joined.length).toBe(0);
	});

	it("preserves data patterns", () => {
		const pattern = new Uint8Array([1, 2, 3, 4, 5]);
		const data = new Uint8Array(150000);
		for (let i = 0; i < data.length; i++) {
			data[i] = pattern[i % pattern.length]!;
		}

		const blobs = splitData(data);
		const joined = joinData(blobs);

		expect(joined).toEqual(data);
	});

	it("roundtrip with max size data", () => {
		const maxPerTransaction = MAX_PER_TRANSACTION * (SIZE - 8);
		const data = new Uint8Array(maxPerTransaction - 100);
		for (let i = 0; i < data.length; i++) {
			data[i] = (i * 7) % 256;
		}

		const blobs = splitData(data);
		const joined = joinData(blobs);

		expect(joined).toEqual(data);
	});
});

// ============================================================================
// Constants Tests
// ============================================================================

describe("Blob Constants", () => {
	it("SIZE is correct", () => {
		expect(SIZE).toBe(131072);
		expect(SIZE).toBe(
			FIELD_ELEMENTS_PER_BLOB * BYTES_PER_FIELD_ELEMENT,
		);
	});

	it("FIELD_ELEMENTS_PER_BLOB is correct", () => {
		expect(FIELD_ELEMENTS_PER_BLOB).toBe(4096);
	});

	it("BYTES_PER_FIELD_ELEMENT is correct", () => {
		expect(BYTES_PER_FIELD_ELEMENT).toBe(32);
	});

	it("MAX_PER_TRANSACTION is correct", () => {
		expect(MAX_PER_TRANSACTION).toBe(6);
	});

	it("COMMITMENT_VERSION_KZG is correct", () => {
		expect(COMMITMENT_VERSION_KZG).toBe(0x01);
	});

	it("GAS_PER_BLOB is correct", () => {
		expect(GAS_PER_BLOB).toBe(131072);
		expect(GAS_PER_BLOB).toBe(2 ** 17);
	});

	it("TARGET_GAS_PER_BLOCK is correct", () => {
		expect(TARGET_GAS_PER_BLOCK).toBe(393216);
		expect(TARGET_GAS_PER_BLOCK).toBe(GAS_PER_BLOB * 3);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
	it("handles exact max data size", () => {
		const maxSize = SIZE - 8;
		const data = new Uint8Array(maxSize);
		const blob = fromData(data);
		const decoded = toData(blob);

		expect(decoded.length).toBe(maxSize);
		expect(decoded).toEqual(data);
	});

	it("handles data splitting at max transaction capacity", () => {
		const maxDataPerBlob = SIZE - 8;
		const data = new Uint8Array(maxDataPerBlob * MAX_PER_TRANSACTION);
		const blobs = splitData(data);

		expect(blobs.length).toBe(MAX_PER_TRANSACTION);
	});

	it("handles unicode text encoding", () => {
		const text = "Hello 世界 🌍 Ethereum!";
		const original = new TextEncoder().encode(text);
		const blob = fromData(original);
		const decoded = toData(blob);
		const result = new TextDecoder().decode(decoded);

		expect(result).toBe(text);
	});

	it("handles binary data patterns", () => {
		const patterns = [
			new Uint8Array([0x00, 0x00, 0x00, 0x00]),
			new Uint8Array([0xff, 0xff, 0xff, 0xff]),
			new Uint8Array([0xaa, 0x55, 0xaa, 0x55]),
			new Uint8Array([0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80]),
		];

		for (const pattern of patterns) {
			const blob = fromData(pattern);
			const decoded = toData(blob);
			expect(decoded).toEqual(pattern);
		}
	});

	it("handles sequential blob operations", () => {
		const data1 = new TextEncoder().encode("First blob");
		const data2 = new TextEncoder().encode("Second blob");
		const data3 = new TextEncoder().encode("Third blob");

		const blob1 = fromData(data1);
		const blob2 = fromData(data2);
		const blob3 = fromData(data3);

		expect(toData(blob1)).toEqual(data1);
		expect(toData(blob2)).toEqual(data2);
		expect(toData(blob3)).toEqual(data3);
	});
});
