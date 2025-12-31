import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import type { BrandedRlp } from "./RlpType.js";
import * as RlpImpl from "./internal-index.js";

export type RlpBrand = BrandedRlp & Brand.Brand<"Rlp">;

export const RlpBrand = Brand.refined<RlpBrand>(
	// biome-ignore lint/suspicious/noExplicitAny: Brand validation accepts unknown
	(v): v is RlpBrand => RlpImpl.validate(v as any) === true,
	() => Brand.error("Invalid RLP value"),
);

export class RlpSchema extends Schema.Class<RlpSchema>("Rlp")({
	value: Schema.Unknown,
}) {
	get rlp(): BrandedRlp {
		return this.value as BrandedRlp;
	}
	get branded(): RlpBrand {
		return this.value as RlpBrand;
	}

	static fromBranded(brand: RlpBrand): RlpSchema {
		// biome-ignore lint/suspicious/noExplicitAny: Schema class needs any for value
		return new RlpSchema({ value: brand as any });
	}

	static from(value: Uint8Array | BrandedRlp | BrandedRlp[]): RlpSchema {
		// biome-ignore lint/suspicious/noExplicitAny: accepting union type
		const r = RlpImpl.from(value as any);
		return new RlpSchema({ value: r });
	}

	encode(): Uint8Array {
		// biome-ignore lint/suspicious/noExplicitAny: runtime type checking
		const v: any = this.rlp as any;
		if (RlpImpl.isData(v)) return RlpImpl.encode(v);
		if (v instanceof Uint8Array) return RlpImpl.encodeBytes(v);
		// biome-ignore lint/suspicious/noExplicitAny: runtime type checking
		if (Array.isArray(v)) return RlpImpl.encodeList(v as any);
		// biome-ignore lint/suspicious/noExplicitAny: runtime type checking
		return RlpImpl.encode(v as any);
	}
	static decode(bytes: Uint8Array): RlpSchema {
		// biome-ignore lint/suspicious/noExplicitAny: decode returns unknown shape
		const d = RlpImpl.decode(bytes) as any;
		return new RlpSchema({ value: d.data });
	}
	equals(other: RlpSchema | BrandedRlp): boolean {
		const rhs = other instanceof RlpSchema ? other.rlp : other;
		return RlpImpl.equals(this.rlp, rhs);
	}
	toJSON(): unknown {
		return RlpImpl.toJSON(this.rlp);
	}
	toRaw(): unknown {
		return RlpImpl.toRaw(this.rlp);
	}
}
