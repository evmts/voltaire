import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { StorageKeyType } from "./StorageKeyType.js";
export type StorageKeyBrand = StorageKeyType & Brand.Brand<"StorageKey">;
export declare const StorageKeyBrand: Brand.Brand.Constructor<StorageKeyBrand>;
declare const StorageKeySchema_base: Schema.Class<StorageKeySchema, {
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    slot: typeof Schema.BigIntFromSelf;
}, Schema.Struct.Encoded<{
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    slot: typeof Schema.BigIntFromSelf;
}>, never, {
    readonly address: Uint8Array<ArrayBufferLike>;
} & {
    readonly slot: bigint;
}, {}, {}>;
export declare class StorageKeySchema extends StorageKeySchema_base {
    get key(): StorageKeyType;
    get branded(): StorageKeyBrand;
    static fromBranded(brand: StorageKeyBrand): StorageKeySchema;
    static from(value: StorageKeyType | {
        address: Uint8Array;
        slot: bigint;
    }): StorageKeySchema;
    toString(): string;
    equals(other: StorageKeySchema | StorageKeyType): boolean;
    hashCode(): number;
}
export {};
//# sourceMappingURL=effect.d.ts.map