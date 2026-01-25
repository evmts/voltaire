/**
 * Uint16 module for 16-bit unsigned integers (0-65535).
 * 
 * Provides arithmetic operations with overflow/underflow checking.
 * 
 * @module Uint16
 * @since 0.0.1
 */
export { Schema, type Uint16Type } from './Uint16Schema.js'
export { from, plus, minus, times, toNumber, toHex, equals, Uint16Error, MAX, MIN, ZERO, ONE } from './from.js'
