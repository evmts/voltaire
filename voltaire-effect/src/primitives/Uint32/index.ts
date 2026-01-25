/**
 * Uint32 module for 32-bit unsigned integers (0-4294967295).
 * 
 * Provides arithmetic operations with overflow/underflow checking.
 * 
 * @module Uint32
 * @since 0.0.1
 */
export { Schema, type Uint32Type } from './Uint32Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint32Error, MAX, MIN, ZERO, ONE } from './from.js'
