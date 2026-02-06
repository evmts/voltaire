import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedBytecode } from "./BytecodeType.js";
export type BytecodeBrand = Uint8Array & Brand.Brand<"Bytecode">;
export declare const BytecodeBrand: Brand.Brand.Constructor<BytecodeBrand>;
declare const BytecodeSchema_base: Schema.Class<BytecodeSchema, {
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly value: Uint8Array<ArrayBufferLike>;
}, {}, {}>;
export declare class BytecodeSchema extends BytecodeSchema_base {
    get bytecode(): BrandedBytecode;
    get branded(): BytecodeBrand;
    static fromBranded(brand: BytecodeBrand): BytecodeSchema;
    static from(value: string | Uint8Array): BytecodeSchema;
    static fromHex(hex: string): BytecodeSchema;
    toHex(prefix?: boolean): string;
    equals(other: BytecodeSchema | BrandedBytecode): boolean;
    size(): number;
}
export declare const BytecodeFromUnknown: Schema.transform<Schema.Union<[typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<BytecodeSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map