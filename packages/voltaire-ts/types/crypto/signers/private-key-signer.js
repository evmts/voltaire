/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Address } from "../../primitives/Address/index.js";
import * as BrandedAddress from "../../primitives/Address/internal-index.js";
import * as primitives from "../../wasm-loader/loader.js";
import { Keccak256Wasm } from "../keccak256.wasm.js";
/**
 * WASM-based implementation of Ethereum private key signer.
 *
 * Uses Zig primitives via WASM for cryptographic operations. The private key is
 * securely stored in a closure and never exposed publicly.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @example
 * ```javascript
 * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
 *
 * // Create from hex string
 * const signer = PrivateKeySignerImpl.fromPrivateKey({
 *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
 * });
 *
 * // Sign a message
 * const signature = await signer.signMessage('Hello, Ethereum!');
 *
 * // Sign a transaction
 * const signedTx = await signer.signTransaction({
 *   to: '0x...',
 *   value: 1000000000000000000n,
 *   // ... other tx fields
 * });
 * ```
 */
export class PrivateKeySignerImpl {
    address;
    publicKey;
    signWithPrivateKey;
    constructor(privateKey) {
        // Private key only exists in this closure
        this.signWithPrivateKey = (hash) => {
            const sig = primitives.secp256k1Sign(hash, privateKey);
            // Return 65-byte signature: r[32] + s[32] + v[1]
            const result = new Uint8Array(65);
            result.set(sig.r, 0);
            result.set(sig.s, 32);
            result[64] = sig.v;
            return result;
        };
        // Derive public key from private key
        const pubKey = secp256k1.getPublicKey(privateKey, false);
        this.publicKey = pubKey.slice(1); // Remove 0x04 prefix for uncompressed
        // Derive address from public key (keccak256(pubkey)[12:])
        const pubkeyHash = Keccak256Wasm.hash(this.publicKey);
        const addressBytes = pubkeyHash.slice(-20);
        const addressObj = Address.fromBytes(addressBytes);
        this.address = BrandedAddress.toChecksummed(addressObj);
    }
    /**
     * Creates a private key signer from a hex string or Uint8Array.
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param {PrivateKeySignerOptions} options - Options containing the private key
     * @returns {PrivateKeySignerImpl} A new signer instance
     * @throws {Error} If private key is not 32 bytes or has invalid format
     * @example
     * ```javascript
     * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
     *
     * // From hex string with 0x prefix
     * const signer1 = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
     * });
     *
     * // From hex string without 0x prefix
     * const signer2 = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
     * });
     *
     * // From Uint8Array
     * const privateKeyBytes = new Uint8Array(32);
     * const signer3 = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: privateKeyBytes
     * });
     * ```
     */
    static fromPrivateKey(options) {
        let privateKeyBytes;
        if (typeof options.privateKey === "string") {
            const hex = options.privateKey.startsWith("0x")
                ? options.privateKey.slice(2)
                : options.privateKey;
            if (hex.length !== 64) {
                throw new Error("Private key must be 32 bytes (64 hex characters)");
            }
            privateKeyBytes = new Uint8Array(hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
        }
        else {
            privateKeyBytes = new Uint8Array(options.privateKey);
        }
        if (privateKeyBytes.length !== 32) {
            throw new Error("Private key must be 32 bytes");
        }
        return new PrivateKeySignerImpl(privateKeyBytes);
    }
    /**
     * Signs a message using EIP-191 personal sign format.
     *
     * Adds the Ethereum signed message prefix before hashing and signing.
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param {string | Uint8Array} message - The message to sign
     * @returns {Promise<string>} The signature as a hex string (0x + r + s + v, 65 bytes)
     * @throws {never}
     * @example
     * ```javascript
     * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
     *
     * const signer = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
     * });
     *
     * // Sign a string message
     * const sig1 = await signer.signMessage('Hello, Ethereum!');
     * console.log(sig1); // '0x...' (130 hex chars)
     *
     * // Sign a Uint8Array message
     * const msgBytes = new TextEncoder().encode('Hello');
     * const sig2 = await signer.signMessage(msgBytes);
     * ```
     */
    async signMessage(message) {
        // Hash message with EIP-191 prefix
        const msgBytes = typeof message === "string" ? new TextEncoder().encode(message) : message;
        const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${msgBytes.length}`);
        const combined = new Uint8Array(prefix.length + msgBytes.length);
        combined.set(prefix);
        combined.set(msgBytes, prefix.length);
        const messageHash = Keccak256Wasm.hash(combined);
        // Sign the hash
        const signature = this.signWithPrivateKey(messageHash);
        return `0x${Array.from(signature)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}`;
    }
    /**
     * Signs an Ethereum transaction.
     *
     * Supports all transaction types: Legacy (0), EIP-2930 (1), EIP-1559 (2), EIP-4844 (3), and EIP-7702 (4).
     * For legacy transactions, the v value includes the chain ID. For modern transactions, yParity is used.
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param {any} transaction - The transaction object to sign
     * @returns {Promise<any>} The signed transaction with signature fields (r, s, v/yParity)
     * @throws {never}
     * @example
     * ```javascript
     * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
     *
     * const signer = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
     * });
     *
     * // Sign an EIP-1559 transaction
     * const signedTx = await signer.signTransaction({
     *   type: 2,
     *   chainId: 1n,
     *   nonce: 0n,
     *   maxFeePerGas: 20000000000n,
     *   maxPriorityFeePerGas: 1000000000n,
     *   gas: 21000n,
     *   to: '0x...',
     *   value: 1000000000000000000n,
     *   data: '0x'
     * });
     * console.log(signedTx.yParity, signedTx.r, signedTx.s);
     * ```
     */
    // biome-ignore lint/suspicious/noExplicitAny: transaction type varies by chain
    async signTransaction(transaction) {
        const Transaction = await import("../../primitives/Transaction/index.js").then((m) => m);
        // Get signing hash
        const signingHash = Transaction.getSigningHash(transaction);
        // Sign the hash
        const signature = this.signWithPrivateKey(signingHash);
        // Parse signature (65 bytes: r[32] + s[32] + v[1])
        const r = signature.slice(0, 32);
        const s = signature.slice(32, 64);
        const v = signature[64] ?? 0;
        // Convert v from 0-1 to appropriate format based on tx type
        if (transaction.type === 0) {
            // Legacy: v includes chain ID
            const chainId = transaction.chainId ?? 0n;
            const vValue = BigInt(v) + 35n + chainId * 2n;
            return { ...transaction, v: vValue, r, s };
        }
        // EIP-2930, EIP-1559, EIP-4844, EIP-7702: use yParity
        const yParity = v;
        return { ...transaction, yParity, r, s };
    }
    /**
     * Signs typed structured data according to EIP-712.
     *
     * Hashes the typed data using the EIP-712 standard and signs the hash.
     *
     * @see https://voltaire.tevm.sh/crypto for crypto documentation
     * @since 0.0.0
     * @param {any} typedData - The EIP-712 typed data object
     * @returns {Promise<string>} The signature as a hex string (0x + r + s + v, 65 bytes)
     * @throws {never}
     * @example
     * ```javascript
     * import { PrivateKeySignerImpl } from './crypto/signers/private-key-signer.js';
     *
     * const signer = PrivateKeySignerImpl.fromPrivateKey({
     *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
     * });
     *
     * const typedData = {
     *   types: {
     *     EIP712Domain: [
     *       { name: 'name', type: 'string' },
     *       { name: 'version', type: 'string' }
     *     ],
     *     Message: [{ name: 'content', type: 'string' }]
     *   },
     *   primaryType: 'Message',
     *   domain: { name: 'MyApp', version: '1' },
     *   message: { content: 'Hello' }
     * };
     *
     * const signature = await signer.signTypedData(typedData);
     * console.log(signature); // '0x...'
     * ```
     */
    // biome-ignore lint/suspicious/noExplicitAny: EIP-712 typed data structure varies
    async signTypedData(typedData) {
        const { Eip712Wasm } = await import("../eip712.wasm.js");
        // Hash typed data according to EIP-712
        const hash = Eip712Wasm.hashTypedData(typedData);
        // Sign the hash
        const signature = this.signWithPrivateKey(hash);
        // Return as hex string (0x + r + s + v)
        return `0x${Array.from(signature)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}`;
    }
}
export default PrivateKeySignerImpl;
