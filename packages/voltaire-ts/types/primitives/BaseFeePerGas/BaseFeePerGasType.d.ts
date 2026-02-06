import type { brand } from "../../brand.js";
/**
 * Branded BaseFeePerGas type - EIP-1559 base fee per gas
 * Represents the minimum gas price required for transaction inclusion
 * Base fee is burned and adjusts dynamically based on block fullness
 *
 * @see https://eips.ethereum.org/EIPS/eip-1559
 */
export type BaseFeePerGasType = bigint & {
    readonly [brand]: "BaseFeePerGas";
};
//# sourceMappingURL=BaseFeePerGasType.d.ts.map