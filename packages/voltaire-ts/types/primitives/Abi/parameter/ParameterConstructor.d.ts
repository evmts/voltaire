import type { AbiType } from "../Type.js";
import type { decode } from "./decode.js";
import type { encode } from "./encode.js";
import type { from } from "./from.js";
import type { ParameterType } from "./ParameterType.js";
type ParameterPrototype<TType extends AbiType = AbiType, TName extends string = string, TInternalType extends string = string> = ParameterType<TType, TName, TInternalType> & {
    encode(this: ParameterType, value: unknown): ReturnType<typeof encode>;
    decode(this: ParameterType, data: Uint8Array): ReturnType<typeof decode>;
};
export interface ParameterConstructor {
    <TType extends AbiType = AbiType, TName extends string = string, TInternalType extends string = string>(param: ParameterType<TType, TName, TInternalType> | {
        type: TType;
        name?: TName;
        internalType?: TInternalType;
        indexed?: boolean;
        components?: readonly any[];
    }): ParameterPrototype<TType, TName, TInternalType>;
    prototype: ParameterPrototype;
    from: typeof from;
    encode: typeof encode;
    decode: typeof decode;
}
export {};
//# sourceMappingURL=ParameterConstructor.d.ts.map