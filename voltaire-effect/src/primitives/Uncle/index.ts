/**
 * Uncle module for representing uncle (ommer) blocks.
 * 
 * Uncles are valid blocks that were not included in the canonical chain
 * but are referenced to incentivize mining on competitive forks.
 * 
 * @module Uncle
 * @since 0.0.1
 */
export { Schema, type UncleType } from './UncleSchema.js'
export { from, UncleError } from './from.js'
