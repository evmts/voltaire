import { describe, expect, expectTypeOf, it } from "vitest";
import { Blob } from "./index.js";

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("Blob.isValid", () => {
	it("validates correct blob size", () => {
		const blob = new Uint8Array(Blob.SIZE);
		expect(Blob.isValid(blob)).toBe(true);
	});

	it("rejects undersized blobs", () => {
		const blob = new Uint8Array(100);
		expect(Blob.isValid(blob)).toBe(false);
	});

	it("rejects oversized blobs", () => {
		const blob = new Uint8Array(Blob.SIZE + 1);
		expect(Blob.isValid(blob)).toBe(false);
	});

	it("type guards correctly", () => {
		const blob = new Uint8Array(Blob.SIZE);
		if (Blob.isValid(blob)) {
			// @ts-expect-error - Testing type inference
			expectTypeOf(blob).toEqualTypeOf<Blob.Data>();
		}
	});
});

describe("Blob.Commitment.isValid", () => {
	it("validates 48-byte commitment", () => {
		const commitment = new Uint8Array(48);
		expect(Blob.Commitment.isValid(commitment)).toBe(true);
	});

	it("rejects incorrect sizes", () => {
		expect(Blob.Commitment.isValid(new Uint8Array(32))).toBe(false);
		expect(Blob.Commitment.isValid(new Uint8Array(64))).toBe(false);
	});

	it("type guards correctly", () => {
		const commitment = new Uint8Array(48);
		if (Blob.Commitment.isValid(commitment)) {
			// @ts-expect-error - Testing type inference
			expectTypeOf(commitment).toEqualTypeOf<Blob.Commitment>();
		}
	});
});

describe("Blob.Proof.isValid", () => {
	it("validates 48-byte proof", () => {
		const proof = new Uint8Array(48);
		expect(Blob.Proof.isValid(proof)).toBe(true);
	});

	it("rejects incorrect sizes", () => {
		expect(Blob.Proof.isValid(new Uint8Array(32))).toBe(false);
		expect(Blob.Proof.isValid(new Uint8Array(64))).toBe(false);
	});

	it("type guards correctly", () => {
		const proof = new Uint8Array(48);
		if (Blob.Proof.isValid(proof)) {
			// @ts-expect-error - Testing type inference
			expectTypeOf(proof).toEqualTypeOf<Blob.Proof>();
		}
	});
});

describe("Blob.VersionedHash.isValid", () => {
	it("validates correct versioned hash", () => {
		const hash = new Uint8Array(32);
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.VersionedHash.isValid(hash)).toBe(true);
	});

	it("rejects incorrect size", () => {
		const hash = new Uint8Array(64);
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.VersionedHash.isValid(hash)).toBe(false);
	});

	it("rejects incorrect version", () => {
		const hash = new Uint8Array(32);
		hash[0] = 0x00; // Wrong version
		expect(Blob.VersionedHash.isValid(hash)).toBe(false);
	});

	it("type guards correctly", () => {
		const hash = new Uint8Array(32);
		hash[0]! = Blob.COMMITMENT_VERSION_KZG;
		if (Blob.VersionedHash.isValid(hash)) {
			// @ts-expect-error - Testing type inference
			expectTypeOf(hash).toEqualTypeOf<Blob.VersionedHash>();
		}
	});
});

// ============================================================================
// Data Encoding/Decoding Tests
// ============================================================================

describe("Blob.fromData", () => {
	it("encodes simple data", () => {
		const data = new TextEncoder().encode("Hello, blob!");
		const blob = Blob.fromData(data);

		expect(blob.length).toBe(Blob.SIZE);
		expect(Blob.isValid(blob)).toBe(true);
	});

	it("encodes empty data", () => {
		const data = new Uint8Array(0);
		const blob = Blob.fromData(data);

		expect(blob.length).toBe(Blob.SIZE);
		expect(Blob.isValid(blob)).toBe(true);
	});

	it("encodes max size data", () => {
		const maxSize = Blob.SIZE - 8;
		const data = new Uint8Array(maxSize);
		const blob = Blob.fromData(data);

		expect(blob.length).toBe(Blob.SIZE);
	});

	it("throws on oversized data", () => {
		const oversized = new Uint8Array(Blob.SIZE);
		expect(() => Blob.fromData(oversized)).toThrow("Data too large");
	});

	it("includes length prefix", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const blob = Blob.fromData(data);

		const view = new DataView(blob.buffer, blob.byteOffset);
		const length = view.getBigUint64(0, true);

		expect(length).toBe(5n);
	});

	it("copies data after length prefix", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const blob = Blob.fromData(data);

		expect(blob[8]).toBe(1);
		expect(blob[9]).toBe(2);
		expect(blob[10]).toBe(3);
		expect(blob[11]).toBe(4);
		expect(blob[12]).toBe(5);
	});

	it("pads remaining bytes with zeros", () => {
		const data = new Uint8Array([1, 2, 3]);
		const blob = Blob.fromData(data);

		// Check a few bytes after the data
		expect(blob[11]).toBe(0);
		expect(blob[100]).toBe(0);
		expect(blob[Blob.SIZE - 1]).toBe(0);
	});
});

