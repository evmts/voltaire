import { describe, expect, it } from "vitest";
import {
	InvalidFieldError,
	InvalidIconError,
	InvalidProviderError,
	InvalidRdnsError,
	InvalidUuidError,
	MissingFieldError,
} from "./errors.js";
import {
	DATA_URI_REGEX,
	RDNS_REGEX,
	UUID_V4_REGEX,
	validateIcon,
	validateName,
	validateProvider,
	validateRdns,
	validateUuid,
} from "./validators.js";

describe("validateUuid", () => {
	it("accepts valid UUIDv4", () => {
		expect(() =>
			validateUuid("350670db-19fa-4704-a166-e52e178b59d2"),
		).not.toThrow();
	});

	it("throws MissingFieldError when uuid is undefined", () => {
		expect(() => validateUuid(undefined as any)).toThrow(MissingFieldError);
	});

	it("throws MissingFieldError when uuid is null", () => {
		expect(() => validateUuid(null as any)).toThrow(MissingFieldError);
	});

	it("throws InvalidUuidError when uuid is not UUIDv4 format", () => {
		expect(() => validateUuid("not-a-uuid")).toThrow(InvalidUuidError);
	});

	it("throws InvalidUuidError when uuid has wrong version", () => {
		// Version 1 UUID (not v4)
		expect(() => validateUuid("550e8400-e29b-11d4-a716-446655440000")).toThrow(
			InvalidUuidError,
		);
	});

	it("throws InvalidUuidError when uuid has wrong variant", () => {
		// Wrong variant (c instead of 8,9,a,b)
		expect(() => validateUuid("350670db-19fa-4704-c166-e52e178b59d2")).toThrow(
			InvalidUuidError,
		);
	});
});

describe("validateRdns", () => {
	it("accepts valid reverse DNS (e.g., io.metamask)", () => {
		expect(() => validateRdns("io.metamask")).not.toThrow();
	});

	it("accepts multi-level rdns (e.g., com.example.wallet)", () => {
		expect(() => validateRdns("com.example.wallet")).not.toThrow();
	});

	it("accepts rdns with hyphens", () => {
		expect(() => validateRdns("com.trust-wallet.app")).not.toThrow();
	});

	it("throws MissingFieldError when rdns is undefined", () => {
		expect(() => validateRdns(undefined as any)).toThrow(MissingFieldError);
	});

	it("throws InvalidRdnsError when rdns has no dots", () => {
		expect(() => validateRdns("metamask")).toThrow(InvalidRdnsError);
	});

	it("throws InvalidRdnsError when rdns starts with dot", () => {
		expect(() => validateRdns(".io.metamask")).toThrow(InvalidRdnsError);
	});

	it("throws InvalidRdnsError when rdns ends with dot", () => {
		expect(() => validateRdns("io.metamask.")).toThrow(InvalidRdnsError);
	});
});

describe("validateIcon", () => {
	it("accepts valid PNG data URI", () => {
		expect(() => validateIcon("data:image/png;base64,abc")).not.toThrow();
	});

	it("accepts valid JPEG data URI", () => {
		expect(() => validateIcon("data:image/jpeg;base64,abc")).not.toThrow();
	});

	it("accepts valid SVG data URI", () => {
		expect(() =>
			validateIcon("data:image/svg+xml;base64,PHN2Zz4="),
		).not.toThrow();
	});

	it("accepts valid WebP data URI", () => {
		expect(() => validateIcon("data:image/webp;base64,abc")).not.toThrow();
	});

	it("accepts valid GIF data URI", () => {
		expect(() => validateIcon("data:image/gif;base64,abc")).not.toThrow();
	});

	it("throws MissingFieldError when icon is undefined", () => {
		expect(() => validateIcon(undefined as any)).toThrow(MissingFieldError);
	});

	it("throws InvalidIconError when icon is not data URI", () => {
		expect(() => validateIcon("not-a-data-uri")).toThrow(InvalidIconError);
	});

	it("throws InvalidIconError when icon is URL", () => {
		expect(() => validateIcon("https://example.com/icon.png")).toThrow(
			InvalidIconError,
		);
	});
});

describe("validateProvider", () => {
	it("accepts provider with request function", () => {
		expect(() => validateProvider({ request: async () => {} })).not.toThrow();
	});

	it("throws MissingFieldError when provider is undefined", () => {
		expect(() => validateProvider(undefined)).toThrow(MissingFieldError);
	});

	it("throws InvalidProviderError when request is not a function", () => {
		expect(() => validateProvider({ request: "not-a-function" })).toThrow(
			InvalidProviderError,
		);
	});

	it("throws InvalidProviderError when provider is null", () => {
		expect(() => validateProvider(null)).toThrow(MissingFieldError);
	});

	it("throws InvalidProviderError when provider has no request", () => {
		expect(() => validateProvider({})).toThrow(InvalidProviderError);
	});
});

describe("validateName", () => {
	it("accepts non-empty string", () => {
		expect(() => validateName("Test Wallet")).not.toThrow();
	});

	it("throws MissingFieldError when name is undefined", () => {
		expect(() => validateName(undefined as any)).toThrow(MissingFieldError);
	});

	it("throws InvalidFieldError when name is empty string", () => {
		expect(() => validateName("")).toThrow(InvalidFieldError);
	});

	it("throws InvalidFieldError when name is whitespace only", () => {
		expect(() => validateName("   ")).toThrow(InvalidFieldError);
	});
});

describe("regex patterns", () => {
	it("UUID_V4_REGEX matches valid UUIDv4", () => {
		expect(UUID_V4_REGEX.test("350670db-19fa-4704-a166-e52e178b59d2")).toBe(
			true,
		);
	});

	it("UUID_V4_REGEX rejects invalid UUID", () => {
		expect(UUID_V4_REGEX.test("not-a-uuid")).toBe(false);
	});

	it("RDNS_REGEX matches valid reverse DNS", () => {
		expect(RDNS_REGEX.test("io.metamask")).toBe(true);
		expect(RDNS_REGEX.test("com.example.wallet")).toBe(true);
	});

	it("RDNS_REGEX rejects invalid RDNS", () => {
		expect(RDNS_REGEX.test("metamask")).toBe(false);
		expect(RDNS_REGEX.test(".io.metamask")).toBe(false);
	});

	it("DATA_URI_REGEX matches valid image data URIs", () => {
		expect(DATA_URI_REGEX.test("data:image/png;base64,abc")).toBe(true);
		expect(DATA_URI_REGEX.test("data:image/svg+xml;base64,abc")).toBe(true);
	});

	it("DATA_URI_REGEX rejects invalid data URIs", () => {
		expect(DATA_URI_REGEX.test("https://example.com/icon.png")).toBe(false);
	});
});
