/**
 * Denomination module for working with Ethereum value denominations.
 * Provides Effect-based operations for converting between Wei, Gwei, and Ether.
 * @module
 * @since 0.0.1
 */
export { WeiSchema, type WeiType } from './WeiSchema.js'
export { GweiSchema, type GweiType } from './GweiSchema.js'
export { EtherSchema, type EtherType } from './EtherSchema.js'
export {
  fromWei,
  fromGwei,
  fromEther,
  weiToGwei,
  weiToEther,
  gweiToWei,
  gweiToEther,
  etherToWei,
  etherToGwei,
  DenominationError
} from './from.js'
