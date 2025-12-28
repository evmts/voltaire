import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import type { EnsType } from "./EnsType.js";
import { from as _from } from "./from.js";
import {
	beautify as _beautify,
	labelhash as _labelhash,
	namehash as _namehash,
	normalize as _normalize,
} from "./index.js";
import { isValid as _isValid } from "./isValid.js";
import { toString as _toString } from "./toString.js";

export type EnsBrand = string & Brand.Brand<"Ens">;

export const EnsBrand = Brand.refined<EnsBrand>(
	(s): s is string & Brand.Brand<"Ens"> => typeof s === "string" && _isValid(s),
	() => Brand.error("Invalid ENS name"),
);

export class EnsSchema extends Schema.Class<EnsSchema>("Ens")({
	value: Schema.String.pipe(
		Schema.filter((s): s is string => _isValid(s), {
			message: () => "Invalid ENS: name failed validation",
		}),
	),
}) {
	get ens(): EnsType {
		return this.value as EnsType;
	}
	get branded(): EnsBrand {
		return this.value as EnsBrand;
	}
	static fromBranded(brand: EnsBrand): EnsSchema {
		return new EnsSchema({ value: brand });
	}
	static from(value: string): EnsSchema {
		return new EnsSchema({ value: _from(value) });
	}
	override toString(): string {
		return _toString(this.ens);
	}
	normalize(): EnsSchema {
		return new EnsSchema({ value: _normalize(this.ens) });
	}
	beautify(): EnsSchema {
		return new EnsSchema({ value: _beautify(this.ens) });
	}
	namehash(): Uint8Array {
		return _namehash(this.ens);
	}
	labelhash(): Uint8Array {
		return _labelhash(this.ens);
	}
}

export const EnsFromUnknown = Schema.transform(
	Schema.String,
	Schema.instanceOf(EnsSchema),
	{
		decode: (s) => EnsSchema.from(s),
		encode: (e) => e.ens,
	},
);
