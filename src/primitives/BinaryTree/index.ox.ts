/**
 * BinaryTree Module - Ox-based Implementation
 *
 * This module provides binary state tree utilities.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Uses Ox's BinaryStateTree (note: Ox naming convention).
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Constructors
	create,
	// Operations
	insert,
	merkelize,
	// Types
	type BinaryStateTree,
	type Node,
} from "ox/BinaryStateTree";

// ============================================================================
// Compatibility Aliases (Naming differences)
// ============================================================================

// Ox uses BinaryStateTree, Voltaire historically used BinaryTree
import * as OxBinaryStateTree from "ox/BinaryStateTree";
import type { BinaryStateTree } from "ox/BinaryStateTree";

/**
 * Factory function for creating BinaryTree instances (alias for Ox's create)
 *
 * Creates an empty binary state tree
 *
 * @returns {BinaryStateTree} Empty binary state tree
 *
 * @example
 * ```typescript
 * import * as BinaryTree from './index.ox.js'
 *
 * const tree = BinaryTree.BinaryTree()
 * console.log(tree.root.type) // 'empty'
 * ```
 */
export function BinaryTree(): BinaryStateTree {
	return OxBinaryStateTree.create();
}

// Static methods (namespace pattern)
BinaryTree.create = OxBinaryStateTree.create;
BinaryTree.insert = OxBinaryStateTree.insert;
BinaryTree.merkelize = OxBinaryStateTree.merkelize;
