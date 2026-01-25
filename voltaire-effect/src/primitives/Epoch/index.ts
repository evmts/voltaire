/**
 * Epoch module for working with beacon chain epochs.
 * Provides Effect-based operations for creating and converting epochs.
 * @module
 * @since 0.0.1
 */
export { EpochSchema, type EpochType } from './EpochSchema.js'
export {
  from,
  toNumber,
  toBigInt,
  equals,
  toSlot,
  EpochError
} from './from.js'
