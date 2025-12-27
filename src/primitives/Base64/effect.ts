import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";

import type { BrandedBase64, BrandedBase64Url } from "./Base64Type.js";
import { isValid as _isValid } from "./isValid.js";
import { isValidUrlSafe as _isValidUrlSafe } from "./isValidUrlSafe.js";
import { from as _from } from "./from.js";
import { fromUrlSafe as _fromUrlSafe } from "./fromUrlSafe.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toBytesUrlSafe as _toBytesUrlSafe } from "./toBytesUrlSafe.js";
import { toString as _toString } from "./toString.js";
import { toStringUrlSafe as _toStringUrlSafe } from "./toStringUrlSafe.js";

export type Base64Brand = string & Brand.Brand<"Base64">;
export type Base64UrlBrand = string & Brand.Brand<"Base64Url">;

export const Base64Brand = Brand.refined<Base64Brand>(
  (s): s is string & Brand.Brand<"Base64"> => typeof s === "string" && _isValid(s),
  () => Brand.error("Invalid base64 string"),
);

export const Base64UrlBrand = Brand.refined<Base64UrlBrand>(
  (s): s is string & Brand.Brand<"Base64Url"> => typeof s === "string" && _isValidUrlSafe(s),
  () => Brand.error("Invalid URL-safe base64 string"),
);

export class Base64Schema extends Schema.Class<Base64Schema>("Base64")({
  value: Schema.String.pipe(
    Schema.filter((s): s is string => _isValid(s), {
      message: () => "Invalid base64: must be RFC 4648 with padding",
    }),
  ),
}) {
  get base64(): BrandedBase64 { return this.value as BrandedBase64; }
  get branded(): Base64Brand { return this.value as Base64Brand; }
  static fromBranded(brand: Base64Brand): Base64Schema { return new Base64Schema({ value: brand }); }
  static from(value: string | Uint8Array): Base64Schema { return new Base64Schema({ value: _from(value as any) }); }
  toBytes(): Uint8Array { return _toBytes(this.base64); }
  override toString(): string { return _toString(this.base64); }
}

export class Base64UrlSchema extends Schema.Class<Base64UrlSchema>("Base64Url")({
  value: Schema.String.pipe(
    Schema.filter((s): s is string => _isValidUrlSafe(s), {
      message: () => "Invalid base64url: URL-safe base64 expected",
    }),
  ),
}) {
  get base64url(): BrandedBase64Url { return this.value as BrandedBase64Url; }
  get branded(): Base64UrlBrand { return this.value as Base64UrlBrand; }
  static fromBranded(brand: Base64UrlBrand): Base64UrlSchema { return new Base64UrlSchema({ value: brand }); }
  static from(value: string | Uint8Array): Base64UrlSchema { return new Base64UrlSchema({ value: _fromUrlSafe(value as any) }); }
  toBytes(): Uint8Array { return _toBytesUrlSafe(this.base64url); }
  override toString(): string { return _toStringUrlSafe(this.base64url); }
}

export const Base64FromUnknown = Schema.transform(
  Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
  Schema.instanceOf(Base64Schema),
  {
    decode: (v) => Base64Schema.from(v as any),
    encode: (b) => b.base64,
  },
);

export const Base64UrlFromUnknown = Schema.transform(
  Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
  Schema.instanceOf(Base64UrlSchema),
  {
    decode: (v) => Base64UrlSchema.from(v as any),
    encode: (b) => b.base64url,
  },
);
