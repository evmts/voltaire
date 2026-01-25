/**
 * ErrorSignature module for working with Solidity error selectors.
 * Provides Effect-based operations for creating and comparing error signatures.
 * @module
 * @since 0.0.1
 */
export { ErrorSignatureSchema, type ErrorSignatureType, type ErrorSignatureLike } from './ErrorSignatureSchema.js'
export {
  from,
  fromHex,
  fromSignature,
  toHex,
  equals,
  ErrorSignatureError
} from './from.js'
