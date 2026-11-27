/**
 * BN254 (alt_bn128) synchronous native implementation using Zig C ABI (EIP-196 / EIP-197).
 * Wires G1.add, G1.mul, Pairing.pairingCheck, and raw EIP-196/197 helpers directly
 * to `primitives_bn254_ecadd`, `primitives_bn254_ecmul`, and `primitives_bn254_ecpairing`.
 */
import { deserializeG1 } from "../../crypto/bn254/deserializeG1.js";
import { deserializeG2 } from "../../crypto/bn254/deserializeG2.js";
import * as Fp from "../../crypto/bn254/Fp/index.js";
import * as Fp2 from "../../crypto/bn254/Fp2/index.js";
import * as Fr from "../../crypto/bn254/Fr/index.js";
import * as G1JS from "../../crypto/bn254/G1/index.js";
import * as G2JS from "../../crypto/bn254/G2/index.js";
import * as PairingJS from "../../crypto/bn254/Pairing/index.js";
import { serializeG1 } from "../../crypto/bn254/serializeG1.js";
import { serializeG2 } from "../../crypto/bn254/serializeG2.js";
/**
 * Raw EIP-196 BN254 ECADD over big-endian byte input (up to 128 bytes) -> 64-byte G1 output.
 */
export declare function ecadd(input: Uint8Array): Uint8Array;
/**
 * Raw EIP-196 BN254 ECMUL over big-endian byte input (up to 96 bytes) -> 64-byte G1 output.
 */
export declare function ecmul(input: Uint8Array): Uint8Array;
/**
 * Raw EIP-197 BN254 ECPAIRING over `192 * k` bytes -> boolean pairing check result.
 */
export declare function ecpairing(input: Uint8Array): boolean;
export declare const G1: typeof G1JS;
export declare const G2: typeof G2JS;
export declare const Pairing: typeof PairingJS;
export { deserializeG1, deserializeG2, Fp, Fp2, Fr, serializeG1, serializeG2, };
export declare const BN254: {
    Fp: typeof Fp;
    Fp2: typeof Fp2;
    Fr: typeof Fr;
    G1: typeof G1JS;
    G2: typeof G2JS;
    Pairing: typeof PairingJS;
    serializeG1: typeof serializeG1;
    deserializeG1: typeof deserializeG1;
    serializeG2: typeof serializeG2;
    deserializeG2: typeof deserializeG2;
    ecadd: typeof ecadd;
    ecmul: typeof ecmul;
    ecpairing: typeof ecpairing;
};
export default BN254;
//# sourceMappingURL=BN254.native.d.ts.map