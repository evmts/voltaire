import type { brand } from "../../brand.js";

/**
 * Branded CompilerVersion type - prevents version confusion
 * Represents a Solidity or Vyper compiler version string
 *
 * Format: "v0.8.20+commit.a1b2c3d4" or "0.8.20+commit.a1b2c3d4"
 *
 * @example
 * ```typescript
 * const version: CompilerVersionType = "v0.8.20+commit.a1b2c3d4";
 * ```
 */
export type CompilerVersionType = string & {
	readonly [brand]: "CompilerVersion";
};
