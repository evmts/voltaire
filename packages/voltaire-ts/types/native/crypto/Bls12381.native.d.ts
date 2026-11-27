/**
 * BLS12-381 synchronous native implementation using Zig / blst C ABI (EIP-2537).
 * Wires G1.add, G1.mul, G2.add, G2.mul, Pairing.pairingCheck, and raw EIP-2537
 * MSM / map-to-curve helpers directly to `primitives_bls12_381_*`.
 */
import { aggregate, aggregatePublicKeys } from "../../crypto/Bls12381/aggregate.js";
import { aggregateVerify, batchVerify, fastAggregateVerify } from "../../crypto/Bls12381/aggregateVerify.js";
import { derivePublicKey, derivePublicKeyPoint } from "../../crypto/Bls12381/derivePublicKey.js";
import * as Fp from "../../crypto/Bls12381/Fp/index.js";
import * as Fp2 from "../../crypto/Bls12381/Fp2/index.js";
import * as Fr from "../../crypto/Bls12381/Fr/index.js";
import * as G1JS from "../../crypto/Bls12381/G1/index.js";
import * as G2JS from "../../crypto/Bls12381/G2/index.js";
import * as PairingJS from "../../crypto/Bls12381/Pairing/index.js";
import { isValidPrivateKey, randomPrivateKey } from "../../crypto/Bls12381/randomPrivateKey.js";
import { sign, signPoint } from "../../crypto/Bls12381/sign.js";
import { verify, verifyPoint } from "../../crypto/Bls12381/verify.js";
/** Raw EIP-2537 BLS12_G1ADD (256-byte input -> 128-byte output). */
export declare function g1AddBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 single-pair BLS12_G1MUL (160-byte input -> 128-byte output). */
export declare function g1MulBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 BLS12_G1MSM (`160 * k` bytes -> 128-byte output). */
export declare function g1MsmBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 BLS12_G2ADD (512-byte input -> 256-byte output). */
export declare function g2AddBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 single-pair BLS12_G2MUL (288-byte input -> 256-byte output). */
export declare function g2MulBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 BLS12_G2MSM (`288 * k` bytes -> 256-byte output). */
export declare function g2MsmBytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 BLS12_PAIRING_CHECK (`384 * k` bytes -> boolean). */
export declare function pairingBytes(input: Uint8Array): boolean;
/** Raw EIP-2537 BLS12_MAP_FP_TO_G1 (64-byte Fp slot -> 128-byte G1 point). */
export declare function mapFpToG1Bytes(input: Uint8Array): Uint8Array;
/** Raw EIP-2537 BLS12_MAP_FP2_TO_G2 (128-byte Fp2 slots -> 256-byte G2 point). */
export declare function mapFp2ToG2Bytes(input: Uint8Array): Uint8Array;
export declare const G1: typeof G1JS;
export declare const G2: typeof G2JS;
export declare const Pairing: typeof PairingJS;
export { aggregate, aggregatePublicKeys, aggregateVerify, batchVerify, derivePublicKey, derivePublicKeyPoint, fastAggregateVerify, Fp, Fp2, Fr, isValidPrivateKey, randomPrivateKey, sign, signPoint, verify, verifyPoint, };
export declare const Bls12381: {
    sign: typeof sign;
    signPoint: typeof signPoint;
    verify: typeof verify;
    verifyPoint: typeof verifyPoint;
    aggregate: typeof aggregate;
    aggregatePublicKeys: typeof aggregatePublicKeys;
    aggregateVerify: typeof aggregateVerify;
    batchVerify: typeof batchVerify;
    fastAggregateVerify: typeof fastAggregateVerify;
    derivePublicKey: typeof derivePublicKey;
    derivePublicKeyPoint: typeof derivePublicKeyPoint;
    randomPrivateKey: typeof randomPrivateKey;
    isValidPrivateKey: typeof isValidPrivateKey;
    Fp: typeof Fp;
    Fp2: typeof Fp2;
    Fr: typeof Fr;
    G1: typeof G1JS;
    G2: typeof G2JS;
    Pairing: typeof PairingJS;
    g1AddBytes: typeof g1AddBytes;
    g1MulBytes: typeof g1MulBytes;
    g1MsmBytes: typeof g1MsmBytes;
    g2AddBytes: typeof g2AddBytes;
    g2MulBytes: typeof g2MulBytes;
    g2MsmBytes: typeof g2MsmBytes;
    pairingBytes: typeof pairingBytes;
    mapFpToG1Bytes: typeof mapFpToG1Bytes;
    mapFp2ToG2Bytes: typeof mapFp2ToG2Bytes;
};
export default Bls12381;
//# sourceMappingURL=Bls12381.native.d.ts.map