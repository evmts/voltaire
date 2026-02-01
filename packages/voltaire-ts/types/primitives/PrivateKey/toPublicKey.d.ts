import type { PublicKeyType } from "../PublicKey/PublicKeyType.js";
import type { PrivateKeyType } from "./PrivateKeyType.js";
/**
 * Derive public key from private key
 *
 * @param this - Private key
 * @returns Public key (uncompressed 64 bytes)
 *
 * @example
 * ```typescript
 * const publicKey = PrivateKey._toPublicKey.call(pk);
 * ```
 */
export declare function toPublicKey(this: PrivateKeyType): PublicKeyType;
//# sourceMappingURL=toPublicKey.d.ts.map