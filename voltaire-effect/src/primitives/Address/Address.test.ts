import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import { KeccakLive } from "../../crypto/Keccak256/index.js";
import * as Address from "./index.js";

describe("Address.Hex", () => {
	describe("decode", () => {
		it("parses valid lowercase hex", () => {
			const addr = S.decodeSync(Address.Hex)(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("parses valid checksummed hex", () => {
			const addr = S.decodeSync(Address.Hex)(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			expect(addr.length).toBe(20);
		});

		it("parses valid uppercase hex", () => {
			const addr = S.decodeSync(Address.Hex)(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			expect(addr.length).toBe(20);
		});

		it("fails on invalid hex", () => {
			expect(() => S.decodeSync(Address.Hex)("invalid")).toThrow();
		});

		it("fails on wrong length", () => {
			expect(() => S.decodeSync(Address.Hex)("0x742d35")).toThrow();
		});

		it("fails on missing 0x prefix", () => {
			expect(() =>
				S.decodeSync(Address.Hex)(
					"742d35cc6634c0532925a3b844bc9e7595f251e3",
				),
			).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex", () => {
			const addr = S.decodeSync(Address.Hex)(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const hex = S.encodeSync(Address.Hex)(addr);
			expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});
	});

	describe("round-trip", () => {
		it("decode(encode(addr)) === addr", () => {
			const original = S.decodeSync(Address.Hex)(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const encoded = S.encodeSync(Address.Hex)(original);
			const decoded = S.decodeSync(Address.Hex)(encoded);
			expect(Address.equals(original, decoded)).toBe(true);
		});
	});
});

describe("Address.Bytes", () => {
	describe("decode", () => {
		it("parses 20-byte array", () => {
			const bytes = new Uint8Array(20).fill(0xab);
			const addr = S.decodeSync(Address.Bytes)(bytes);
			expect(addr.length).toBe(20);
		});

		it("fails on wrong length", () => {
			const bytes = new Uint8Array(19);
			expect(() => S.decodeSync(Address.Bytes)(bytes)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const addr = S.decodeSync(Address.Hex)(
				"0xabababababababababababababababababababab",
			);
			const bytes = S.encodeSync(Address.Bytes)(addr);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(20);
			expect(bytes[0]).toBe(0xab);
		});
	});
});

describe("Address.Checksummed", () => {
	describe("decode", () => {
		it("parses valid checksummed address", async () => {
			const program = S.decode(Address.Checksummed)(
				"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			);
			const addr = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakLive)),
			);
			expect(addr.length).toBe(20);
		});

		it("fails on invalid checksum (all lowercase)", async () => {
			const program = S.decode(Address.Checksummed)(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const result = await Effect.runPromiseExit(
				program.pipe(Effect.provide(KeccakLive)),
			);
			expect(result._tag).toBe("Failure");
		});

		it("fails on invalid checksum (wrong case)", async () => {
			const program = S.decode(Address.Checksummed)(
				"0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED",
			);
			const result = await Effect.runPromiseExit(
				program.pipe(Effect.provide(KeccakLive)),
			);
			expect(result._tag).toBe("Failure");
		});
	});

	describe("encode", () => {
		it("encodes to checksummed format (requires KeccakService)", async () => {
			const addr = S.decodeSync(Address.Hex)(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const program = S.encode(Address.Checksummed)(addr);
			const checksummed = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakLive)),
			);
			expect(checksummed).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
		});

		it("round-trips correctly", async () => {
			const original = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
			const program = S.decode(Address.Checksummed)(original);
			const addr = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakLive)),
			);
			const encodeProgram = S.encode(Address.Checksummed)(addr);
			const result = await Effect.runPromise(
				encodeProgram.pipe(Effect.provide(KeccakLive)),
			);
			expect(result).toBe(original);
		});
	});
});

describe("pure functions", () => {
	const addrA = S.decodeSync(Address.Hex)(
		"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
	);
	const addrB = S.decodeSync(Address.Hex)(
		"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
	);
	const addrC = S.decodeSync(Address.Hex)(
		"0x0000000000000000000000000000000000000000",
	);

	it("equals", () => {
		expect(Address.equals(addrA, addrB)).toBe(true);
		expect(Address.equals(addrA, addrC)).toBe(false);
	});

	it("isZero", () => {
		expect(Address.isZero(addrC)).toBe(true);
		expect(Address.isZero(addrA)).toBe(false);
	});

	it("compare", () => {
		expect(Address.compare(addrA, addrB)).toBe(0);
		expect(Address.compare(addrC, addrA)).toBe(-1);
		expect(Address.compare(addrA, addrC)).toBe(1);
	});

	it("lessThan", () => {
		expect(Address.lessThan(addrC, addrA)).toBe(true);
		expect(Address.lessThan(addrA, addrC)).toBe(false);
	});

	it("greaterThan", () => {
		expect(Address.greaterThan(addrA, addrC)).toBe(true);
		expect(Address.greaterThan(addrC, addrA)).toBe(false);
	});

	it("clone", () => {
		const cloned = Address.clone(addrA);
		expect(Address.equals(addrA, cloned)).toBe(true);
		expect(cloned).not.toBe(addrA);
	});

	it("toBytes", () => {
		const bytes = Address.toBytes(addrA);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBe(20);
	});

	it("toLowercase", () => {
		const lower = Address.toLowercase(addrA);
		expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
	});

	it("toShortHex", () => {
		const short = Address.toShortHex(addrA);
		expect(short).toMatch(/^0x[a-f0-9]+\.{3}[a-f0-9]+$/);
	});

	it("isValid", () => {
		expect(Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
			true,
		);
		expect(Address.isValid("invalid")).toBe(false);
	});

	it("isValidChecksum", () => {
		expect(
			Address.isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
		).toBe(true);
		expect(
			Address.isValidChecksum("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
		).toBe(false);
	});
});
