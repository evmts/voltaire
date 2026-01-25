/**
 * Chain module for working with Ethereum chain configurations.
 * Provides Effect-based operations for validating and creating chain definitions.
 * @module
 * @since 0.0.1
 */
export {
  ChainSchema,
  ChainSchema as Schema,
  type ChainType,
  type ChainInput,
  type ChainMetadata,
  type Hardfork,
  type NativeCurrency,
  type Explorer
} from './ChainSchema.js'
export { from, InvalidChainError } from './from.js'
