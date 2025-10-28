/**
 * Hardfork Types and Utilities
 *
 * Ethereum protocol upgrades with version comparison and string parsing.
 * All types namespaced under Hardfork for intuitive access.
 *
 * @example
 * ```typescript
 * import { Hardfork } from './hardfork.js';
 *
 * // Types
 * const fork: Hardfork.Id = Hardfork.Id.CANCUN;
 *
 * // Standard form
 * const isValid = Hardfork.isAtLeast(fork, Hardfork.Id.SHANGHAI);
 *
 * // Convenience form
 * const parsed = Hardfork.fromString.call("Cancun");
 * ```
 */

// ============================================================================
// Main Hardfork Namespace
// ============================================================================

export namespace Hardfork {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Hardfork identifier enum.
   *
   * Each hardfork represents a protocol upgrade that changes EVM behavior,
   * gas costs, or adds new features. Hardforks build upon previous ones,
   * maintaining backward compatibility while adding improvements.
   */
  export enum Id {
    /** Original Ethereum launch (July 2015). Base EVM with fundamental opcodes. */
    FRONTIER = 0,
    /** First planned hardfork (March 2016). Added DELEGATECALL and fixed critical issues. */
    HOMESTEAD = 1,
    /** Emergency fork for DAO hack (July 2016). No EVM changes, only state modifications. */
    DAO = 2,
    /** Gas repricing fork (October 2016). EIP-150: Increased gas costs for IO-heavy operations. */
    TANGERINE_WHISTLE = 3,
    /** State cleaning fork (November 2016). EIP-161: Removed empty accounts. */
    SPURIOUS_DRAGON = 4,
    /** Major feature fork (October 2017). Added REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL. */
    BYZANTIUM = 5,
    /** Efficiency improvements (February 2019). Added CREATE2, shift opcodes, EXTCODEHASH. */
    CONSTANTINOPLE = 6,
    /** Quick fix fork (February 2019). Removed EIP-1283 due to reentrancy concerns. */
    PETERSBURG = 7,
    /** Gas optimization fork (December 2019). EIP-2200: Rebalanced SSTORE costs. Added CHAINID and SELFBALANCE. */
    ISTANBUL = 8,
    /** Difficulty bomb delay (January 2020). No EVM changes. */
    MUIR_GLACIER = 9,
    /** Access list fork (April 2021). EIP-2929: Gas cost for cold/warm access. EIP-2930: Optional access lists. */
    BERLIN = 10,
    /** Fee market reform (August 2021). EIP-1559: Base fee and new transaction types. Added BASEFEE opcode. */
    LONDON = 11,
    /** Difficulty bomb delay (December 2021). No EVM changes. */
    ARROW_GLACIER = 12,
    /** Difficulty bomb delay (June 2022). No EVM changes. */
    GRAY_GLACIER = 13,
    /** Proof of Stake transition (September 2022). Replaced DIFFICULTY with PREVRANDAO. */
    MERGE = 14,
    /** Withdrawal enabling fork (April 2023). EIP-3855: PUSH0 opcode. */
    SHANGHAI = 15,
    /** Proto-danksharding fork (March 2024). EIP-4844: Blob transactions. EIP-1153: Transient storage (TLOAD/TSTORE). EIP-5656: MCOPY opcode. */
    CANCUN = 16,
    /** Prague-Electra fork (May 2025). EIP-2537: BLS12-381 precompiles. EIP-7702: Set EOA account code for one transaction. */
    PRAGUE = 17,
    /** Osaka fork (TBD). EIP-7883: ModExp gas increase. */
    OSAKA = 18,
  }

  /**
   * Default hardfork for new chains.
   * Set to latest stable fork (currently PRAGUE).
   */
  export const DEFAULT: Id = Id.PRAGUE;

