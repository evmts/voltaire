/**
 * HMAC - Branded type for HMAC authentication codes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.1.42
 */
export type HMACType = Uint8Array & { readonly __tag: "HMAC" };
