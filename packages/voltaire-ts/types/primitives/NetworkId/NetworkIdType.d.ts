import type { brand } from "../../brand.js";
/**
 * Branded NetworkId type - Ethereum network identifier
 * Wraps a number representing a network ID (different from ChainId)
 *
 * Network IDs identify different Ethereum networks for peer discovery:
 * - 1 = Mainnet
 * - 5 = Goerli (deprecated)
 * - 11155111 = Sepolia
 *
 * Note: NetworkId is NOT the same as ChainId (EIP-155).
 * ChainId is used for replay protection in transactions,
 * while NetworkId is used for peer-to-peer network identification.
 */
export type NetworkIdType = number & {
    readonly [brand]: "NetworkId";
};
//# sourceMappingURL=NetworkIdType.d.ts.map