/**
 * ContractSignature module for EIP-1271 smart contract signature verification.
 * Provides Effect-based operations for validating contract-based signatures.
 * @module
 * @since 0.0.1
 */
export { ERC1271_MAGIC_VALUE, ContractSignatureInputSchema, type ContractSignatureInput } from './ContractSignatureSchema.js'
export {
  isValidSignature,
  ContractSignatureError,
  ERC1271_MAGIC_VALUE as MAGIC_VALUE
} from './from.js'
