/**
 * ChainId module for working with Ethereum network identifiers.
 * Provides Effect-based operations for creating and validating chain IDs.
 * @module
 * @since 0.0.1
 */
export { ChainIdSchema, ChainIdSchema as Schema, type ChainIdType } from './ChainIdSchema.js'
export { from, InvalidChainIdError } from './from.js'
