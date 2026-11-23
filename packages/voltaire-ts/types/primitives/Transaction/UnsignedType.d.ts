import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";
/**
 * Unsigned legacy transaction (Type 0).
 *
 * `chainId` selects the EIP-155 signing payload
 * `[nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]`.
 * Omit it (or pass `null`) for the pre-EIP-155 payload
 * `[nonce, gasPrice, gasLimit, to, value, data]`.
 */
export type UnsignedLegacy = Omit<Legacy, "v" | "r" | "s"> & {
    chainId?: bigint | null;
};
/** Unsigned EIP-2930 transaction (Type 1) */
export type UnsignedEIP2930 = Omit<EIP2930, "yParity" | "r" | "s">;
/** Unsigned EIP-1559 transaction (Type 2) */
export type UnsignedEIP1559 = Omit<EIP1559, "yParity" | "r" | "s">;
/** Unsigned EIP-4844 transaction (Type 3) */
export type UnsignedEIP4844 = Omit<EIP4844, "yParity" | "r" | "s">;
/** Unsigned EIP-7702 transaction (Type 4) */
export type UnsignedEIP7702 = Omit<EIP7702, "yParity" | "r" | "s">;
/** Any unsigned transaction */
export type Unsigned = UnsignedLegacy | UnsignedEIP2930 | UnsignedEIP1559 | UnsignedEIP4844 | UnsignedEIP7702;
//# sourceMappingURL=UnsignedType.d.ts.map