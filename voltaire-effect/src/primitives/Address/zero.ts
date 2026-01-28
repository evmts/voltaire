/**
 * @module zero
 * @description Create the zero address (0x0000...0000)
 * @since 0.1.0
 */
import { Address, type AddressType } from "@tevm/voltaire/Address";

/**
 * Create zero address (0x0000...0000)
 *
 * @returns AddressType with all bytes set to 0
 * @example
 * ```typescript
 * const zeroAddr = Address.zero()
 * Address.isZero(zeroAddr) // true
 * ```
 */
export const zero = (): AddressType => Address.zero();
