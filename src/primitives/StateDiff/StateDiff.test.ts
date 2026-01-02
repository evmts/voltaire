import { describe, expect, it } from "vitest";
import type { AddressType } from "../Address/AddressType.js";
import type { WeiType } from "../Denomination/WeiType.js";
import type { NonceType } from "../Nonce/NonceType.js";
import { from, getAccount, getAddresses, isEmpty } from "./index.js";
import type { AccountDiff } from "./StateDiffType.js";

describe("StateDiff", () => {
	const mockAddress1 = new Uint8Array(20) as AddressType;
	const mockAddress2 = new Uint8Array(20) as AddressType;
	mockAddress1[19] = 1;
	mockAddress2[19] = 2;

	const mockBalance1 = 100n as WeiType;
	const mockBalance2 = 200n as WeiType;
	const mockNonce1 = 0n as NonceType;
	const mockNonce2 = 1n as NonceType;

	describe("from", () => {
		it("creates from Map", () => {
			const accounts = new Map<AddressType, AccountDiff>([
				[mockAddress1, { balance: { from: null, to: mockBalance1 } }],
			]);

			const diff = from(accounts);

			expect(diff.accounts).toBe(accounts);
		});

		it("creates from array", () => {
			const accountsArray: Array<[AddressType, AccountDiff]> = [
				[mockAddress1, { nonce: { from: mockNonce1, to: mockNonce2 } }],
			];

			const diff = from(accountsArray);

			expect(diff.accounts.size).toBe(1);
			expect(diff.accounts.get(mockAddress1)).toEqual({
				nonce: { from: mockNonce1, to: mockNonce2 },
			});
		});

		it("creates from object with accounts", () => {
			const accounts = new Map<AddressType, AccountDiff>([
				[mockAddress1, { balance: { from: mockBalance1, to: mockBalance2 } }],
			]);

			const diff = from({ accounts });

			expect(diff.accounts).toBe(accounts);
		});

		it("creates empty diff", () => {
			const diff = from(new Map());

			expect(diff.accounts.size).toBe(0);
		});

		it("throws on invalid input", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(() => from(null as any)).toThrow("Invalid StateDiff input");
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(() => from(123 as any)).toThrow("Invalid StateDiff input");
		});
	});

	describe("getAccount", () => {
		it("returns account diff for existing address", () => {
			const accountDiff: AccountDiff = {
				balance: { from: null, to: mockBalance1 },
			};
			const diff = from(new Map([[mockAddress1, accountDiff]]));

			const result = getAccount(diff, mockAddress1);

			expect(result).toEqual(accountDiff);
		});

		it("returns undefined for non-existent address", () => {
			const diff = from(
				new Map([
					[mockAddress1, { balance: { from: null, to: mockBalance1 } }],
				]),
			);

			const result = getAccount(diff, mockAddress2);

			expect(result).toBeUndefined();
		});

		it("matches addresses by value", () => {
			const accountDiff: AccountDiff = {
				nonce: { from: mockNonce1, to: mockNonce2 },
			};
			const diff = from(new Map([[mockAddress1, accountDiff]]));

			// Create equivalent address (different object instance)
			const equivalentAddress = new Uint8Array(20) as AddressType;
			equivalentAddress[19] = 1;

			const result = getAccount(diff, equivalentAddress);

			expect(result).toEqual(accountDiff);
		});
	});

	describe("getAddresses", () => {
		it("returns all addresses", () => {
			const diff = from(
				new Map([
					[mockAddress1, { balance: { from: null, to: mockBalance1 } }],
					[mockAddress2, { nonce: { from: mockNonce1, to: mockNonce2 } }],
				]),
			);

			const addresses = getAddresses(diff);

			expect(addresses).toHaveLength(2);
			expect(addresses).toContain(mockAddress1);
			expect(addresses).toContain(mockAddress2);
		});

		it("returns empty array for no accounts", () => {
			const diff = from(new Map());

			const addresses = getAddresses(diff);

			expect(addresses).toHaveLength(0);
		});
	});

	describe("isEmpty", () => {
		it("returns true for empty diff", () => {
			const diff = from(new Map());

			expect(isEmpty(diff)).toBe(true);
		});

		it("returns false for non-empty diff", () => {
			const diff = from(
				new Map([
					[mockAddress1, { balance: { from: null, to: mockBalance1 } }],
				]),
			);

			expect(isEmpty(diff)).toBe(false);
		});
	});

	describe("complex account diffs", () => {
		it("handles all change types", () => {
			const code = new Uint8Array([0x60, 0x80]);
			const accountDiff: AccountDiff = {
				balance: { from: mockBalance1, to: mockBalance2 },
				nonce: { from: mockNonce1, to: mockNonce2 },
				code: { from: null, to: code },
				storage: new Map(),
			};

			const diff = from(new Map([[mockAddress1, accountDiff]]));
			const result = getAccount(diff, mockAddress1);

			expect(result?.balance).toEqual({
				from: mockBalance1,
				to: mockBalance2,
			});
			expect(result?.nonce).toEqual({ from: mockNonce1, to: mockNonce2 });
			expect(result?.code).toEqual({ from: null, to: code });
			expect(result?.storage).toBeDefined();
		});
	});
});