  /**
   * Hardfork name to ID mapping for string parsing
   */
  const NAME_TO_ID: Record<string, Id> = {
    frontier: Id.FRONTIER,
    homestead: Id.HOMESTEAD,
    dao: Id.DAO,
    tangerinewhistle: Id.TANGERINE_WHISTLE,
    spuriousdragon: Id.SPURIOUS_DRAGON,
    byzantium: Id.BYZANTIUM,
    constantinople: Id.CONSTANTINOPLE,
    petersburg: Id.PETERSBURG,
    constantinoplefix: Id.PETERSBURG, // alias
    istanbul: Id.ISTANBUL,
    muirglacier: Id.MUIR_GLACIER,
    berlin: Id.BERLIN,
    london: Id.LONDON,
    arrowglacier: Id.ARROW_GLACIER,
    grayglacier: Id.GRAY_GLACIER,
    merge: Id.MERGE,
    paris: Id.MERGE, // alias
    shanghai: Id.SHANGHAI,
    cancun: Id.CANCUN,
    prague: Id.PRAGUE,
    osaka: Id.OSAKA,
  };

  /**
   * ID to name mapping for toString conversion
   */
  const ID_TO_NAME: Record<Id, string> = {
    [Id.FRONTIER]: "frontier",
    [Id.HOMESTEAD]: "homestead",
    [Id.DAO]: "dao",
    [Id.TANGERINE_WHISTLE]: "tangerinewhistle",
    [Id.SPURIOUS_DRAGON]: "spuriousdragon",
    [Id.BYZANTIUM]: "byzantium",
    [Id.CONSTANTINOPLE]: "constantinople",
    [Id.PETERSBURG]: "petersburg",
    [Id.ISTANBUL]: "istanbul",
    [Id.MUIR_GLACIER]: "muirglacier",
    [Id.BERLIN]: "berlin",
    [Id.LONDON]: "london",
    [Id.ARROW_GLACIER]: "arrowglacier",
    [Id.GRAY_GLACIER]: "grayglacier",
    [Id.MERGE]: "merge",
    [Id.SHANGHAI]: "shanghai",
    [Id.CANCUN]: "cancun",
    [Id.PRAGUE]: "prague",
    [Id.OSAKA]: "osaka",
  };

  // ==========================================================================
  // Comparison Operations (Standard Form)
  // ==========================================================================

  /**
   * Check if current hardfork is at least the specified version
   *
   * @param current - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if current >= target
   *
   * @example
   * ```typescript
   * const current = Hardfork.Id.CANCUN;
   * if (Hardfork.isAtLeast(current, Hardfork.Id.SHANGHAI)) {
   *   // PUSH0 opcode is available
   * }
   * ```
   */
  export function isAtLeast(current: Id, target: Id): boolean {
    return current >= target;
  }

  /**
   * Check if current hardfork is before the specified version
   *
   * @param current - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if current < target
   *
   * @example
   * ```typescript
   * const current = Hardfork.Id.BERLIN;
   * if (Hardfork.isBefore(current, Hardfork.Id.LONDON)) {
   *   // EIP-1559 not available yet
   * }
   * ```
   */
  export function isBefore(current: Id, target: Id): boolean {
    return current < target;
  }

  /**
   * Check if current hardfork is after the specified version
   *
   * @param current - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if current > target
   *
   * @example
   * ```typescript
   * const current = Hardfork.Id.CANCUN;
   * if (Hardfork.isAfter(current, Hardfork.Id.SHANGHAI)) {
   *   // Blob transactions available
   * }
   * ```
   */
  export function isAfter(current: Id, target: Id): boolean {
    return current > target;
  }

  /**
   * Check if two hardforks are equal
   *
   * @param a - First hardfork
   * @param b - Second hardfork
   * @returns true if a == b
   *
   * @example
   * ```typescript
   * if (Hardfork.isEqual(fork, Hardfork.Id.CANCUN)) {
   *   // Exactly Cancun
   * }
   * ```
   */
  export function isEqual(a: Id, b: Id): boolean {
    return a === b;
  }

