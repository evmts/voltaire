import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
export type BlobBrand = Uint8Array & Brand.Brand<"Blob">;
export declare const BlobBrand: Brand.Brand.Constructor<BlobBrand>;
declare const BlobSchema_base: Schema.Class<BlobSchema, {
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly value: Uint8Array<ArrayBufferLike>;
}, {}, {}>;
export declare class BlobSchema extends BlobSchema_base {
    get blob(): Uint8Array;
    get branded(): BlobBrand;
    static fromBranded(brand: BlobBrand): BlobSchema;
    static from(bytes: Uint8Array): BlobSchema;
    static fromData(data: Uint8Array): BlobSchema;
    toData(): Uint8Array;
    static estimateBlobCount(size: number): number;
    static calculateGas(count: number): number;
}
export {};
//# sourceMappingURL=effect.d.ts.map