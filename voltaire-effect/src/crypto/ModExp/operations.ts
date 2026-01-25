/**
 * @fileoverview Modular exponentiation operations for Effect.
 * @module ModExp/operations
 * @since 0.0.1
 */
import * as Effect from "effect/Effect";
import { ModExpService } from "./ModExpService.js";

/**
 * Computes base^exp mod modulus for arbitrary-precision integers.
 *
 * @description
 * Performs modular exponentiation using the square-and-multiply algorithm.
 * This is the core operation for RSA, DH, and other public-key cryptography.
 *
 * @param base - Base value as BigInt
 * @param exp - Exponent value as BigInt (must be >= 0)
 * @param modulus - Modulus value as BigInt (must be > 0)
 * @returns Effect containing the result as BigInt, requiring ModExpService
 *
 * @example
 * ```typescript
 * import { modexp, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = modexp(2n, 10n, 1000n).pipe(Effect.provide(ModExpLive))
 * // Returns: 24n (2^10 = 1024, 1024 mod 1000 = 24)
 * ```
 *
 * @throws Never fails if inputs are valid
 * @see {@link modexpBytes} for byte array interface
 * @since 0.0.1
 */
export const modexp = (
	base: bigint,
	exp: bigint,
	modulus: bigint,
): Effect.Effect<bigint, never, ModExpService> =>
	Effect.gen(function* () {
		const service = yield* ModExpService;
		return yield* service.modexp(base, exp, modulus);
	});

/**
 * Computes base^exp mod modulus with byte array inputs/outputs.
 *
 * @description
 * EVM-compatible modular exponentiation using big-endian byte arrays.
 * Output is zero-padded to match modulus length per EIP-198 specification.
 *
 * @param baseBytes - Base as big-endian byte array
 * @param expBytes - Exponent as big-endian byte array
 * @param modBytes - Modulus as big-endian byte array
 * @returns Effect containing result as big-endian bytes (padded to modulus length), requiring ModExpService
 *
 * @example
 * ```typescript
 * import { modexpBytes, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * // Compute 2^10 mod 1000 = 24 (0x0018)
 * const program = modexpBytes(
 *   new Uint8Array([0x02]),       // base = 2
 *   new Uint8Array([0x0a]),       // exp = 10
 *   new Uint8Array([0x03, 0xe8])  // modulus = 1000
 * ).pipe(Effect.provide(ModExpLive))
 * // Returns: Uint8Array([0x00, 0x18]) (24 padded to 2 bytes)
 * ```
 *
 * @throws Never fails if inputs are valid
 * @see {@link modexp} for BigInt interface
 * @since 0.0.1
 */
export const modexpBytes = (
	baseBytes: Uint8Array,
	expBytes: Uint8Array,
	modBytes: Uint8Array,
): Effect.Effect<Uint8Array, never, ModExpService> =>
	Effect.gen(function* () {
		const service = yield* ModExpService;
		return yield* service.modexpBytes(baseBytes, expBytes, modBytes);
	});

/**
 * Calculate gas cost for MODEXP operation per EIP-2565.
 *
 * @description
 * Computes the gas cost for the MODEXP precompile (address 0x05) according
 * to EIP-2565 pricing formula. Used by EVM implementations for gas metering.
 *
 * Formula: max(200, floor(mult_complexity * iterations / 3))
 * where mult_complexity = max(modLen, baseLen)^2
 *
 * @param baseLen - Length of base in bytes
 * @param expLen - Length of exponent in bytes
 * @param modLen - Length of modulus in bytes
 * @param expHead - First 32 bytes of exponent as BigInt (for iteration count)
 * @returns Effect containing gas cost as BigInt, requiring ModExpService
 *
 * @example
 * ```typescript
 * import { calculateGas, ModExpLive } from 'voltaire-effect/crypto/ModExp'
 * import * as Effect from 'effect/Effect'
 *
 * const program = calculateGas(1n, 1n, 2n, 10n).pipe(Effect.provide(ModExpLive))
 * // Returns gas cost based on EIP-2565 formula
 * ```
 *
 * @throws Never fails
 * @see {@link https://eips.ethereum.org/EIPS/eip-2565 | EIP-2565}
 * @since 0.0.1
 */
export const calculateGas = (
	baseLen: bigint,
	expLen: bigint,
	modLen: bigint,
	expHead: bigint,
): Effect.Effect<bigint, never, ModExpService> =>
	Effect.gen(function* () {
		const service = yield* ModExpService;
		return yield* service.calculateGas(baseLen, expLen, modLen, expHead);
	});
