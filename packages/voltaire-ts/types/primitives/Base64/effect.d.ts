import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedBase64, BrandedBase64Url } from "./Base64Type.js";
export type Base64Brand = string & Brand.Brand<"Base64">;
export type Base64UrlBrand = string & Brand.Brand<"Base64Url">;
export declare const Base64Brand: Brand.Brand.Constructor<Base64Brand>;
export declare const Base64UrlBrand: Brand.Brand.Constructor<Base64UrlBrand>;
declare const Base64Schema_base: Schema.Class<Base64Schema, {
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}>, never, {
    readonly value: string;
}, {}, {}>;
export declare class Base64Schema extends Base64Schema_base {
    get base64(): BrandedBase64;
    get branded(): Base64Brand;
    static fromBranded(brand: Base64Brand): Base64Schema;
    static from(value: string | Uint8Array): Base64Schema;
    toBytes(): Uint8Array;
    toString(): string;
}
declare const Base64UrlSchema_base: Schema.Class<Base64UrlSchema, {
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}>, never, {
    readonly value: string;
}, {}, {}>;
export declare class Base64UrlSchema extends Base64UrlSchema_base {
    get base64url(): BrandedBase64Url;
    get branded(): Base64UrlBrand;
    static fromBranded(brand: Base64UrlBrand): Base64UrlSchema;
    static from(value: string | Uint8Array): Base64UrlSchema;
    toBytes(): Uint8Array;
    toString(): string;
}
export declare const Base64FromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<Base64Schema>>;
export declare const Base64UrlFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<Base64UrlSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map