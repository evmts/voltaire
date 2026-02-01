import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { HexType } from "./HexType.js";
export type HexBrand = string & Brand.Brand<"Hex">;
export declare const HexBrand: Brand.Brand.Constructor<HexBrand>;
declare const HexSchema_base: Schema.Class<HexSchema, {
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}>, never, {
    readonly value: string;
}, {}, {}>;
export declare class HexSchema extends HexSchema_base {
    get hex(): HexType;
    get branded(): HexBrand;
    static fromBranded(brand: HexBrand): HexSchema;
    static from(value: string): HexSchema;
    static fromBytes(bytes: Uint8Array): HexSchema;
    toBytes(): Uint8Array;
    toString(): string;
    equals(other: HexSchema | HexType | string): boolean;
}
export declare const HexFromBytes: Schema.transform<typeof Schema.Uint8ArrayFromSelf, Schema.instanceOf<HexSchema>>;
export declare const HexFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<HexSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map