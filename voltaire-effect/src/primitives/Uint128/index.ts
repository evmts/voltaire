/**
 * Uint128 module for 128-bit unsigned integers (0 to 2^128-1).
 * 
 * Provides arithmetic operations with overflow/underflow checking.
 * 
 * @module Uint128
 * @since 0.0.1
 */
export { Schema, type Uint128Type } from './Uint128Schema.js'
export { from, plus, minus, times, toBigInt, toNumber, toHex, equals, Uint128Error, MAX, MIN, ZERO, ONE } from './from.js'
