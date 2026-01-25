/**
 * DomainSeparator module for EIP-712 domain separator hashes.
 * Provides Effect-based operations for creating and comparing domain separators.
 * @module
 * @since 0.0.1
 */
export { DomainSeparatorSchema, DomainSeparatorFromBytesSchema, type DomainSeparatorType } from './DomainSeparatorSchema.js'
export {
  from,
  fromBytes,
  fromHex,
  toHex,
  equals,
  DomainSeparatorError
} from './from.js'
