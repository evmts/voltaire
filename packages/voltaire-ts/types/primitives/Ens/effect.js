import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { from as _from } from "./from.js";
import { beautify as _beautify, labelhash as _labelhash, namehash as _namehash, normalize as _normalize, } from "./index.js";
import { isValid as _isValid } from "./isValid.js";
import { toString as _toString } from "./toString.js";
export const EnsBrand = Brand.refined((s) => typeof s === "string" && _isValid(s), () => Brand.error("Invalid ENS name"));
export class EnsSchema extends Schema.Class("Ens")({
    value: Schema.String.pipe(Schema.filter((s) => _isValid(s), {
        message: () => "Invalid ENS: name failed validation",
    })),
}) {
    get ens() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new EnsSchema({ value: brand });
    }
    static from(value) {
        return new EnsSchema({ value: _from(value) });
    }
    toString() {
        return _toString(this.ens);
    }
    normalize() {
        return new EnsSchema({ value: _normalize(this.ens) });
    }
    beautify() {
        return new EnsSchema({ value: _beautify(this.ens) });
    }
    namehash() {
        return _namehash(this.ens);
    }
    labelhash() {
        return _labelhash(this.ens);
    }
}
export const EnsFromUnknown = Schema.transform(Schema.String, Schema.instanceOf(EnsSchema), {
    decode: (s) => EnsSchema.from(s),
    encode: (e) => e.ens,
});
