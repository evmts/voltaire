/**
 * @module features
 * @description Hardfork feature checks (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Check if hardfork has EIP-1153 (transient storage)
 */
export const hasEIP1153: (fork: HardforkType) => boolean = Hardfork.hasEIP1153;

/**
 * Check if hardfork has EIP-1559 (fee market)
 */
export const hasEIP1559: (fork: HardforkType) => boolean = Hardfork.hasEIP1559;

/**
 * Check if hardfork has EIP-3855 (PUSH0)
 */
export const hasEIP3855: (fork: HardforkType) => boolean = Hardfork.hasEIP3855;

/**
 * Check if hardfork has EIP-4844 (blobs)
 */
export const hasEIP4844: (fork: HardforkType) => boolean = Hardfork.hasEIP4844;

/**
 * Check if hardfork supports blob transactions
 */
export const supportsBlobs: (fork: HardforkType) => boolean =
	Hardfork.supportsBlobs;

/**
 * Check if hardfork supports EIP-1559 fee market
 */
export const supportsEIP1559: (fork: HardforkType) => boolean =
	Hardfork.supportsEIP1559;

/**
 * Check if hardfork supports PUSH0 opcode
 */
export const supportsPUSH0: (fork: HardforkType) => boolean =
	Hardfork.supportsPUSH0;

/**
 * Check if hardfork supports transient storage
 */
export const supportsTransientStorage: (fork: HardforkType) => boolean =
	Hardfork.supportsTransientStorage;

/**
 * Check if hardfork is Proof of Stake
 */
export const isPoS: (fork: HardforkType) => boolean = Hardfork.isPoS;

/**
 * Check if hardfork is post-Merge
 */
export const isPostMerge: (fork: HardforkType) => boolean = Hardfork.isPostMerge;
