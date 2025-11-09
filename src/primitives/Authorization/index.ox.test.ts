/**
 * Tests for Ox Authorization re-exports
 */

import { describe, expect, it } from "vitest";
import * as Authorization from "ox/Authorization";
import type { Authorization as AuthorizationType } from "ox/Authorization";

// ============================================================================
// Basic Constructor Tests
// ============================================================================

describe("Authorization.from", () => {
	it("creates authorization from object", () => {
		const auth = Authorization.from({
			address: "0x1234567890123456789012345678901234567890",
			chainId: 1,
			nonce: 69n,
		});

		expect(auth).toBeDefined();
		expect(auth.address).toBe("0x1234567890123456789012345678901234567890");
		expect(auth.chainId).toBe(1);
		expect(auth.nonce).toBe(69n);
	});

	it("attaches signature when provided", () => {
		const auth = Authorization.from(
			{
				address: "0x1234567890123456789012345678901234567890",
				chainId: 1,
				nonce: 69n,
			},
			{
				signature: {
					r: 0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90n,
					s: 0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064n,
					yParity: 0,
				},
			},
		);

		expect(auth).toBeDefined();
		expect("r" in auth).toBe(true);
		expect("s" in auth).toBe(true);
		expect("yParity" in auth).toBe(true);
	});
});

// ============================================================================
// RPC Conversion Tests
// ============================================================================

describe("Authorization.fromRpc", () => {
	it("converts RPC authorization to typed authorization", () => {
		const rpc: Authorization.Rpc = {
			address: "0x0000000000000000000000000000000000000000",
			chainId: "0x1",
			nonce: "0x1",
			r: "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
			s: "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
			yParity: "0x0",
		};

		const auth = Authorization.fromRpc(rpc);

		expect(auth).toBeDefined();
		expect(auth.address).toBe("0x0000000000000000000000000000000000000000");
		expect(auth.chainId).toBe(1);
		expect(auth.nonce).toBe(1n);
	});
});

describe("Authorization.toRpc", () => {
	it("converts authorization to RPC format", () => {
		const auth = Authorization.from(
			{
				address: "0x0000000000000000000000000000000000000000",
				chainId: 1,
				nonce: 1n,
			},
			{
				signature: {
					r: 0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4dn,
					s: 0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540n,
					yParity: 0,
				},
			},
		);

		const rpc = Authorization.toRpc(auth as Authorization.Signed);

		expect(rpc).toBeDefined();
		expect(rpc.address).toBe("0x0000000000000000000000000000000000000000");
		expect(rpc.chainId).toBe("0x1");
		expect(rpc.nonce).toBe("0x1");
		expect("r" in rpc).toBe(true);
		expect("s" in rpc).toBe(true);
	});
});

// ============================================================================
// Tuple Conversion Tests
// ============================================================================

describe("Authorization.fromTuple", () => {
	it("converts unsigned tuple to authorization", () => {
		const tuple: Authorization.Tuple<false> = [
			"0x1",
			"0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
			"0x3",
		];

		const auth = Authorization.fromTuple(tuple);

		expect(auth).toBeDefined();
		expect(auth.address).toBe("0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c");
		expect(auth.chainId).toBe(1);
		expect(auth.nonce).toBe(3n);
	});

	it("converts signed tuple to authorization with signature", () => {
		const tuple: Authorization.Tuple<true> = [
			"0x1",
			"0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
			"0x3",
			"0x1",
			"0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90",
			"0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064",
		];

		const auth = Authorization.fromTuple(tuple);

		expect(auth).toBeDefined();
		expect("r" in auth).toBe(true);
		expect("s" in auth).toBe(true);
		expect("yParity" in auth).toBe(true);
	});
});

describe("Authorization.toTuple", () => {
	it("converts authorization to tuple", () => {
		const auth = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});

		const tuple = Authorization.toTuple(auth);

		expect(Array.isArray(tuple)).toBe(true);
		expect(tuple.length).toBe(3);
		expect(tuple[0]).toBe("0x1");
		expect(tuple[1]).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(tuple[2]).toBe("0x45");
	});
});

// ============================================================================
// List Conversion Tests
// ============================================================================

