import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import * as RlpImpl from "./internal-index.js";
export const RlpBrand = Brand.refined(
// biome-ignore lint/suspicious/noExplicitAny: Brand validation accepts unknown
(v) => RlpImpl.validate(v) === true, () => Brand.error("Invalid RLP value"));
export class RlpSchema extends Schema.Class("Rlp")({
    value: Schema.Unknown,
}) {
    get rlp() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        // biome-ignore lint/suspicious/noExplicitAny: Schema class needs any for value
        return new RlpSchema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: accepting union type
        const r = RlpImpl.from(value);
        return new RlpSchema({ value: r });
    }
    encode() {
        // biome-ignore lint/suspicious/noExplicitAny: runtime type checking
        const v = this.rlp;
        if (RlpImpl.isData(v))
            return RlpImpl.encode(v);
        if (v instanceof Uint8Array)
            return RlpImpl.encodeBytes(v);
        // biome-ignore lint/suspicious/noExplicitAny: runtime type checking
        if (Array.isArray(v))
            return RlpImpl.encodeList(v);
        // biome-ignore lint/suspicious/noExplicitAny: runtime type checking
        return RlpImpl.encode(v);
    }
    static decode(bytes) {
        // biome-ignore lint/suspicious/noExplicitAny: decode returns unknown shape
        const d = RlpImpl.decode(bytes);
        return new RlpSchema({ value: d.data });
    }
    equals(other) {
        const rhs = other instanceof RlpSchema ? other.rlp : other;
        return RlpImpl.equals(this.rlp, rhs);
    }
    toJSON() {
        return RlpImpl.toJSON(this.rlp);
    }
    toRaw() {
        return RlpImpl.toRaw(this.rlp);
    }
}
