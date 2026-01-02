import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { clone as _clone } from "./clone.js";
import { SIZE } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { format as _format } from "./format.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import type { HashType } from "./HashType.js";
import { isZero as _isZero } from "./isZero.js";
import { slice as _slice } from "./slice.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";

export type HashBrand = Uint8Array & Brand.Brand<"Hash">;

export const HashBrand = Brand.refined<HashBrand>(
	(bytes): bytes is Uint8Array & Brand.Brand<"Hash"> =>
		bytes instanceof Uint8Array && bytes.length === SIZE,
	(bytes) =>
		Brand.error(
			`Expected ${SIZE}-byte Uint8Array, got ${
				bytes instanceof Uint8Array ? `${bytes.length} bytes` : typeof bytes
			}`,
		),
);

export class HashSchema extends Schema.Class<HashSchema>("Hash")({
	value: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter((bytes): bytes is Uint8Array => bytes.length === SIZE, {
			message: () => `Invalid hash: must be ${SIZE} bytes`,
		}),
	),
}) {
	get hash(): HashType {
		return this.value as HashType;
	}

	get branded(): HashBrand {
		return this.value as HashBrand;
	}

	static fromBranded(brand: HashBrand): HashSchema {
		return new HashSchema({ value: brand });
	}

	static from(value: string | Uint8Array | HashType): HashSchema {
		// biome-ignore lint/suspicious/noExplicitAny: union type requires cast for polymorphic from()
		const h = _from(value as any);
		return new HashSchema({ value: h });
	}

	static fromHex(hex: string): HashSchema {
		const h = _fromHex(hex);
		return new HashSchema({ value: h });
	}

	static fromBytes(bytes: Uint8Array): HashSchema {
		const h = _fromBytes(bytes);
		return new HashSchema({ value: h });
	}

	toHex(): string {
		return _toHex(this.hash);
	}

	toBytes(): Uint8Array {
		return _toBytes(this.hash);
	}

	equals(other: HashSchema | HashType): boolean {
		const rhs = other instanceof HashSchema ? other.hash : other;
		return _equals(this.hash, rhs as HashType);
	}

	isZero(): boolean {
		return _isZero(this.hash);
	}

	clone(): HashSchema {
		const h = _clone(this.hash);
		return new HashSchema({ value: h });
	}

	slice(start: number, end?: number): Uint8Array {
		return _slice(this.hash, start, end);
	}

	format(): string {
		return _format(this.hash);
	}
}

export const HashFromHex = Schema.transform(
	Schema.String,
	Schema.instanceOf(HashSchema),
	{
		decode: (hex) => HashSchema.fromHex(hex),
		encode: (h) => h.toHex(),
	},
);

export const HashFromUnknown = Schema.transform(
	Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
	Schema.instanceOf(HashSchema),
	{
		// biome-ignore lint/suspicious/noExplicitAny: union type requires cast for polymorphic from()
		decode: (value) => HashSchema.from(value as any),
		encode: (h) => h.hash,
	},
);
