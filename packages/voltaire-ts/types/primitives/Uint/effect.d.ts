import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { Uint256Type } from "./Uint256Type.js";
export type UintBrand = bigint & Brand.Brand<"Uint256">;
export declare const UintBrand: Brand.Brand.Constructor<UintBrand>;
declare const UintSchema_base: Schema.Class<UintSchema, {
    value: Schema.refine<bigint, Schema.Schema<bigint, bigint, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<bigint, Schema.Schema<bigint, bigint, never>>;
}>, never, {
    readonly value: bigint;
}, {}, {}>;
export declare class UintSchema extends UintSchema_base {
    get uint(): Uint256Type;
    get branded(): UintBrand;
    static fromBranded(brand: UintBrand): UintSchema;
    static from(value: string | number | bigint): UintSchema;
    static fromHex(hex: string): UintSchema;
    static fromBytes(bytes: Uint8Array): UintSchema;
    static fromNumber(n: number): UintSchema;
    toHex(padded?: boolean): string;
    toBigInt(): bigint;
    toNumber(): number;
    toBytes(): Uint8Array;
    plus(other: UintSchema | Uint256Type): UintSchema;
    minus(other: UintSchema | Uint256Type): UintSchema;
    times(other: UintSchema | Uint256Type): UintSchema;
    dividedBy(other: UintSchema | Uint256Type): UintSchema;
    modulo(other: UintSchema | Uint256Type): UintSchema;
    toPower(exp: UintSchema | Uint256Type): UintSchema;
    equals(other: UintSchema | Uint256Type): boolean;
    bitLength(): number;
    leadingZeros(): number;
    popCount(): number;
}
export declare const UintFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Number, typeof Schema.BigIntFromSelf]>, Schema.instanceOf<UintSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map