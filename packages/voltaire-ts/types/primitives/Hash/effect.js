import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { clone as _clone } from "./clone.js";
import { SIZE } from "./constants.js";
import { equals as _equals } from "./equals.js";
import { format as _format } from "./format.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { isZero as _isZero } from "./isZero.js";
import { slice as _slice } from "./slice.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
export const HashBrand = Brand.refined((bytes) => bytes instanceof Uint8Array && bytes.length === SIZE, (bytes) => Brand.error(`Expected ${SIZE}-byte Uint8Array, got ${bytes instanceof Uint8Array ? `${bytes.length} bytes` : typeof bytes}`));
export class HashSchema extends Schema.Class("Hash")({
    value: Schema.Uint8ArrayFromSelf.pipe(Schema.filter((bytes) => bytes.length === SIZE, {
        message: () => `Invalid hash: must be ${SIZE} bytes`,
    })),
}) {
    get hash() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new HashSchema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: union type requires cast for polymorphic from()
        const h = _from(value);
        return new HashSchema({ value: h });
    }
    static fromHex(hex) {
        const h = _fromHex(hex);
        return new HashSchema({ value: h });
    }
    static fromBytes(bytes) {
        const h = _fromBytes(bytes);
        return new HashSchema({ value: h });
    }
    toHex() {
        return _toHex(this.hash);
    }
    toBytes() {
        return _toBytes(this.hash);
    }
    equals(other) {
        const rhs = other instanceof HashSchema ? other.hash : other;
        return _equals(this.hash, rhs);
    }
    isZero() {
        return _isZero(this.hash);
    }
    clone() {
        const h = _clone(this.hash);
        return new HashSchema({ value: h });
    }
    slice(start, end) {
        return _slice(this.hash, start, end);
    }
    format() {
        return _format(this.hash);
    }
}
export const HashFromHex = Schema.transform(Schema.String, Schema.instanceOf(HashSchema), {
    decode: (hex) => HashSchema.fromHex(hex),
    encode: (h) => h.toHex(),
});
export const HashFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(HashSchema), {
    // biome-ignore lint/suspicious/noExplicitAny: union type requires cast for polymorphic from()
    decode: (value) => HashSchema.from(value),
    encode: (h) => h.hash,
});
