import { describe, expect, it } from "vitest";
import { brand } from "../../brand.js";
import { ProviderInfo } from "./ProviderInfo.js";
import {
	InvalidFieldError,
	InvalidIconError,
	InvalidRdnsError,
	InvalidUuidError,
	MissingFieldError,
} from "./errors.js";

const validInput = {
	uuid: "350670db-19fa-4704-a166-e52e178b59d2",
	name: "Test Wallet",
	icon: "data:image/svg+xml;base64,PHN2Zz4=",
	rdns: "com.test.wallet",
};

describe("ProviderInfo", () => {
	it("creates a valid ProviderInfo from valid input", () => {
		const info = ProviderInfo(validInput);
		expect(info.uuid).toBe(validInput.uuid);
		expect(info.name).toBe(validInput.name);
		expect(info.icon).toBe(validInput.icon);
		expect(info.rdns).toBe(validInput.rdns);
	});

	it("returns frozen object", () => {
		const info = ProviderInfo(validInput);
		expect(Object.isFrozen(info)).toBe(true);
	});

	it("has correct brand", () => {
		const info = ProviderInfo(validInput);
		// biome-ignore lint/suspicious/noExplicitAny: testing brand access
		expect((info as any)[brand]).toBe("ProviderInfo");
	});

	it("preserves all input fields", () => {
		const info = ProviderInfo(validInput);
		expect(info.uuid).toBe(validInput.uuid);
		expect(info.name).toBe(validInput.name);
		expect(info.icon).toBe(validInput.icon);
		expect(info.rdns).toBe(validInput.rdns);
	});

	describe("uuid validation", () => {
		it("throws MissingFieldError when uuid is missing", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			const input = { ...validInput, uuid: undefined as any };
			expect(() => ProviderInfo(input)).toThrow(MissingFieldError);
		});

		it("throws InvalidUuidError when uuid is invalid", () => {
			const input = { ...validInput, uuid: "not-a-uuid" };
			expect(() => ProviderInfo(input)).toThrow(InvalidUuidError);
		});
	});

	describe("name validation", () => {
		it("throws MissingFieldError when name is missing", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			const input = { ...validInput, name: undefined as any };
			expect(() => ProviderInfo(input)).toThrow(MissingFieldError);
		});

		it("throws InvalidFieldError when name is empty", () => {
			const input = { ...validInput, name: "" };
			expect(() => ProviderInfo(input)).toThrow(InvalidFieldError);
		});
	});

	describe("icon validation", () => {
		it("throws MissingFieldError when icon is missing", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			const input = { ...validInput, icon: undefined as any };
			expect(() => ProviderInfo(input)).toThrow(MissingFieldError);
		});

		it("throws InvalidIconError when icon is not data URI", () => {
			const input = { ...validInput, icon: "https://example.com/icon.png" };
			expect(() => ProviderInfo(input)).toThrow(InvalidIconError);
		});
	});

	describe("rdns validation", () => {
		it("throws MissingFieldError when rdns is missing", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
			const input = { ...validInput, rdns: undefined as any };
			expect(() => ProviderInfo(input)).toThrow(MissingFieldError);
		});

		it("throws InvalidRdnsError when rdns is invalid", () => {
			const input = { ...validInput, rdns: "invalid" };
			expect(() => ProviderInfo(input)).toThrow(InvalidRdnsError);
		});
	});
});
