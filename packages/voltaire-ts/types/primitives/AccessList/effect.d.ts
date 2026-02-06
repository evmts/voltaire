import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedAccessList, Item } from "./AccessListType.js";
export type AccessListBrand = BrandedAccessList & Brand.Brand<"AccessList">;
export declare const AccessListBrand: Brand.Brand.Constructor<AccessListBrand>;
declare const AccessListSchema_base: Schema.Class<AccessListSchema, {
    value: Schema.Array$<Schema.Struct<{
        address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
        storageKeys: Schema.Array$<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    }>>;
}, Schema.Struct.Encoded<{
    value: Schema.Array$<Schema.Struct<{
        address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
        storageKeys: Schema.Array$<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    }>>;
}>, never, {
    readonly value: readonly {
        readonly address: Uint8Array<ArrayBufferLike>;
        readonly storageKeys: readonly Uint8Array<ArrayBufferLike>[];
    }[];
}, {}, {}>;
export declare class AccessListSchema extends AccessListSchema_base {
    get accessList(): BrandedAccessList;
    get branded(): AccessListBrand;
    static fromBranded(list: AccessListBrand): AccessListSchema;
    static from(value: readonly Item[] | Uint8Array): AccessListSchema;
    static fromBytes(bytes: Uint8Array): AccessListSchema;
    static create(): AccessListSchema;
    toBytes(): Uint8Array;
    gasCost(): bigint;
    gasSavings(): bigint;
    hasSavings(): boolean;
    includesAddress(address: Uint8Array): boolean;
    includesStorageKey(address: Uint8Array, storageKey: Uint8Array): boolean;
    keysFor(address: Uint8Array): readonly Uint8Array[] | undefined;
    deduplicate(): AccessListSchema;
    withAddress(address: Uint8Array): AccessListSchema;
    withStorageKey(address: Uint8Array, storageKey: Uint8Array): AccessListSchema;
    merge(...others: (AccessListSchema | BrandedAccessList)[]): AccessListSchema;
    assertValid(): void;
}
export {};
//# sourceMappingURL=effect.d.ts.map