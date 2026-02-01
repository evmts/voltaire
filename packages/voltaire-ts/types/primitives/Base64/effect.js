import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { from as _from } from "./from.js";
import { fromUrlSafe as _fromUrlSafe } from "./fromUrlSafe.js";
import { isValid as _isValid } from "./isValid.js";
import { isValidUrlSafe as _isValidUrlSafe } from "./isValidUrlSafe.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toBytesUrlSafe as _toBytesUrlSafe } from "./toBytesUrlSafe.js";
import { toString as _toString } from "./toString.js";
import { toStringUrlSafe as _toStringUrlSafe } from "./toStringUrlSafe.js";
export const Base64Brand = Brand.refined((s) => typeof s === "string" && _isValid(s), () => Brand.error("Invalid base64 string"));
export const Base64UrlBrand = Brand.refined((s) => typeof s === "string" && _isValidUrlSafe(s), () => Brand.error("Invalid URL-safe base64 string"));
export class Base64Schema extends Schema.Class("Base64")({
    value: Schema.String.pipe(Schema.filter((s) => _isValid(s), {
        message: () => "Invalid base64: must be RFC 4648 with padding",
    })),
}) {
    get base64() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new Base64Schema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return new Base64Schema({ value: _from(value) });
    }
    toBytes() {
        return _toBytes(this.base64);
    }
    toString() {
        return _toString(this.base64);
    }
}
export class Base64UrlSchema extends Schema.Class("Base64Url")({
    value: Schema.String.pipe(Schema.filter((s) => _isValidUrlSafe(s), {
        message: () => "Invalid base64url: URL-safe base64 expected",
    })),
}) {
    get base64url() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new Base64UrlSchema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return new Base64UrlSchema({ value: _fromUrlSafe(value) });
    }
    toBytes() {
        return _toBytesUrlSafe(this.base64url);
    }
    toString() {
        return _toStringUrlSafe(this.base64url);
    }
}
export const Base64FromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(Base64Schema), {
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    decode: (v) => Base64Schema.from(v),
    encode: (b) => b.base64,
});
export const Base64UrlFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(Base64UrlSchema), {
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    decode: (v) => Base64UrlSchema.from(v),
    encode: (b) => b.base64url,
});
