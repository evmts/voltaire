import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedRlp } from "./RlpType.js";
export type RlpBrand = BrandedRlp & Brand.Brand<"Rlp">;
export declare const RlpBrand: Brand.Brand.Constructor<RlpBrand>;
declare const RlpSchema_base: Schema.Class<RlpSchema, {
    value: typeof Schema.Unknown;
}, Schema.Struct.Encoded<{
    value: typeof Schema.Unknown;
}>, never, {
    readonly value: unknown;
}, {}, {}>;
export declare class RlpSchema extends RlpSchema_base {
    get rlp(): BrandedRlp;
    get branded(): RlpBrand;
    static fromBranded(brand: RlpBrand): RlpSchema;
    static from(value: Uint8Array | BrandedRlp | BrandedRlp[]): RlpSchema;
    encode(): Uint8Array;
    static decode(bytes: Uint8Array): RlpSchema;
    equals(other: RlpSchema | BrandedRlp): boolean;
    toJSON(): unknown;
    toRaw(): unknown;
}
export {};
//# sourceMappingURL=effect.d.ts.map