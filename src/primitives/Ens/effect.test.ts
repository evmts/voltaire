import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import { EnsBrand, EnsFromUnknown, EnsSchema } from "./effect.js";

describe("Ens Effect Schema", () => {
	it("creates EnsSchema from string", () => {
		const e = EnsSchema.from("vitalik.eth");
		expect(e.toString()).toBe("vitalik.eth");
	});

	it("brand interop", () => {
		const brand = EnsBrand("vitalik.eth");
		const e = EnsSchema.fromBranded(brand);
		expect(e.branded).toBe(brand);
	});

	it("normalize and beautify return EnsSchema", () => {
		const e = EnsSchema.from("ViTaLik.ETH");
		expect(e.normalize().toString().toLowerCase()).toBe("vitalik.eth");
		expect(e.beautify()).toBeInstanceOf(EnsSchema);
	});

	it("namehash and labelhash return bytes", () => {
		const e = EnsSchema.from("vitalik.eth");
		expect(e.namehash()).toBeInstanceOf(Uint8Array);
		expect(e.labelhash()).toBeInstanceOf(Uint8Array);
	});

	it("transform from unknown", () => {
		const decode = Schema.decodeUnknownSync(EnsFromUnknown);
		const e = decode("vitalik.eth");
		expect(e).toBeInstanceOf(EnsSchema);
	});

	it("works with Effect.gen", async () => {
		const program = Effect.gen(function* () {
			const e = yield* Effect.sync(() => EnsSchema.from("vitalik.eth"));
			return e.toString();
		});
		const res = await Effect.runPromise(program);
		expect(res).toBe("vitalik.eth");
	});
});
