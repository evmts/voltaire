/**
 * Shared API interface that all entrypoints (JS, WASM, Native) must satisfy.
 * This ensures compile-time errors if any entrypoint's API doesn't match.
 *
 * The JS entrypoint (src/index.ts) is the source of truth.
 * WASM (src/wasm/index.ts) and Native (src/native/index.ts) must match this interface.
 */
/**
 * Type guard to check if an object satisfies VoltaireAPI
 */
export function isVoltaireAPI(obj) {
    if (typeof obj !== "object" || obj === null)
        return false;
    const api = obj;
    // Check required primitives
    const requiredPrimitives = [
        "Address",
        "Hash",
        "Hex",
        "Uint",
        "Rlp",
        "Abi",
        "Blob",
        "AccessList",
        "Bytecode",
        "Chain",
    ];
    // Check required crypto
    const requiredCrypto = [
        "Keccak256",
        "SHA256",
        "Blake2",
        "Ripemd160",
        "Secp256k1",
        "Ed25519",
        "P256",
        "X25519",
        "BN254",
        "Bls12381",
        "KZG",
        "EIP712",
        "ModExp",
    ];
    for (const key of [...requiredPrimitives, ...requiredCrypto]) {
        if (!(key in api))
            return false;
    }
    return true;
}