describe("Blob.toData", () => {
	it("decodes encoded data", () => {
		const original = new TextEncoder().encode("Hello, blob!");
		const blob = Blob.fromData(original);
		const decoded = Blob.toData(blob);

		expect(decoded).toEqual(original);
	});

	it("decodes empty data", () => {
		const original = new Uint8Array(0);
		const blob = Blob.fromData(original);
		const decoded = Blob.toData(blob);

		expect(decoded.length).toBe(0);
	});

	it("decodes max size data", () => {
		const original = new Uint8Array(Blob.SIZE - 8).fill(0xab);
		const blob = Blob.fromData(original);
		const decoded = Blob.toData(blob);

		expect(decoded).toEqual(original);
	});

	it("throws on invalid blob size", () => {
		const invalid = new Uint8Array(100) as Blob.Data;
		expect(() => Blob.toData(invalid)).toThrow("Invalid blob size");
	});

	it("throws on invalid length prefix", () => {
		const blob = new Uint8Array(Blob.SIZE) as Blob.Data;
		const view = new DataView(blob.buffer);
		view.setBigUint64(0, BigInt(Blob.SIZE), true); // Invalid: exceeds max

		expect(() => Blob.toData(blob)).toThrow("Invalid length prefix");
	});

	it("handles roundtrip encoding", () => {
		const testData = [
			new Uint8Array([1, 2, 3, 4, 5]),
			new TextEncoder().encode("Test string with unicode: 🔥"),
			new Uint8Array(1000).fill(0xff),
			new Uint8Array(0),
		];

		for (const original of testData) {
			const blob = Blob.fromData(original);
			const decoded = Blob.toData(blob);
			expect(decoded).toEqual(original);
		}
	});
});

// ============================================================================
// KZG Operations Tests (Not Implemented)
// ============================================================================

describe("Blob.toCommitment", () => {
	it("throws not implemented error", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		expect(() => Blob.toCommitment(blob)).toThrow("Not implemented");
	});

	it("validates blob size before attempting", () => {
		const invalid = new Uint8Array(100) as Blob.Data;
		expect(() => Blob.toCommitment(invalid)).toThrow("Invalid blob size");
	});
});

describe("Blob.toProof", () => {
	it("throws not implemented error", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Blob.Commitment;
		expect(() => Blob.toProof(blob, commitment)).toThrow("Not implemented");
	});

	it("validates blob size", () => {
		const invalid = new Uint8Array(100) as Blob.Data;
		const commitment = new Uint8Array(48) as Blob.Commitment;
		expect(() => Blob.toProof(invalid, commitment)).toThrow(
			"Invalid blob size",
		);
	});

	it("validates commitment size", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const invalid = new Uint8Array(32) as Blob.Commitment;
		expect(() => Blob.toProof(blob, invalid)).toThrow(
			"Invalid commitment size",
		);
	});
});

describe("Blob.verify", () => {
	it("throws not implemented error", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Blob.Commitment;
		const proof = new Uint8Array(48) as Blob.Proof;
		expect(() => Blob.verify(blob, commitment, proof)).toThrow(
			"Not implemented",
		);
	});

	it("validates blob size", () => {
		const invalid = new Uint8Array(100) as Blob.Data;
		const commitment = new Uint8Array(48) as Blob.Commitment;
		const proof = new Uint8Array(48) as Blob.Proof;
		expect(() => Blob.verify(invalid, commitment, proof)).toThrow(
			"Invalid blob size",
		);
	});

	it("validates commitment size", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const invalid = new Uint8Array(32) as Blob.Commitment;
		const proof = new Uint8Array(48) as Blob.Proof;
		expect(() => Blob.verify(blob, invalid, proof)).toThrow(
			"Invalid commitment size",
		);
	});

	it("validates proof size", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Blob.Commitment;
		const invalid = new Uint8Array(32) as Blob.Proof;
		expect(() => Blob.verify(blob, commitment, invalid)).toThrow(
			"Invalid proof size",
		);
	});
});

