import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
	Base64Brand,
	Base64FromUnknown,
	Base64Schema,
	Base64UrlBrand,
	Base64UrlFromUnknown,
	Base64UrlSchema,
} from "./effect.js";

describe("Base64 Effect Schema", () => {
	const hello = new TextEncoder().encode("Hello");
	const helloB64 = "SGVsbG8=";
	const helloB64Url = "SGVsbG8"; // without padding

	it("creates Base64Schema from string and bytes", () => {
		const b1 = Base64Schema.from(helloB64);
		expect(b1.toBytes()).toBeInstanceOf(Uint8Array);
		const b2 = Base64Schema.from(hello);
		expect(b2.toString()).toBe(helloB64);
	});

	it("brand interop (standard)", () => {
		const brand = Base64Brand(helloB64);
		const s = Base64Schema.fromBranded(brand);
		expect(s.branded).toBe(brand);
	});

	it("transform from unknown (standard)", () => {
		const decode = Schema.decodeUnknownSync(Base64FromUnknown);
		const s = decode(helloB64);
		expect(s).toBeInstanceOf(Base64Schema);
	});

	it("base64url schema", () => {
		const u1 = Base64UrlSchema.from(helloB64Url);
		expect(u1.toBytes()).toBeInstanceOf(Uint8Array);
		const brand = Base64UrlBrand(helloB64Url);
		const u2 = Base64UrlSchema.fromBranded(brand);
		expect(u2.branded).toBe(brand);
	});

	it("transform from unknown (url)", () => {
		const decode = Schema.decodeUnknownSync(Base64UrlFromUnknown);
		const u = decode(helloB64Url);
		expect(u).toBeInstanceOf(Base64UrlSchema);
	});

	it("works with Effect.gen", async () => {
		const program = Effect.gen(function* () {
			const s = yield* Effect.sync(() => Base64Schema.from(hello));
			return s.toString();
		});
		const res = await Effect.runPromise(program);
		expect(res).toBe(helloB64);
	});
});
