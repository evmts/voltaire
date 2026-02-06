/**
 * @module comparisons
 * @description Hardfork comparison predicates (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Check if a > b chronologically
 */
export const gt: (a: HardforkType, b: HardforkType) => boolean = Hardfork.gt;

/**
 * Check if a >= b chronologically
 */
export const gte: (a: HardforkType, b: HardforkType) => boolean = Hardfork.gte;

/**
 * Check if a < b chronologically
 */
export const lt: (a: HardforkType, b: HardforkType) => boolean = Hardfork.lt;

/**
 * Check if a <= b chronologically
 */
export const lte: (a: HardforkType, b: HardforkType) => boolean = Hardfork.lte;

/**
 * Check if fork is after a minimum fork
 */
export const isAfter: (fork: HardforkType, minFork: HardforkType) => boolean =
	Hardfork.isAfter;

/**
 * Check if fork is at least a minimum fork
 */
export const isAtLeast: (fork: HardforkType, minFork: HardforkType) => boolean =
	Hardfork.isAtLeast;

/**
 * Check if fork is before a maximum fork
 */
export const isBefore: (fork: HardforkType, maxFork: HardforkType) => boolean =
	Hardfork.isBefore;