  /**
   * Compare two hardforks
   *
   * @param a - First hardfork
   * @param b - Second hardfork
   * @returns negative if a < b, zero if a == b, positive if a > b
   *
   * @example
   * ```typescript
   * Hardfork.compare(Hardfork.Id.BERLIN, Hardfork.Id.LONDON) // negative
   * Hardfork.compare(Hardfork.Id.CANCUN, Hardfork.Id.CANCUN) // 0
   * Hardfork.compare(Hardfork.Id.PRAGUE, Hardfork.Id.SHANGHAI) // positive
   * ```
   */
  export function compare(a: Id, b: Id): number {
    return a - b;
  }

  /**
   * Get minimum hardfork from array
   *
   * @param forks - Array of hardforks
   * @returns Minimum (oldest) hardfork
   *
   * @example
   * ```typescript
   * const oldest = Hardfork.min([
   *   Hardfork.Id.CANCUN,
   *   Hardfork.Id.BERLIN,
   *   Hardfork.Id.SHANGHAI
   * ]); // BERLIN
   * ```
   */
  export function min(forks: Id[]): Id {
    if (forks.length === 0) {
      throw new Error("Cannot get min of empty array");
    }
    return forks.reduce((a, b) => (a < b ? a : b));
  }

  /**
   * Get maximum hardfork from array
   *
   * @param forks - Array of hardforks
   * @returns Maximum (newest) hardfork
   *
   * @example
   * ```typescript
   * const newest = Hardfork.max([
   *   Hardfork.Id.CANCUN,
   *   Hardfork.Id.BERLIN,
   *   Hardfork.Id.SHANGHAI
   * ]); // CANCUN
   * ```
   */
  export function max(forks: Id[]): Id {
    if (forks.length === 0) {
      throw new Error("Cannot get max of empty array");
    }
    return forks.reduce((a, b) => (a > b ? a : b));
  }

  // ==========================================================================
  // String Conversion Operations (Standard Form)
  // ==========================================================================

  /**
   * Parse hardfork from string name (case-insensitive)
   * Supports both standard names and common variations
   *
   * @param name - Hardfork name (e.g., "Cancun", ">=Berlin")
   * @returns Hardfork enum value or undefined if invalid
   *
   * @example
   * ```typescript
   * const fork = Hardfork.fromString("cancun"); // Hardfork.Id.CANCUN
   * const fork2 = Hardfork.fromString("Paris"); // Hardfork.Id.MERGE
   * const invalid = Hardfork.fromString("unknown"); // undefined
   * ```
   */
  export function fromString(name: string): Id | undefined {
    // Handle comparisons like ">=Cancun" or ">Berlin"
    let cleanName = name;
    if (name.length > 0 && (name[0] === ">" || name[0] === "<")) {
      const start = name.length > 1 && name[1] === "=" ? 2 : 1;
      cleanName = name.substring(start);
    }

    // Case-insensitive comparison
    const lower = cleanName.toLowerCase();
    return NAME_TO_ID[lower];
  }

  /**
   * Convert hardfork to string name
   *
   * @param fork - Hardfork ID
   * @returns Lowercase hardfork name
   *
   * @example
   * ```typescript
   * Hardfork.toString(Hardfork.Id.CANCUN); // "cancun"
   * Hardfork.toString(Hardfork.Id.MERGE); // "merge"
   * ```
   */
  export function toString(fork: Id): string {
    return ID_TO_NAME[fork];
  }

  /**
   * Check if string is a valid hardfork name
   *
   * @param name - String to validate
   * @returns true if valid hardfork name
   *
   * @example
   * ```typescript
   * Hardfork.isValidName("cancun"); // true
   * Hardfork.isValidName("paris"); // true (alias for merge)
   * Hardfork.isValidName("invalid"); // false
   * ```
   */
  export function isValidName(name: string): boolean {
    return fromString(name) !== undefined;
  }

  // ==========================================================================
  // Convenience Form (this: parameter)
  // ==========================================================================

