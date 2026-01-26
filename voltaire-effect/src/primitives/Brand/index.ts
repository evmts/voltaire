/**
 * @module Brand
 * @description Effect Brand utilities for Ethereum primitive types.
 *
 * ## Why NOT use effect/Brand for existing primitives
 *
 * Voltaire primitives (Address, Hash, Hex, etc.) use **Uint8Array-based branded types**
 * defined in @tevm/voltaire. These types use a custom brand symbol for performance:
 *
 * ```typescript
 * // From @tevm/voltaire - AddressType is a branded Uint8Array
 * type AddressType = Uint8Array & { readonly [brand]: "Address" }
 * ```
 *
 * Effect's Brand module is designed for **primitive types** (string, number) and
 * works by intersecting with `Brand.Brand<"Tag">`. This creates a conflict:
 *
 * 1. **Schema integration**: effect/Schema already provides `.brand()` and
 *    `Schema.fromBrand()` which work seamlessly with Schema validation pipelines.
 *    Using standalone Brand constructors would bypass Schema's parse/encode flow.
 *
 * 2. **Existing constructors**: @tevm/voltaire already exports constructors like
 *    `Address()`, `Hash()` that do proper validation and return branded types.
 *    Adding effect/Brand constructors would duplicate this functionality.
 *
 * 3. **Uint8Array base**: Effect Brand expects the base type to match exactly.
 *    Uint8Array-based brands require additional handling that Schema provides.
 *
 * ## Current approach (RECOMMENDED)
 *
 * Use Schema-based validation with the existing branded types:
 *
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * // Decode hex string to AddressType (branded Uint8Array)
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *
 * // The result is already a branded AddressType
 * type Check = typeof addr // AddressType
 * ```
 *
 * ## When effect/Brand IS useful
 *
 * For NEW types that are based on primitives (string, number, bigint), effect/Brand
 * can be useful. Examples below show how to create new branded types.
 *
 * @since 0.1.0
 */

import * as Brand from "effect/Brand";

// ============================================================================
// Example: Creating NEW branded types with effect/Brand
// ============================================================================

/**
 * A branded positive integer type.
 * Use for values that must always be > 0.
 *
 * @example
 * ```typescript
 * import { PositiveInt } from 'voltaire-effect/primitives/Brand'
 *
 * const gasLimit = PositiveInt(21000) // ok
 * const invalid = PositiveInt(-1)     // throws
 * ```
 */
export type PositiveInt = number & Brand.Brand<"PositiveInt">;

/**
 * Constructor for PositiveInt.
 * Throws if the value is not a positive integer.
 */
export const PositiveInt = Brand.refined<PositiveInt>(
	(n): n is Brand.Brand.Unbranded<PositiveInt> =>
		Number.isInteger(n) && n > 0,
	(n) => Brand.error(`Expected ${n} to be a positive integer`),
);

/**
 * A branded non-negative integer type.
 * Use for values that must be >= 0 (like array indices, gas values).
 *
 * @example
 * ```typescript
 * import { NonNegativeInt } from 'voltaire-effect/primitives/Brand'
 *
 * const index = NonNegativeInt(0)   // ok
 * const invalid = NonNegativeInt(-1) // throws
 * ```
 */
export type NonNegativeInt = number & Brand.Brand<"NonNegativeInt">;

/**
 * Constructor for NonNegativeInt.
 * Throws if the value is not a non-negative integer.
 */
export const NonNegativeInt = Brand.refined<NonNegativeInt>(
	(n): n is Brand.Brand.Unbranded<NonNegativeInt> =>
		Number.isInteger(n) && n >= 0,
	(n) => Brand.error(`Expected ${n} to be a non-negative integer`),
);

/**
 * A branded Wei value (bigint).
 * Represents Ethereum's smallest unit of ether.
 *
 * @example
 * ```typescript
 * import { Wei } from 'voltaire-effect/primitives/Brand'
 *
 * const amount = Wei(1000000000000000000n) // 1 ether in wei
 * const invalid = Wei(-1n)                  // throws (negative wei)
 * ```
 */
export type Wei = bigint & Brand.Brand<"Wei">;

/**
 * Constructor for Wei.
 * Throws if the value is negative.
 */
export const Wei = Brand.refined<Wei>(
	(n): n is Brand.Brand.Unbranded<Wei> => n >= 0n,
	(n) => Brand.error(`Expected ${n} to be a non-negative Wei value`),
);

