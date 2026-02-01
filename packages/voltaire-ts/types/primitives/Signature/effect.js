import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { getAlgorithm as _getAlgorithm } from "./getAlgorithm.js";
import { getR as _getR } from "./getR.js";
import { getS as _getS } from "./getS.js";
import { getV as _getV } from "./getV.js";
import { is as _is } from "./is.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
export const SignatureBrand = Brand.refined((bytes) => _is(bytes), () => Brand.error("Invalid Signature: expected SignatureType"));
export class SignatureSchema extends Schema.Class("Signature")({
    value: Schema.Uint8ArrayFromSelf.pipe(Schema.filter((bytes) => _is(bytes), {
        message: () => "Invalid signature: not a SignatureType",
    })),
}) {
    get signature() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new SignatureSchema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: accepting union type
        const s = _from(value);
        return new SignatureSchema({ value: s });
    }
    static fromHex(hex) {
        const s = _fromHex(hex);
        return new SignatureSchema({ value: s });
    }
    static fromBytes(bytes) {
        const s = _fromBytes(bytes);
        return new SignatureSchema({ value: s });
    }
    toBytes() {
        return _toBytes(this.signature);
    }
    toHex() {
        return _toHex(this.signature);
    }
    equals(other) {
        const rhs = other instanceof SignatureSchema ? other.signature : other;
        return _equals(this.signature, rhs);
    }
    getR() {
        return _getR(this.signature);
    }
    getS() {
        return _getS(this.signature);
    }
    getV() {
        return _getV(this.signature);
    }
    getAlgorithm() {
        return _getAlgorithm(this.signature);
    }
}
export const SignatureFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(SignatureSchema), {
    decode: (v) => typeof v === "string"
        ? SignatureSchema.fromHex(v)
        : SignatureSchema.fromBytes(v),
    encode: (s) => s.signature,
});