  /**
   * Check if hardfork is at least the specified version (convenience form)
   *
   * @param this - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if this >= target
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.CANCUN;
   * Hardfork.gte.call(fork, Hardfork.Id.SHANGHAI); // true
   * ```
   */
  export function gte(this: Id, target: Id): boolean {
    return isAtLeast(this, target);
  }

  /**
   * Check if hardfork is before the specified version (convenience form)
   *
   * @param this - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if this < target
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.BERLIN;
   * Hardfork.lt.call(fork, Hardfork.Id.LONDON); // true
   * ```
   */
  export function lt(this: Id, target: Id): boolean {
    return isBefore(this, target);
  }

  /**
   * Check if hardfork is after the specified version (convenience form)
   *
   * @param this - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if this > target
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.CANCUN;
   * Hardfork.gt.call(fork, Hardfork.Id.SHANGHAI); // true
   * ```
   */
  export function gt(this: Id, target: Id): boolean {
    return isAfter(this, target);
  }

  /**
   * Check if two hardforks are equal (convenience form)
   *
   * @param this - First hardfork
   * @param other - Second hardfork
   * @returns true if this == other
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.CANCUN;
   * Hardfork.eq.call(fork, Hardfork.Id.CANCUN); // true
   * ```
   */
  export function eq(this: Id, other: Id): boolean {
    return isEqual(this, other);
  }

  /**
   * Check if hardfork is less than or equal to target (convenience form)
   *
   * @param this - Current hardfork
   * @param target - Target hardfork to compare against
   * @returns true if this <= target
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.SHANGHAI;
   * Hardfork.lte.call(fork, Hardfork.Id.CANCUN); // true
   * ```
   */
  export function lte(this: Id, target: Id): boolean {
    return this <= target;
  }

  // ==========================================================================
  // Feature Detection
  // ==========================================================================

  /**
   * Check if hardfork has EIP-1559 (base fee mechanism)
   *
   * @param fork - Hardfork to check
   * @returns true if EIP-1559 is active
   *
   * @example
   * ```typescript
   * Hardfork.hasEIP1559(Hardfork.Id.LONDON); // true
   * Hardfork.hasEIP1559(Hardfork.Id.BERLIN); // false
   * ```
   */
  export function hasEIP1559(fork: Id): boolean {
    return isAtLeast(fork, Id.LONDON);
  }

  /**
   * Check if hardfork has EIP-1559 (convenience form)
   *
   * @param this - Hardfork to check
   * @returns true if EIP-1559 is active
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.LONDON;
   * Hardfork.supportsEIP1559.call(fork); // true
   * ```
   */
  export function supportsEIP1559(this: Id): boolean {
    return hasEIP1559(this);
  }

  /**
   * Check if hardfork has EIP-3855 (PUSH0 opcode)
   *
   * @param fork - Hardfork to check
   * @returns true if PUSH0 is available
   *
   * @example
   * ```typescript
   * Hardfork.hasEIP3855(Hardfork.Id.SHANGHAI); // true
   * Hardfork.hasEIP3855(Hardfork.Id.MERGE); // false
   * ```
   */
  export function hasEIP3855(fork: Id): boolean {
    return isAtLeast(fork, Id.SHANGHAI);
  }

  /**
   * Check if hardfork has EIP-3855 (convenience form)
   *
   * @param this - Hardfork to check
   * @returns true if PUSH0 is available
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.SHANGHAI;
   * Hardfork.supportsPUSH0.call(fork); // true
   * ```
   */
  export function supportsPUSH0(this: Id): boolean {
    return hasEIP3855(this);
  }

  /**
   * Check if hardfork has EIP-4844 (blob transactions)
   *
   * @param fork - Hardfork to check
   * @returns true if blob transactions are available
   *
   * @example
   * ```typescript
   * Hardfork.hasEIP4844(Hardfork.Id.CANCUN); // true
   * Hardfork.hasEIP4844(Hardfork.Id.SHANGHAI); // false
   * ```
   */
  export function hasEIP4844(fork: Id): boolean {
    return isAtLeast(fork, Id.CANCUN);
  }

