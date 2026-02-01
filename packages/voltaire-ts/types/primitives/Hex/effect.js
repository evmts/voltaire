import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { equals as _equals } from "./equals.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { isHex as _isHex } from "./isHex.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { validate as _validate } from "./validate.js";
export const HexBrand = Brand.refined((s) => typeof s === "string" && _isHex(s), (s) => Brand.error(`Expected 0x-prefixed hex string, got ${typeof s}`));
export class HexSchema extends Schema.Class("Hex")({
    value: Schema.String.pipe(Schema.filter((s) => _isHex(s), {
        message: () => "Invalid hex: must start with 0x and contain hex chars",
    })),
}) {
    get hex() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new HexSchema({ value: brand });
    }
    static from(value) {
        const hex = _validate(value);
        return new HexSchema({ value: hex });
    }
    static fromBytes(bytes) {
        const hex = _fromBytes(bytes);
        return new HexSchema({ value: hex });
    }
    toBytes() {
        return _toBytes(this.hex);
    }
    toString() {
        return this.hex;
    }
    equals(other) {
        // biome-ignore lint/suspicious/noExplicitAny: HexType is a branded string
        const rhs = other instanceof HexSchema ? other.hex : other;
        return _equals(this.hex, rhs);
    }
}
export const HexFromBytes = Schema.transform(Schema.Uint8ArrayFromSelf, Schema.instanceOf(HexSchema), {
    decode: (bytes) => HexSchema.fromBytes(bytes),
    encode: (h) => h.toBytes(),
});
export const HexFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(HexSchema), {
    decode: (value) => typeof value === "string"
        ? HexSchema.from(value)
        : HexSchema.fromBytes(value),
    encode: (h) => h.hex,
});
