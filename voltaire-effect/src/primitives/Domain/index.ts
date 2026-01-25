/**
 * Domain module for EIP-712 typed data domains.
 * Provides Effect-based operations for creating and hashing domains.
 * @module
 * @since 0.0.1
 */
export { DomainSchema, type DomainType, type DomainInput } from './DomainSchema.js'
export {
  from,
  toHash,
  encodeType,
  hashType,
  getEIP712DomainType,
  getFieldsBitmap,
  toErc5267Response,
  DomainError
} from './from.js'
