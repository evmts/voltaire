import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedAuthorization } from "./BrandedAuthorization.d.js";
export type AuthorizationBrand = BrandedAuthorization & Brand.Brand<"Authorization">;
export declare const AuthorizationBrand: Brand.Brand.Constructor<AuthorizationBrand>;
declare const AuthorizationSchema_base: Schema.Class<AuthorizationSchema, {
    chainId: typeof Schema.BigIntFromSelf;
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    nonce: typeof Schema.BigIntFromSelf;
    yParity: Schema.refine<number, Schema.Schema<number, number, never>>;
    r: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    s: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    chainId: typeof Schema.BigIntFromSelf;
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    nonce: typeof Schema.BigIntFromSelf;
    yParity: Schema.refine<number, Schema.Schema<number, number, never>>;
    r: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    s: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly chainId: bigint;
} & {
    readonly address: Uint8Array<ArrayBufferLike>;
} & {
    readonly nonce: bigint;
} & {
    readonly r: Uint8Array<ArrayBufferLike>;
} & {
    readonly s: Uint8Array<ArrayBufferLike>;
} & {
    readonly yParity: number;
}, {}, {}>;
export declare class AuthorizationSchema extends AuthorizationSchema_base {
    get authorization(): BrandedAuthorization;
    get branded(): AuthorizationBrand;
    static fromBranded(brand: AuthorizationBrand): AuthorizationSchema;
    static from(value: {
        chainId: bigint;
        address: Uint8Array;
        nonce: bigint;
        yParity: number;
        r: Uint8Array;
        s: Uint8Array;
    }): AuthorizationSchema;
    getSigningHash(): Uint8Array;
    verifySignature(): boolean;
    getAuthorizer(): Uint8Array;
}
export {};
//# sourceMappingURL=effect.d.ts.map