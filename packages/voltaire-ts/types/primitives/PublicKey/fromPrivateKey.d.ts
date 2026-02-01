import type { PrivateKeyType } from "../PrivateKey/PrivateKeyType.js";
import type { PublicKeyType } from "./PublicKeyType.js";
/**
 * Derive public key from private key
 *
 * @param privateKey - Private key
 * @returns Public key (64 bytes uncompressed)
 *
 * @example
 * ```typescript
 * const publicKey = PublicKey.fromPrivateKey(pk);
 * ```
 */
export declare function fromPrivateKey(privateKey: PrivateKeyType): PublicKeyType;
//# sourceMappingURL=fromPrivateKey.d.ts.map