describe("Blob.verifyBatch", () => {
	it("throws not implemented error", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Blob.Commitment;
		const proof = new Uint8Array(48) as Blob.Proof;
		expect(() => Blob.verifyBatch([blob], [commitment], [proof])).toThrow(
			"Not implemented",
		);
	});

	it("validates array lengths match", () => {
		const blob = Blob.fromData(new Uint8Array([1, 2, 3]));
		const commitment = new Uint8Array(48) as Blob.Commitment;
		const proof = new Uint8Array(48) as Blob.Proof;

		expect(() => Blob.verifyBatch([blob, blob], [commitment], [proof])).toThrow(
			"Arrays must have same length",
		);
		expect(() =>
			Blob.verifyBatch([blob], [commitment, commitment], [proof]),
		).toThrow("Arrays must have same length");
	});

	it("validates max blobs per transaction", () => {
		const blobs = Array(7)
			.fill(null)
			.map(() => Blob.fromData(new Uint8Array([1, 2, 3])));
		const commitments = Array(7)
			.fill(null)
			.map(() => new Uint8Array(48) as Blob.Commitment);
		const proofs = Array(7)
			.fill(null)
			.map(() => new Uint8Array(48) as Blob.Proof);

		expect(() => Blob.verifyBatch(blobs, commitments, proofs)).toThrow(
			"Too many blobs",
		);
	});

	it("accepts max blobs per transaction", () => {
		const blobs = Array(Blob.MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => Blob.fromData(new Uint8Array([1, 2, 3])));
		const commitments = Array(Blob.MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => new Uint8Array(48) as Blob.Commitment);
		const proofs = Array(Blob.MAX_PER_TRANSACTION)
			.fill(null)
			.map(() => new Uint8Array(48) as Blob.Proof);

		expect(() => Blob.verifyBatch(blobs, commitments, proofs)).toThrow(
			"Not implemented",
		);
	});
});

// ============================================================================
// Versioned Hash Tests
// ============================================================================

describe("Blob.toVersionedHash", () => {
	it("creates versioned hash from commitment", () => {
		const commitment = new Uint8Array(48).fill(0xab) as Blob.Commitment;
		const hash = Blob.toVersionedHash(commitment);

		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(Blob.COMMITMENT_VERSION_KZG);
		expect(Blob.VersionedHash.isValid(hash)).toBe(true);
	});

	it("validates commitment size", () => {
		const invalid = new Uint8Array(32) as Blob.Commitment;
		expect(() => Blob.toVersionedHash(invalid)).toThrow(
			"Invalid commitment size",
		);
	});

	it("convenience form - Commitment.toVersionedHash", () => {
		const commitment = new Uint8Array(48).fill(0xab) as Blob.Commitment;
		const hash = Blob.Commitment.toVersionedHash(commitment);

		expect(hash.length).toBe(32);
		expect(hash[0]).toBe(Blob.COMMITMENT_VERSION_KZG);
	});
});

describe("Blob.isValidVersion", () => {
	it("validates correct version", () => {
		const hash = new Uint8Array(32) as Blob.VersionedHash;
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.isValidVersion(hash)).toBe(true);
	});

	it("rejects incorrect version", () => {
		const hash = new Uint8Array(32) as Blob.VersionedHash;
		hash[0] = 0x00;
		expect(Blob.isValidVersion(hash)).toBe(false);
	});

	it("rejects incorrect size", () => {
		const hash = new Uint8Array(64) as Blob.VersionedHash;
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.isValidVersion(hash)).toBe(false);
	});
});

