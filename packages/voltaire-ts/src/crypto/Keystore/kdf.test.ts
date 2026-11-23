import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import { describe, expect, it, vi } from "vitest";
import { derivePbkdf2, deriveScrypt } from "./kdf.js";

vi.mock("@noble/hashes/pbkdf2.js", () => ({ pbkdf2: vi.fn() }));
vi.mock("@noble/hashes/scrypt.js", () => ({ scrypt: vi.fn() }));

describe("Keystore KDF limits", () => {
	const salt = new Uint8Array(32);

	it.each([
		[1, 8, 1, /scrypt N must be between/],
		[3, 8, 1, /N must be a power of 2/],
		[2 ** 21, 8, 1, /scrypt N must be between/],
		[2, 17, 1, /scrypt r must be an integer between/],
		[2, 0, 1, /scrypt r must be an integer between/],
		[2, 8, 17, /scrypt p must be an integer between/],
		[2, 8, 1.5, /scrypt p must be an integer between/],
	])("rejects scrypt N=%s r=%s p=%s before derivation", (n, r, p, error) => {
		vi.mocked(scrypt).mockClear();
		expect(() => deriveScrypt("password", salt, n, r, p)).toThrow(error);
		expect(scrypt).not.toHaveBeenCalled();
	});

	it("allows the scrypt parameter limits", () => {
		deriveScrypt("password", salt, 2 ** 20, 16, 16);
		expect(scrypt).toHaveBeenLastCalledWith(expect.any(Uint8Array), salt, {
			N: 2 ** 20,
			r: 16,
			p: 16,
			dkLen: 32,
		});
	});

	it.each([
		[0, /minimum 1/],
		[10_000_001, /PBKDF2 iterations must be at most 10000000/],
	])("rejects PBKDF2 iteration count %s before derivation", (c, error) => {
		vi.mocked(pbkdf2).mockClear();
		expect(() => derivePbkdf2("password", salt, c)).toThrow(error);
		expect(pbkdf2).not.toHaveBeenCalled();
	});

	it.each([0, -1, 1.5, 129, 2 ** 31, Number.NaN])(
		"rejects dklen %s before derivation",
		(dklen) => {
			vi.mocked(scrypt).mockClear();
			vi.mocked(pbkdf2).mockClear();
			expect(() => deriveScrypt("password", salt, 2, 8, 1, dklen)).toThrow(
				/dklen must be an integer between 1 and 128/,
			);
			expect(() => derivePbkdf2("password", salt, 1, dklen)).toThrow(
				/dklen must be an integer between 1 and 128/,
			);
			expect(scrypt).not.toHaveBeenCalled();
			expect(pbkdf2).not.toHaveBeenCalled();
		},
	);

	it("allows the dklen limit", () => {
		deriveScrypt("password", salt, 2, 8, 1, 128);
		expect(scrypt).toHaveBeenLastCalledWith(expect.any(Uint8Array), salt, {
			N: 2,
			r: 8,
			p: 1,
			dkLen: 128,
		});
		derivePbkdf2("password", salt, 1, 128);
		expect(pbkdf2).toHaveBeenLastCalledWith(
			expect.any(Function),
			expect.any(Uint8Array),
			salt,
			{ c: 1, dkLen: 128 },
		);
	});

	it("allows the PBKDF2 iteration limit", () => {
		derivePbkdf2("password", salt, 10_000_000);
		expect(pbkdf2).toHaveBeenLastCalledWith(
			expect.any(Function),
			expect.any(Uint8Array),
			salt,
			{ c: 10_000_000, dkLen: 32 },
		);
	});
});
