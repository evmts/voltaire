/**
 * @fileoverview BN254 point types.
 * @module Bn254/types
 * @since 0.0.1
 */

/**
 * G1 point type - element of the first pairing group
 */
export type G1PointType = Uint8Array & { readonly __brand: "BN254G1Point" };

/**
 * G2 point type - element of the second pairing group
 */
export type G2PointType = Uint8Array & { readonly __brand: "BN254G2Point" };
