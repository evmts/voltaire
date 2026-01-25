/**
 * EntryPoint module for ERC-4337 account abstraction.
 * Provides Effect-based operations for working with EntryPoint contract addresses.
 * @module
 * @since 0.0.1
 */
export { EntryPointSchema, type EntryPointType, ENTRYPOINT_V06, ENTRYPOINT_V07 } from './EntryPointSchema.js'
export {
  from,
  toHex,
  equals,
  EntryPointError,
  ENTRYPOINT_V06 as V06,
  ENTRYPOINT_V07 as V07
} from './from.js'
