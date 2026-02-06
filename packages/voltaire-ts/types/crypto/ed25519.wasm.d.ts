/**
 * Ed25519 operations implementation
 *
 * Uses @noble/curves Ed25519 implementation since WASM exports
 * are not yet available in Zig 0.15.1 (API changed).
 */
export declare namespace Ed25519Wasm {
    type Signature = Uint8Array;
    type PublicKey = Uint8Array;
    type SecretKey = Uint8Array;
    type Seed = Uint8Array;
    const SECRET_KEY_SIZE = 64;
    const PUBLIC_KEY_SIZE = 32;
    const SIGNATURE_SIZE = 64;
    const SEED_SIZE = 32;
    class Ed25519Error extends Error {
        readonly _tag: string;
        constructor(message: string);
    }
    class InvalidSignatureError extends Ed25519Error {
        readonly _tag: "InvalidSignatureError";
        constructor(message: string);
    }
    class InvalidPublicKeyError extends Ed25519Error {
        readonly _tag: "InvalidPublicKeyError";
        constructor(message: string);
    }
    class InvalidSecretKeyError extends Ed25519Error {
        readonly _tag: "InvalidSecretKeyError";
        constructor(message: string);
    }
    class InvalidSeedError extends Ed25519Error {
        readonly _tag: "InvalidSeedError";
        constructor(message: string);
    }
    function keypairFromSeed(seed: Seed): {
        secretKey: SecretKey;
        publicKey: PublicKey;
    };
    function sign(message: Uint8Array, secretKey: SecretKey): Signature;
    function verify(signature: Signature, message: Uint8Array, publicKey: PublicKey): boolean;
    function derivePublicKey(secretKey: SecretKey): PublicKey;
    function validateSecretKey(secretKey: SecretKey): boolean;
    function validatePublicKey(publicKey: PublicKey): boolean;
    function validateSeed(seed: Seed): boolean;
}
//# sourceMappingURL=ed25519.wasm.d.ts.map