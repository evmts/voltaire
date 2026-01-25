/**
 * ContractCode module for working with smart contract bytecode.
 * Provides Effect-based operations for creating and validating contract code.
 * @module
 * @since 0.0.1
 */
export { Schema } from './ContractCodeSchema.js'
export { from } from './from.js'

/**
 * Type representing compiled contract bytecode.
 * @since 0.0.1
 */
export type { ContractCodeType } from '@tevm/voltaire/ContractCode'