  /**
   * Check if hardfork has EIP-4844 (convenience form)
   *
   * @param this - Hardfork to check
   * @returns true if blob transactions are available
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.CANCUN;
   * Hardfork.supportsBlobs.call(fork); // true
   * ```
   */
  export function supportsBlobs(this: Id): boolean {
    return hasEIP4844(this);
  }

  /**
   * Check if hardfork has EIP-1153 (transient storage)
   *
   * @param fork - Hardfork to check
   * @returns true if TLOAD/TSTORE are available
   *
   * @example
   * ```typescript
   * Hardfork.hasEIP1153(Hardfork.Id.CANCUN); // true
   * Hardfork.hasEIP1153(Hardfork.Id.SHANGHAI); // false
   * ```
   */
  export function hasEIP1153(fork: Id): boolean {
    return isAtLeast(fork, Id.CANCUN);
  }

  /**
   * Check if hardfork has EIP-1153 (convenience form)
   *
   * @param this - Hardfork to check
   * @returns true if TLOAD/TSTORE are available
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.CANCUN;
   * Hardfork.supportsTransientStorage.call(fork); // true
   * ```
   */
  export function supportsTransientStorage(this: Id): boolean {
    return hasEIP1153(this);
  }

  /**
   * Check if hardfork is post-merge (Proof of Stake)
   *
   * @param fork - Hardfork to check
   * @returns true if post-merge
   *
   * @example
   * ```typescript
   * Hardfork.isPostMerge(Hardfork.Id.SHANGHAI); // true
   * Hardfork.isPostMerge(Hardfork.Id.LONDON); // false
   * ```
   */
  export function isPostMerge(fork: Id): boolean {
    return isAtLeast(fork, Id.MERGE);
  }

  /**
   * Check if hardfork is post-merge (convenience form)
   *
   * @param this - Hardfork to check
   * @returns true if post-merge
   *
   * @example
   * ```typescript
   * const fork = Hardfork.Id.SHANGHAI;
   * Hardfork.isPoS.call(fork); // true
   * ```
   */
  export function isPoS(this: Id): boolean {
    return isPostMerge(this);
  }

  // ==========================================================================
  // Utility Operations
  // ==========================================================================

  /**
   * Get all hardfork names
   *
   * @returns Array of all hardfork names
   *
   * @example
   * ```typescript
   * const names = Hardfork.allNames(); // ["frontier", "homestead", ...]
   * ```
   */
  export function allNames(): string[] {
    return Object.values(ID_TO_NAME);
  }

  /**
   * Get all hardfork IDs
   *
   * @returns Array of all hardfork IDs
   *
   * @example
   * ```typescript
   * const ids = Hardfork.allIds(); // [0, 1, 2, ...]
   * ```
   */
  export function allIds(): Id[] {
    return Object.values(Id).filter((v) => typeof v === "number") as Id[];
  }

  /**
   * Get range of hardforks between two versions (inclusive)
   *
   * @param start - Start hardfork
   * @param end - End hardfork
   * @returns Array of hardfork IDs in range
   *
   * @example
   * ```typescript
   * const range = Hardfork.range(
   *   Hardfork.Id.BERLIN,
   *   Hardfork.Id.SHANGHAI
   * ); // [BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE, SHANGHAI]
   * ```
   */
  export function range(start: Id, end: Id): Id[] {
    const result: Id[] = [];
    const [min, max] = start <= end ? [start, end] : [end, start];
    for (let i = min; i <= max; i++) {
      result.push(i as Id);
    }
    return start <= end ? result : result.reverse();
  }
}

/**
 * Hardfork type alias (for convenience)
 *
 * Uses TypeScript declaration merging - Hardfork is both a namespace and a type.
 */
export type Hardfork = Hardfork.Id;

// Re-export namespace as default
export default Hardfork;
