import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { from as _from } from "./from.js";
import type { SignatureAlgorithm, SignatureType } from "./SignatureType.js";
export type SignatureBrand = Uint8Array & Brand.Brand<"Signature">;
export declare const SignatureBrand: Brand.Brand.Constructor<SignatureBrand>;
declare const SignatureSchema_base: Schema.Class<SignatureSchema, {
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly value: Uint8Array<ArrayBufferLike>;
}, {}, {}>;
export declare class SignatureSchema extends SignatureSchema_base {
    get signature(): SignatureType;
    get branded(): SignatureBrand;
    static fromBranded(brand: SignatureBrand): SignatureSchema;
    static from(value: Parameters<typeof _from>[0]): SignatureSchema;
    static fromHex(hex: string): SignatureSchema;
    static fromBytes(bytes: Uint8Array): SignatureSchema;
    toBytes(): Uint8Array;
    toHex(): string;
    equals(other: SignatureSchema | SignatureType): boolean;
    getR(): Uint8Array;
    getS(): Uint8Array;
    getV(): number | undefined;
    getAlgorithm(): SignatureAlgorithm;
}
export declare const SignatureFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<SignatureSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map