/**
 * Constants
 * Common Ethereum constants
 */

export type Hex = `0x${string}`;

/**
 * Maximum signed 256-bit integer
 */
export const MaxInt256: bigint = BigInt(
	"0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

/**
 * Minimum signed 256-bit integer
 */
export const MinInt256: bigint = BigInt(
	"-0x8000000000000000000000000000000000000000000000000000000000000000",
);

/**
 * Maximum unsigned 256-bit integer
 */
export const MaxUint256: bigint = BigInt(
	"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
);

/**
 * secp256k1 curve order
 */
export const N: bigint = BigInt(
	"0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
);

/**
 * Wei per ether (10^18)
 */
export const WeiPerEther: bigint = BigInt("1000000000000000000");

/**
 * Zero address
 */
export const ZeroAddress: Hex = "0x0000000000000000000000000000000000000000";

/**
 * Zero hash
 */
export const ZeroHash: Hex =
	"0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Ether symbol (NFKC normalized)
 */
export const EtherSymbol = "Ξ";

/**
 * EIP-191 message prefix
 */
export const MessagePrefix = "\x19Ethereum Signed Message:\n";
