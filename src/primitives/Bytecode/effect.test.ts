import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
	BytecodeBrand,
	BytecodeFromUnknown,
	BytecodeSchema,
} from "./effect.js";

describe("Bytecode Effect Schema", () => {
	const hex = "0x6001"; // PUSH1 0x01

	it("creates from hex and bytes", () => {
		const b1 = BytecodeSchema.fromHex(hex);
		expect(b1.toHex()).toBe(hex);
		const b2 = BytecodeSchema.from(b1.bytecode);
		expect(b2.equals(b1)).toBe(true);
	});

	it("brand interop", () => {
		const b = BytecodeSchema.fromHex(hex);
		const brand = BytecodeBrand(b.bytecode);
		const s = BytecodeSchema.fromBranded(brand);
		expect(s.branded).toBe(brand);
	});

	it("transform from unknown", () => {
		const decode = Schema.decodeUnknownSync(BytecodeFromUnknown);
		const b = decode(hex);
		expect(b).toBeInstanceOf(BytecodeSchema);
	});

	it("works with Effect.gen", async () => {
		const program = Effect.gen(function* () {
			const b = yield* Effect.sync(() => BytecodeSchema.fromHex(hex));
			return b.size() > 0;
		});
		const res = await Effect.runPromise(program);
		expect(res).toBe(true);
	});
});
