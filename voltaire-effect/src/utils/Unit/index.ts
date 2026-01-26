/**
 * @fileoverview Unit utilities for parsing and formatting Ethereum denominations.
 *
 * @description
 * Provides Effect-based utilities for converting between human-readable decimal
 * strings and bigint values in wei.
 *
 * - **parseEther**: Parse ether string to wei (18 decimals)
 * - **formatEther**: Format wei to ether string (18 decimals)
 * - **parseGwei**: Parse gwei string to wei (9 decimals)
 * - **formatGwei**: Format wei to gwei string (9 decimals)
 * - **parseUnits**: Parse with custom decimals
 * - **formatUnits**: Format with custom decimals
 *
 * @example
 * ```typescript
 * import * as Unit from 'voltaire-effect/utils/Unit'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Parse 1.5 ETH to wei
 *   const wei = yield* Unit.parseEther("1.5")
 *   // → 1500000000000000000n
 *
 *   // Format wei back to ETH
 *   const eth = yield* Unit.formatEther(wei)
 *   // → "1.5"
 *
 *   // Parse gas price in gwei
 *   const gasWei = yield* Unit.parseGwei("20.5")
 *   // → 20500000000n
 *
 *   // Custom decimals (e.g., USDC has 6)
 *   const usdc = yield* Unit.parseUnits("100.50", 6)
 *   // → 100500000n
 * })
 * ```
 *
 * @module utils/Unit
 * @since 0.0.1
 */

export { UnitError } from "./errors.js";
export { formatEther } from "./formatEther.js";
export { formatGwei } from "./formatGwei.js";
export { formatUnits } from "./formatUnits.js";
export { parseEther } from "./parseEther.js";
export { parseGwei } from "./parseGwei.js";
export { parseUnits } from "./parseUnits.js";
