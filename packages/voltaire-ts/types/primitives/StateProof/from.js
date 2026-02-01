// @ts-nocheck
/**
 * @typedef {import('./StateProofType.js').StateProofType} StateProofType
 * @typedef {import('./StateProofType.js').StateProofLike} StateProofLike
 */
/**
 * Creates a StateProof from an object with all required fields.
 *
 * @param {StateProofLike} proof - Object containing all StateProof fields
 * @returns {StateProofType} - A validated StateProof
 *
 * @example
 * ```typescript
 * const proof = StateProof.from({
 *   address: Address.from("0x..."),
 *   accountProof: [node1, node2, node3],
 *   balance: Wei.from(1000000000000000000n),
 *   codeHash: Hash.from("0x..."),
 *   nonce: Nonce.from(5n),
 *   storageHash: StateRoot.from("0x..."),
 *   storageProof: [storageProof1, storageProof2],
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: state proof validation requires many field checks
export function from(proof) {
    if (!proof || typeof proof !== "object") {
        throw new TypeError("StateProof must be an object");
    }
    const { address, accountProof, balance, codeHash, nonce, storageHash, storageProof, } = proof;
    // Validate address
    if (!(address instanceof Uint8Array)) {
        throw new TypeError("StateProof.address must be an Address");
    }
    // Validate accountProof array
    if (!Array.isArray(accountProof)) {
        throw new TypeError("StateProof.accountProof must be an array");
    }
    for (let i = 0; i < accountProof.length; i++) {
        if (!(accountProof[i] instanceof Uint8Array)) {
            throw new TypeError(`StateProof.accountProof[${i}] must be a Uint8Array`);
        }
    }
    // Validate balance (Wei is a branded bigint)
    if (typeof balance !== "bigint") {
        throw new TypeError("StateProof.balance must be a Wei (bigint)");
    }
    // Validate codeHash
    if (!(codeHash instanceof Uint8Array)) {
        throw new TypeError("StateProof.codeHash must be a Hash");
    }
    if (codeHash.length !== 32) {
        throw new TypeError("StateProof.codeHash must be 32 bytes");
    }
    // Validate nonce (Nonce is a branded bigint)
    if (typeof nonce !== "bigint") {
        throw new TypeError("StateProof.nonce must be a Nonce (bigint)");
    }
    // Validate storageHash
    if (!(storageHash instanceof Uint8Array)) {
        throw new TypeError("StateProof.storageHash must be a StateRoot");
    }
    if (storageHash.length !== 32) {
        throw new TypeError("StateProof.storageHash must be 32 bytes");
    }
    // Validate storageProof array
    if (!Array.isArray(storageProof)) {
        throw new TypeError("StateProof.storageProof must be an array");
    }
    for (let i = 0; i < storageProof.length; i++) {
        if (!storageProof[i] || typeof storageProof[i] !== "object") {
            throw new TypeError(`StateProof.storageProof[${i}] must be a StorageProof`);
        }
        if (!storageProof[i].key ||
            !storageProof[i].value ||
            !storageProof[i].proof) {
            throw new TypeError(`StateProof.storageProof[${i}] must have key, value, and proof`);
        }
    }
    // Return immutable object
    return Object.freeze({
        address,
        accountProof: Object.freeze([...accountProof]),
        balance,
        codeHash,
        nonce,
        storageHash,
        storageProof: Object.freeze([...storageProof]),
    });
}
