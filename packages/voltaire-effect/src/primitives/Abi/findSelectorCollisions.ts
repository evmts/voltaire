/**
 * @fileoverview Finds function selector collisions in an ABI.
 * Provides Effect-based wrapper for collision detection.
 *
 * @module Abi/findSelectorCollisions
 * @since 0.0.1
 */

import {
	type ItemType,
	findSelectorCollisions as _findSelectorCollisions,
	hasSelectorCollisions as _hasSelectorCollisions,
} from "@tevm/voltaire/Abi";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

type AbiInput = readonly ItemType[];

/**
 * Selector collision information.
 */
export interface SelectorCollision {
	selector: HexType;
	functions: readonly ItemType[];
}

/**
 * Finds function selector collisions in an ABI.
 *
 * @description
 * Detects when multiple functions in an ABI share the same 4-byte selector.
 * This can happen due to the birthday paradox with 4-byte hashes.
 *
 * @param {AbiInput} abi - The contract ABI to check.
 * @returns {Effect.Effect<readonly SelectorCollision[], never>}
 *   Effect yielding array of collisions (empty if none).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { findSelectorCollisions } from 'voltaire-effect/primitives/Abi'
 *
 * const collisions = await Effect.runPromise(
 *   findSelectorCollisions(abi)
 * )
 * if (collisions.length > 0) {
 *   console.warn('Selector collisions detected:', collisions)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const findSelectorCollisions = (
	abi: AbiInput,
): Effect.Effect<readonly SelectorCollision[], never> =>
	Effect.sync(() => _findSelectorCollisions([...abi]) as SelectorCollision[]);

/**
 * Checks if an ABI has any function selector collisions.
 *
 * @description
 * Quick check for the presence of selector collisions.
 *
 * @param {AbiInput} abi - The contract ABI to check.
 * @returns {Effect.Effect<boolean, never>}
 *   Effect yielding true if collisions exist.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { hasSelectorCollisions } from 'voltaire-effect/primitives/Abi'
 *
 * const hasCollisions = await Effect.runPromise(
 *   hasSelectorCollisions(abi)
 * )
 * ```
 *
 * @since 0.0.1
 */
export const hasSelectorCollisions = (
	abi: AbiInput,
): Effect.Effect<boolean, never> =>
	Effect.sync(() => _hasSelectorCollisions([...abi]));
