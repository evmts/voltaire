import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import type { PrivateKeyType } from "./PrivateKeyType.js";
/**
 * Derive Ethereum address from private key
 *
 * @param this - Private key
 * @returns Ethereum address (20 bytes)
 *
 * @example
 * ```typescript
 * const address = PrivateKey._toAddress.call(pk);
 * ```
 */
export declare function toAddress(this: PrivateKeyType): BrandedAddress;
//# sourceMappingURL=toAddress.d.ts.map