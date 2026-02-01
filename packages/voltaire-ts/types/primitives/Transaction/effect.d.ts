import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
export type TransactionBrand = unknown & Brand.Brand<"Transaction">;
export declare const TransactionBrand: Brand.Brand.Constructor<Brand.Brand<"Transaction">>;
declare const TransactionSchema_base: Schema.Class<TransactionSchema, {
    value: Schema.refine<Record<string, unknown>, Schema.Schema<unknown, unknown, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Record<string, unknown>, Schema.Schema<unknown, unknown, never>>;
}>, never, {
    readonly value: Record<string, unknown>;
}, {}, {}>;
export declare class TransactionSchema extends TransactionSchema_base {
    get tx(): any;
    get branded(): TransactionBrand;
    static fromBranded(brand: TransactionBrand): TransactionSchema;
    static fromRpc(rpc: any): TransactionSchema;
    static deserialize(bytes: Uint8Array): TransactionSchema;
    toRpc(): any;
    serialize(): Uint8Array;
    hash(): Uint8Array;
    getSigningHash(): Uint8Array;
    getSender(): Uint8Array;
    verifySignature(): boolean;
    format(): string;
    getGasPrice(baseFee?: bigint): bigint;
    hasAccessList(): boolean;
    getAccessList(): any;
    getChainId(): bigint | null;
    isSigned(): boolean;
    static detectType(bytes: Uint8Array): number;
}
export {};
//# sourceMappingURL=effect.d.ts.map