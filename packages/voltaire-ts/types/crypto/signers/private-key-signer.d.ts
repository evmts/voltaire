/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */
/**
 * Options for creating a private key signer.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export interface PrivateKeySignerOptions {
    /** Private key as hex string (with or without 0x prefix) or Uint8Array (32 bytes) */
    privateKey: string | Uint8Array;
}
/**
 * Interface for Ethereum signer that can sign messages, transactions, and typed data.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 */
export interface Signer {
    /** The checksummed Ethereum address */
    address: string;
    /** The uncompressed public key (64 bytes, without 0x04 prefix) */
    publicKey: Uint8Array;
    /** Sign a message with EIP-191 prefix */
    signMessage(message: string | Uint8Array): Promise<string>;
    /** Sign a transaction */
    signTransaction(transaction: any): Promise<any>;
    /** Sign typed data according to EIP-712 */
    signTypedData(typedData: any): Promise<string>;
}
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
export declare class PrivateKeySignerImpl implements Signer {
    readonly address: string;
    readonly publicKey: Uint8Array;
    private readonly signWithPrivateKey;
    private constructor();
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
    static fromPrivateKey(options: PrivateKeySignerOptions): PrivateKeySignerImpl;
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
    signMessage(message: string | Uint8Array): Promise<string>;
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
    signTransaction(transaction: any): Promise<any>;
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
    signTypedData(typedData: any): Promise<string>;
}
export default PrivateKeySignerImpl;
//# sourceMappingURL=private-key-signer.d.ts.map