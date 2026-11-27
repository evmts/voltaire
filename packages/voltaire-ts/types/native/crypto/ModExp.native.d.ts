/**
 * ModExp (EIP-198 / EIP-2565) synchronous native implementation using Zig C ABI.
 * Wires `modexp` and `modexpBytes` directly to `primitives_modexp`.
 */
import { calculateGas } from "../../crypto/ModExp/calculateGas.js";
/**
 * Modular exponentiation over EIP-198 big-endian byte arrays via native Zig FFI.
 * Output length matches `modBytes.length`.
 */
export declare function modexpBytes(baseBytes: Uint8Array, expBytes: Uint8Array, modBytes: Uint8Array): Uint8Array;
/**
 * Arbitrary-precision modular exponentiation `base^exp mod modulus` via native Zig FFI.
 */
export declare function modexp(base: bigint, exp: bigint, modulus: bigint): bigint;
export { calculateGas };
export declare const ModExp: typeof modexp & {
    modexp: typeof modexp;
    modexpBytes: typeof modexpBytes;
    calculateGas: typeof calculateGas;
};
//# sourceMappingURL=ModExp.native.d.ts.map