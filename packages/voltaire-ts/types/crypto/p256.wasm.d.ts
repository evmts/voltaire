/**
 * WASM implementation of P256 (secp256r1) operations
 *
 * Provides cryptographic operations for NIST P-256 curve
 * using WebAssembly for performance.
 */
import type { HashType } from "../primitives/Hash/HashType.js";
export declare namespace P256Wasm {
    type Signature = {
        r: Uint8Array;
        s: Uint8Array;
    };
    type PublicKey = Uint8Array;
    type PrivateKey = Uint8Array;
    const CURVE_ORDER = 115792089210356248762697446949407573529996955224135760342422259061068512044369n;
    const PRIVATE_KEY_SIZE = 32;
    const PUBLIC_KEY_SIZE = 64;
    const SIGNATURE_COMPONENT_SIZE = 32;
    const SHARED_SECRET_SIZE = 32;
    class P256Error extends Error {
        readonly _tag: string;
        constructor(message: string);
    }
    class InvalidSignatureError extends P256Error {
        readonly _tag: "InvalidSignatureError";
        constructor(message: string);
    }
    class InvalidPublicKeyError extends P256Error {
        readonly _tag: "InvalidPublicKeyError";
        constructor(message: string);
    }
    class InvalidPrivateKeyError extends P256Error {
        readonly _tag: "InvalidPrivateKeyError";
        constructor(message: string);
    }
    function sign(messageHash: HashType, privateKey: PrivateKey): Signature;
    function verify(signature: Signature, messageHash: HashType, publicKey: PublicKey): boolean;
    function derivePublicKey(privateKey: PrivateKey): PublicKey;
    function ecdh(privateKey: PrivateKey, publicKey: PublicKey): Uint8Array;
    function validatePrivateKey(privateKey: PrivateKey): boolean;
    function validatePublicKey(publicKey: PublicKey): boolean;
}
//# sourceMappingURL=p256.wasm.d.ts.map