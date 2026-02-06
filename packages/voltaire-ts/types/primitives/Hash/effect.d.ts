import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { HashType } from "./HashType.js";
export type HashBrand = Uint8Array & Brand.Brand<"Hash">;
export declare const HashBrand: Brand.Brand.Constructor<HashBrand>;
declare const HashSchema_base: Schema.Class<HashSchema, {
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly value: Uint8Array<ArrayBufferLike>;
}, {}, {}>;
export declare class HashSchema extends HashSchema_base {
    get hash(): HashType;
    get branded(): HashBrand;
    static fromBranded(brand: HashBrand): HashSchema;
    static from(value: string | Uint8Array | HashType): HashSchema;
    static fromHex(hex: string): HashSchema;
    static fromBytes(bytes: Uint8Array): HashSchema;
    toHex(): string;
    toBytes(): Uint8Array;
    equals(other: HashSchema | HashType): boolean;
    isZero(): boolean;
    clone(): HashSchema;
    slice(start: number, end?: number): Uint8Array;
    format(): string;
}
export declare const HashFromHex: Schema.transform<typeof Schema.String, Schema.instanceOf<HashSchema>>;
export declare const HashFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<HashSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map