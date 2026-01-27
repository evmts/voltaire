import * as Brand from "effect/Brand";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
import { clone as _clone } from "./clone.js";
import { equals as _equals } from "./equals.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import type { HexType } from "./HexType.js";
import { isHex as _isHex } from "./isHex.js";
import { isSized as _isSized } from "./isSized.js";
import { random as _random } from "./random.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { validate as _validate } from "./validate.js";
import { zero as _zero } from "./zero.js";

export type { HexType } from "./HexType.js";

export type HexBrand = string & Brand.Brand<"Hex">;

export const HexBrand = Brand.refined<HexBrand>(
	(s): s is string & Brand.Brand<"Hex"> => typeof s === "string" && _isHex(s),
	(s) => Brand.error(`Expected 0x-prefixed hex string, got ${typeof s}`),
);

const HexTypeSchema = Schema.declare<HexType>(
	(u): u is HexType => {
		if (typeof u !== "string") return false;
		try {
			_validate(u);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "Hex" },
);

export const String: Schema.Schema<HexType, string> = Schema.transformOrFail(
	Schema.String,
	HexTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(_validate(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (h) => ParseResult.succeed(h),
	},
).annotations({ identifier: "Hex.String" });

export const Bytes: Schema.Schema<HexType, Uint8Array> = Schema.transformOrFail(
	Schema.Uint8ArrayFromSelf,
	HexTypeSchema,
	{
		strict: true,
		decode: (bytes) => ParseResult.succeed(_fromBytes(bytes)),
		encode: (h, _options, ast) => {
			try {
				return ParseResult.succeed(_toBytes(h));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, h, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "Hex.Bytes" });

export class HexSchema extends Schema.Class<HexSchema>("Hex")({
	value: Schema.String.pipe(
		Schema.filter((s): s is string => _isHex(s), {
			message: () => "Invalid hex: must start with 0x and contain hex chars",
		}),
	),
}) {
	get hex(): HexType {
		return this.value as HexType;
	}

	get branded(): HexBrand {
		return this.value as HexBrand;
	}

	static fromBranded(brand: HexBrand): HexSchema {
		return new HexSchema({ value: brand });
	}

	static from(value: string): HexSchema {
		const hex = _validate(value);
		return new HexSchema({ value: hex });
	}

	static fromBytes(bytes: Uint8Array): HexSchema {
		const hex = _fromBytes(bytes);
		return new HexSchema({ value: hex });
	}

	toBytes(): Uint8Array {
		return _toBytes(this.hex);
	}

	override toString(): string {
		return this.hex;
	}

	equals(other: HexSchema | HexType | string): boolean {
		// biome-ignore lint/suspicious/noExplicitAny: HexType is a branded string
		const rhs = other instanceof HexSchema ? other.hex : (other as any);
		return _equals(this.hex, rhs);
	}
}

export const HexFromBytes = Schema.transform(
	Schema.Uint8ArrayFromSelf,
	Schema.instanceOf(HexSchema),
	{
		decode: (bytes) => HexSchema.fromBytes(bytes),
		encode: (h) => h.toBytes(),
	},
);

export const HexFromUnknown = Schema.transform(
	Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
	Schema.instanceOf(HexSchema),
	{
		decode: (value) =>
			typeof value === "string"
				? HexSchema.from(value)
				: HexSchema.fromBytes(value),
		encode: (h) => h.hex,
	},
);

export const clone = _clone;
export const equals = _equals;
export const isHex = _isHex;
export const isSized = _isSized;
export const random = _random;
export const zero = _zero;
