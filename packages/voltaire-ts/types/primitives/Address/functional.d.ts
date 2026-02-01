/**
 * Tree-shakeable functional API for Address operations
 *
 * @example
 * ```typescript
 * import { from, toHex, toChecksummed } from '@tevm/voltaire/Address/functional'
 *
 * const addr = from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e')
 * console.log(toHex(addr))
 * console.log(toChecksummed(addr))
 * ```
 *
 * @example Namespace import
 * ```typescript
 * import * as Address from '@tevm/voltaire/Address/functional'
 *
 * const addr = Address.from('0x...')
 * Address.toHex(addr)
 * ```
 */
export * from "./internal-index.js";
//# sourceMappingURL=functional.d.ts.map