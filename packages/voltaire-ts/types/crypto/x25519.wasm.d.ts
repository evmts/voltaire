/**
 * WASM implementation of X25519 operations
 *
 * Provides Curve25519 Diffie-Hellman key exchange
 * using WebAssembly for performance.
 */
export declare namespace X25519Wasm {
    type SecretKey = Uint8Array;
    type PublicKey = Uint8Array;
    type SharedSecret = Uint8Array;
    const SECRET_KEY_SIZE = 32;
    const PUBLIC_KEY_SIZE = 32;
    const SHARED_SECRET_SIZE = 32;
    class X25519Error extends Error {
        readonly _tag: string;
        constructor(message: string);
    }
    class InvalidSecretKeyError extends X25519Error {
        readonly _tag: "InvalidSecretKeyError";
        constructor(message: string);
    }
    class InvalidPublicKeyError extends X25519Error {
        readonly _tag: "InvalidPublicKeyError";
        constructor(message: string);
    }
    function derivePublicKey(secretKey: SecretKey): PublicKey;
    function scalarmult(secretKey: SecretKey, publicKey: PublicKey): SharedSecret;
    function keypairFromSeed(seed: Uint8Array): {
        secretKey: SecretKey;
        publicKey: PublicKey;
    };
    function validateSecretKey(secretKey: SecretKey): boolean;
    function validatePublicKey(publicKey: PublicKey): boolean;
}
//# sourceMappingURL=x25519.wasm.d.ts.map