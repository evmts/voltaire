import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import type { BrandedBytecode } from "./BytecodeType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { size as _size } from "./size.js";
import { toHex as _toHex } from "./toHex.js";
import { validate as _validate } from "./validate.js";

export type BytecodeBrand = Uint8Array & Brand.Brand<"Bytecode">;

export const BytecodeBrand = Brand.refined<BytecodeBrand>(
	(bytes): bytes is Uint8Array & Brand.Brand<"Bytecode"> =>
		// biome-ignore lint/suspicious/noExplicitAny: type coercion required
		bytes instanceof Uint8Array && _validate(bytes as any),
	() => Brand.error("Invalid Bytecode: validation failed"),
);

export class BytecodeSchema extends Schema.Class<BytecodeSchema>("Bytecode")({
	value: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(
			(bytes): bytes is Uint8Array =>
				// biome-ignore lint/suspicious/noExplicitAny: type coercion required
				bytes instanceof Uint8Array && _validate(bytes as any),
			{
				message: () => "Invalid bytecode: validation failed",
			},
		),
	),
}) {
	get bytecode(): BrandedBytecode {
		return this.value as BrandedBytecode;
	}
	get branded(): BytecodeBrand {
		return this.value as BytecodeBrand;
	}
	static fromBranded(brand: BytecodeBrand): BytecodeSchema {
		return new BytecodeSchema({ value: brand });
	}
	static from(value: string | Uint8Array): BytecodeSchema {
		return new BytecodeSchema({ value: _from(value) });
	}
	static fromHex(hex: string): BytecodeSchema {
		return new BytecodeSchema({ value: _fromHex(hex) });
	}
	toHex(prefix = true): string {
		return _toHex(this.bytecode, prefix);
	}
	equals(other: BytecodeSchema | BrandedBytecode): boolean {
		const rhs = other instanceof BytecodeSchema ? other.bytecode : other;
		return _equals(this.bytecode, rhs as BrandedBytecode);
	}
	size(): number {
		return _size(this.bytecode);
	}
}

export const BytecodeFromUnknown = Schema.transform(
	Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
	Schema.instanceOf(BytecodeSchema),
	{
		decode: (v) =>
			typeof v === "string"
				? BytecodeSchema.fromHex(v)
				: BytecodeSchema.from(v),
		encode: (b) => b.bytecode,
	},
);