describe("Blob.VersionedHash.getVersion", () => {
	it("returns version byte", () => {
		const hash = new Uint8Array(32) as Blob.VersionedHash;
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.VersionedHash.getVersion(hash)).toBe(
			Blob.COMMITMENT_VERSION_KZG,
		);
	});

	it("convenience form - version", () => {
		const hash = new Uint8Array(32) as Blob.VersionedHash;
		hash[0] = Blob.COMMITMENT_VERSION_KZG;
		expect(Blob.VersionedHash.version(hash)).toBe(Blob.COMMITMENT_VERSION_KZG);
	});
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe("Blob.calculateGas", () => {
	it("calculates gas for single blob", () => {
		expect(Blob.calculateGas(1)).toBe(Blob.GAS_PER_BLOB);
	});

	it("calculates gas for multiple blobs", () => {
		expect(Blob.calculateGas(3)).toBe(Blob.TARGET_GAS_PER_BLOCK);
		expect(Blob.calculateGas(6)).toBe(Blob.GAS_PER_BLOB * 6);
	});

	it("returns zero for zero blobs", () => {
		expect(Blob.calculateGas(0)).toBe(0);
	});

	it("throws on negative count", () => {
		expect(() => Blob.calculateGas(-1)).toThrow("Invalid blob count");
	});

	it("throws on exceeding max", () => {
		expect(() => Blob.calculateGas(Blob.MAX_PER_TRANSACTION + 1)).toThrow(
			"Invalid blob count",
		);
	});
});

describe("Blob.estimateBlobCount", () => {
	it("estimates single blob for small data", () => {
		expect(Blob.estimateBlobCount(100)).toBe(1);
		expect(Blob.estimateBlobCount(1000)).toBe(1);
	});

	it("estimates multiple blobs for large data", () => {
		const maxDataPerBlob = Blob.SIZE - 8;
		expect(Blob.estimateBlobCount(maxDataPerBlob + 1)).toBe(2);
		expect(Blob.estimateBlobCount(maxDataPerBlob * 2)).toBe(2);
		expect(Blob.estimateBlobCount(maxDataPerBlob * 2 + 1)).toBe(3);
	});

	it("returns zero for zero data", () => {
		expect(Blob.estimateBlobCount(0)).toBe(0);
	});

	it("throws on negative size", () => {
		expect(() => Blob.estimateBlobCount(-1)).toThrow("Invalid data size");
	});

	it("estimates correctly for exact boundaries", () => {
		const maxDataPerBlob = Blob.SIZE - 8;
		expect(Blob.estimateBlobCount(maxDataPerBlob)).toBe(1);
		expect(
			Blob.estimateBlobCount(maxDataPerBlob * Blob.MAX_PER_TRANSACTION),
		).toBe(Blob.MAX_PER_TRANSACTION);
	});
});

describe("Blob.splitData", () => {
	it("splits data into multiple blobs", () => {
		const data = new Uint8Array(200000).fill(0xab);
		const blobs = Blob.splitData(data);

		expect(blobs.length).toBeGreaterThan(1);
		expect(blobs.every((b) => Blob.isValid(b))).toBe(true);
	});

	it("creates single blob for small data", () => {
		const data = new Uint8Array(1000).fill(0xcd);
		const blobs = Blob.splitData(data);

		expect(blobs.length).toBe(1);
		expect(Blob.isValid(blobs[0]!)).toBe(true);
	});

	it("splits at correct boundaries", () => {
		const maxDataPerBlob = Blob.SIZE - 8;
		const data = new Uint8Array(maxDataPerBlob * 2 + 100);
		const blobs = Blob.splitData(data);

		expect(blobs.length).toBe(3);
	});

	it("throws when exceeding max blobs", () => {
		const maxDataPerBlob = Blob.SIZE - 8;
		const tooMuch = new Uint8Array(
			maxDataPerBlob * (Blob.MAX_PER_TRANSACTION + 1),
		);

		expect(() => Blob.splitData(tooMuch)).toThrow("Data too large");
	});

	it("handles empty data", () => {
		const data = new Uint8Array(0);
		const blobs = Blob.splitData(data);

		expect(blobs.length).toBe(0);
	});

	it("preserves data integrity", () => {
		const original = new Uint8Array(200000);
		for (let i = 0; i < original.length; i++) {
			original[i] = i % 256;
		}

		const blobs = Blob.splitData(original);
		const reconstructed = Blob.joinData(blobs);

		expect(reconstructed).toEqual(original);
	});
});

describe("Blob.joinData", () => {
	it("joins multiple blobs", () => {
		const data = new Uint8Array(200000).fill(0xef);
		const blobs = Blob.splitData(data);
		const joined = Blob.joinData(blobs);

		expect(joined).toEqual(data);
	});

	it("handles single blob", () => {
		const original = new Uint8Array(1000).fill(0x12);
		const blob = Blob.fromData(original);
		const joined = Blob.joinData([blob]);

		expect(joined).toEqual(original);
	});

	it("handles empty array", () => {
		const joined = Blob.joinData([]);
		expect(joined.length).toBe(0);
	});

	it("preserves data patterns", () => {
		const pattern = new Uint8Array([1, 2, 3, 4, 5]);
		const data = new Uint8Array(150000);
		for (let i = 0; i < data.length; i++) {
			data[i] = pattern[i % pattern.length]!;
		}

		const blobs = Blob.splitData(data);
		const joined = Blob.joinData(blobs);

		expect(joined).toEqual(data);
	});

	it("roundtrip with max size data", () => {
		const maxPerTransaction = Blob.MAX_PER_TRANSACTION * (Blob.SIZE - 8);
		const data = new Uint8Array(maxPerTransaction - 100);
		for (let i = 0; i < data.length; i++) {
			data[i] = (i * 7) % 256;
		}

		const blobs = Blob.splitData(data);
		const joined = Blob.joinData(blobs);

		expect(joined).toEqual(data);
	});
});

// ============================================================================
// Constants Tests
// ============================================================================

describe("Blob Constants", () => {
	it("SIZE is correct", () => {
		expect(Blob.SIZE).toBe(131072);
		expect(Blob.SIZE).toBe(
			Blob.FIELD_ELEMENTS_PER_BLOB * Blob.BYTES_PER_FIELD_ELEMENT,
		);
	});

	it("FIELD_ELEMENTS_PER_BLOB is correct", () => {
		expect(Blob.FIELD_ELEMENTS_PER_BLOB).toBe(4096);
	});

	it("BYTES_PER_FIELD_ELEMENT is correct", () => {
		expect(Blob.BYTES_PER_FIELD_ELEMENT).toBe(32);
	});

	it("MAX_PER_TRANSACTION is correct", () => {
		expect(Blob.MAX_PER_TRANSACTION).toBe(6);
	});

	it("COMMITMENT_VERSION_KZG is correct", () => {
		expect(Blob.COMMITMENT_VERSION_KZG).toBe(0x01);
	});

	it("GAS_PER_BLOB is correct", () => {
		expect(Blob.GAS_PER_BLOB).toBe(131072);
		expect(Blob.GAS_PER_BLOB).toBe(2 ** 17);
	});

	it("TARGET_GAS_PER_BLOCK is correct", () => {
		expect(Blob.TARGET_GAS_PER_BLOCK).toBe(393216);
		expect(Blob.TARGET_GAS_PER_BLOCK).toBe(Blob.GAS_PER_BLOB * 3);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
	it("handles exact max data size", () => {
		const maxSize = Blob.SIZE - 8;
		const data = new Uint8Array(maxSize);
		const blob = Blob.fromData(data);
		const decoded = Blob.toData(blob);

		expect(decoded.length).toBe(maxSize);
		expect(decoded).toEqual(data);
	});

	it("handles data splitting at max transaction capacity", () => {
		const maxDataPerBlob = Blob.SIZE - 8;
		const data = new Uint8Array(maxDataPerBlob * Blob.MAX_PER_TRANSACTION);
		const blobs = Blob.splitData(data);

		expect(blobs.length).toBe(Blob.MAX_PER_TRANSACTION);
	});

	it("handles unicode text encoding", () => {
		const text = "Hello 世界 🌍 Ethereum!";
		const original = new TextEncoder().encode(text);
		const blob = Blob.fromData(original);
		const decoded = Blob.toData(blob);
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
			const blob = Blob.fromData(pattern);
			const decoded = Blob.toData(blob);
			expect(decoded).toEqual(pattern);
		}
	});

	it("handles sequential blob operations", () => {
		const data1 = new TextEncoder().encode("First blob");
		const data2 = new TextEncoder().encode("Second blob");
		const data3 = new TextEncoder().encode("Third blob");

		const blob1 = Blob.fromData(data1);
		const blob2 = Blob.fromData(data2);
		const blob3 = Blob.fromData(data3);

		expect(Blob.toData(blob1)).toEqual(data1);
		expect(Blob.toData(blob2)).toEqual(data2);
		expect(Blob.toData(blob3)).toEqual(data3);
	});
});
