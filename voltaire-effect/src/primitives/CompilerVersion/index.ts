/**
 * CompilerVersion module for working with Solidity compiler versions.
 * Provides Effect-based operations for parsing, comparing, and validating versions.
 * @module
 * @since 0.0.1
 */
export { CompilerVersionSchema, type CompilerVersionType } from './CompilerVersionSchema.js'
export {
  from,
  parse,
  compare,
  getMajor,
  getMinor,
  getPatch,
  isCompatible,
  CompilerVersionError
} from './from.js'
