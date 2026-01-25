/**
 * EncodedData module for working with ABI-encoded data.
 * Provides Effect-based operations for creating and converting encoded data.
 * @module
 * @since 0.0.1
 */
export { EncodedDataSchema, EncodedDataFromBytesSchema, type EncodedDataType } from './EncodedDataSchema.js'
export {
  from,
  fromBytes,
  toBytes,
  equals,
  EncodedDataError
} from './from.js'
