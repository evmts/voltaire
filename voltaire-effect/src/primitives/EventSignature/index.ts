/**
 * EventSignature module for working with EVM event topics.
 * Provides Effect-based operations for creating and comparing event signatures.
 * @module
 * @since 0.0.1
 */
export { EventSignatureSchema, type EventSignatureType, type EventSignatureLike } from './EventSignatureSchema.js'
export {
  from,
  fromHex,
  fromSignature,
  toHex,
  equals,
  EventSignatureError
} from './from.js'