/**
 * A branded Gwei value (bigint).
 * Represents 10^9 wei, commonly used for gas prices.
 *
 * @example
 * ```typescript
 * import { Gwei } from 'voltaire-effect/primitives/Brand'
 *
 * const gasPrice = Gwei(20n) // 20 gwei
 * ```
 */
export type Gwei = bigint & Brand.Brand<"Gwei">;

/**
 * Constructor for Gwei.
 * Throws if the value is negative.
 */
export const Gwei = Brand.refined<Gwei>(
	(n): n is Brand.Brand.Unbranded<Gwei> => n >= 0n,
	(n) => Brand.error(`Expected ${n} to be a non-negative Gwei value`),
);

/**
 * A branded block number type.
 * Always a non-negative bigint.
 *
 * @example
 * ```typescript
 * import { BlockNumber } from 'voltaire-effect/primitives/Brand'
 *
 * const block = BlockNumber(19000000n)
 * ```
 */
export type BlockNumber = bigint & Brand.Brand<"BlockNumber">;

/**
 * Constructor for BlockNumber.
 */
export const BlockNumber = Brand.refined<BlockNumber>(
	(n): n is Brand.Brand.Unbranded<BlockNumber> => n >= 0n,
	(n) => Brand.error(`Expected ${n} to be a valid block number`),
);

/**
 * A branded chain ID type.
 * Must be a positive bigint.
 *
 * @example
 * ```typescript
 * import { ChainId } from 'voltaire-effect/primitives/Brand'
 *
 * const mainnet = ChainId(1n)
 * const sepolia = ChainId(11155111n)
 * ```
 */
export type ChainId = bigint & Brand.Brand<"ChainId">;

/**
 * Constructor for ChainId.
 */
export const ChainId = Brand.refined<ChainId>(
	(n): n is Brand.Brand.Unbranded<ChainId> => n > 0n,
	(n) => Brand.error(`Expected ${n} to be a valid chain ID (positive)`),
);

/**
 * A branded nonce type.
 * Transaction nonce, always a non-negative bigint.
 *
 * @example
 * ```typescript
 * import { Nonce } from 'voltaire-effect/primitives/Brand'
 *
 * const nonce = Nonce(42n)
 * ```
 */
export type Nonce = bigint & Brand.Brand<"Nonce">;

/**
 * Constructor for Nonce.
 */
export const Nonce = Brand.refined<Nonce>(
	(n): n is Brand.Brand.Unbranded<Nonce> => n >= 0n,
	(n) => Brand.error(`Expected ${n} to be a valid nonce (non-negative)`),
);

// ============================================================================
// Nominal types (no runtime validation, just type distinction)
// ============================================================================

/**
 * A nominal type for transaction hashes.
 * Use when you already have a validated hex string and want type safety.
 *
 * @example
 * ```typescript
 * import { TxHashString } from 'voltaire-effect/primitives/Brand'
 *
 * // No validation, just type branding
 * const hash = TxHashString('0x...')
 * ```
 */
export type TxHashString = string & Brand.Brand<"TxHashString">;

/**
 * Nominal constructor for TxHashString.
 * Does NOT validate - use for already-validated values.
 */
export const TxHashString = Brand.nominal<TxHashString>();

/**
 * A nominal type for address strings.
 * Use when you already have a validated address and want type safety.
 *
 * @example
 * ```typescript
 * import { AddressString } from 'voltaire-effect/primitives/Brand'
 *
 * // No validation, just type branding
 * const addr = AddressString('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * ```
 */
export type AddressString = string & Brand.Brand<"AddressString">;

/**
 * Nominal constructor for AddressString.
 * Does NOT validate - use for already-validated values.
 */
export const AddressString = Brand.nominal<AddressString>();

// ============================================================================
// Combining brands
// ============================================================================

/**
 * A value that is both positive and represents gas.
 *
 * @example
 * ```typescript
 * import { Gas } from 'voltaire-effect/primitives/Brand'
 *
 * const gas = Gas(21000n) // must be positive
 * ```
 */
export type Gas = bigint & Brand.Brand<"Gas">;

/**
 * Constructor for Gas values.
 */
export const Gas = Brand.refined<Gas>(
	(n): n is Brand.Brand.Unbranded<Gas> => n > 0n,
	(n) => Brand.error(`Expected ${n} to be a valid gas value (positive)`),
);

// ============================================================================
// Re-export Brand utilities for advanced usage
// ============================================================================

export {
	/**
	 * Create refined branded types with validation.
	 * @see https://effect.website/docs/code-style/branded-types/
	 */
	Brand,
};
