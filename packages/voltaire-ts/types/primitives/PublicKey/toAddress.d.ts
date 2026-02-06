import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { PublicKeyType } from "./PublicKeyType.js";
/**
 * Derive Ethereum address from public key
 *
 * @param this - Public key
 * @returns Ethereum address (20 bytes)
 *
 * @example
 * ```typescript
 * const address = PublicKey._toAddress.call(pk);
 * ```
 */
export declare function toAddress(this: PublicKeyType): BrandedAddress;
//# sourceMappingURL=toAddress.d.ts.map