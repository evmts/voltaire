/**
 * Local abitype configuration with Uint8Array for bytes types
 *
 * This file provides scoped abitype configuration that uses Uint8Array for bytes
 * instead of `0x${string}`. This declaration merging is scoped to this module and
 * does not affect downstream users who import abitype directly.
 *
 * @internal
 */
declare module "abitype" {
    interface Register {
        bytesType: {
            inputs: Uint8Array;
            outputs: Uint8Array;
        };
        intType: bigint;
    }
}
export type { AbiParametersToPrimitiveTypes as AbiParametersToPrimitiveTypesWithUint8Array, AbiParameterToPrimitiveType as AbiParameterToPrimitiveTypeWithUint8Array, } from "abitype";
//# sourceMappingURL=abitype-uint8array.d.ts.map