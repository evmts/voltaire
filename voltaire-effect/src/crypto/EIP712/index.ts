/**
 * EIP-712 typed structured data module for Effect.
 * Provides standard Ethereum typed data signing and verification.
 * @module
 * @since 0.0.1
 */
export { EIP712Service, EIP712Live, EIP712Test, type EIP712ServiceShape } from './EIP712Service.js'
export { hashTypedData, signTypedData, verifyTypedData, recoverAddress, hashDomain, hashStruct } from './operations.js'