describe("Authorization list functions", () => {
	it("converts list from RPC format", () => {
		const rpcList: Authorization.ListRpc = [
			{
				address: "0x0000000000000000000000000000000000000000",
				chainId: "0x1",
				nonce: "0x1",
				r: "0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d",
				s: "0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540",
				yParity: "0x0",
			},
		];

		const list = Authorization.fromRpcList(rpcList);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBe(1);
	});

	it("converts list to RPC format", () => {
		const authList: Authorization.ListSigned = [
			Authorization.from(
				{
					address: "0x0000000000000000000000000000000000000000",
					chainId: 1,
					nonce: 1n,
				},
				{
					signature: {
						r: 0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4dn,
						s: 0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540n,
						yParity: 0,
					},
				},
			) as Authorization.Signed,
		];

		const rpcList = Authorization.toRpcList(authList);

		expect(Array.isArray(rpcList)).toBe(true);
		expect(rpcList.length).toBe(1);
	});

	it("converts from tuple list", () => {
		const tupleList: Authorization.TupleList = [
			["0x1", "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c", "0x3"],
			["0x3", "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c", "0x14"],
		];

		const list = Authorization.fromTupleList(tupleList);

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBe(2);
	});

	it("converts to tuple list", () => {
		const auth1 = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});
		const auth2 = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 3,
			nonce: 20n,
		});

		const tupleList = Authorization.toTupleList([auth1, auth2]);

		expect(Array.isArray(tupleList)).toBe(true);
		expect(tupleList.length).toBe(2);
	});
});

// ============================================================================
// Hash and Sign Payload Tests
// ============================================================================

describe("Authorization.hash", () => {
	it("computes hash for authorization", () => {
		const auth = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});

		const hash = Authorization.hash(auth);

		expect(typeof hash).toBe("string");
		expect(hash.startsWith("0x")).toBe(true);
		expect(hash.length).toBe(66); // 0x + 64 hex chars
	});

	it("computes presign hash when presign option is true", () => {
		const auth = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});

		const hash1 = Authorization.hash(auth, { presign: false });
		const hash2 = Authorization.hash(auth, { presign: true });

		// Both should be valid hashes
		expect(hash1.startsWith("0x")).toBe(true);
		expect(hash2.startsWith("0x")).toBe(true);
	});
});

describe("Authorization.getSignPayload", () => {
	it("gets sign payload for authorization", () => {
		const auth = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});

		const payload = Authorization.getSignPayload(auth);

		expect(typeof payload).toBe("string");
		expect(payload.startsWith("0x")).toBe(true);
		expect(payload.length).toBe(66); // 0x + 64 hex chars
	});
});

// ============================================================================
// Type Guard and Edge Case Tests
// ============================================================================

describe("Authorization types", () => {
	it("distinguishes signed from unsigned authorizations", () => {
		const unsigned = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 1,
			nonce: 69n,
		});

		const signed = Authorization.from(
			{
				address: "0x1234567890abcdef1234567890abcdef12345678",
				chainId: 1,
				nonce: 69n,
			},
			{
				signature: {
					r: 0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90n,
					s: 0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064n,
					yParity: 0,
				},
			},
		);

		expect("r" in unsigned).toBe(false);
		expect("r" in signed).toBe(true);
	});

	it("handles zero address", () => {
		const auth = Authorization.from({
			address: "0x0000000000000000000000000000000000000000",
			chainId: 1,
			nonce: 0n,
		});

		expect(auth.address).toBe("0x0000000000000000000000000000000000000000");
		expect(auth.nonce).toBe(0n);
	});

	it("handles large chain ID", () => {
		const auth = Authorization.from({
			address: "0x1234567890abcdef1234567890abcdef12345678",
			chainId: 999999999,
			nonce: 69n,
		});

		expect(auth.chainId).toBe(999999999);
	});
});

// ============================================================================
// Round-trip Tests
// ============================================================================

describe("Authorization round-trip conversions", () => {
	it("from -> toRpc -> fromRpc preserves data", () => {
		const original = Authorization.from(
			{
				address: "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
				chainId: 1,
				nonce: 40n,
			},
			{
				signature: {
					r: 0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b90n,
					s: 0x7e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064n,
					yParity: 0,
				},
			},
		);

		const rpc = Authorization.toRpc(original as Authorization.Signed);
		const restored = Authorization.fromRpc(rpc);

		expect(restored.address).toBe(original.address);
		expect(restored.chainId).toBe(original.chainId);
		expect(restored.nonce).toBe(original.nonce);
	});

	it("from -> toTuple -> fromTuple preserves data", () => {
		const original = Authorization.from({
			address: "0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c",
			chainId: 1,
			nonce: 40n,
		});

		const tuple = Authorization.toTuple(original);
		const restored = Authorization.fromTuple(tuple);

		expect(restored.address).toBe(original.address);
		expect(restored.chainId).toBe(original.chainId);
		expect(restored.nonce).toBe(original.nonce);
	});
});
