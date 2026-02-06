/**
 * RPC Client Adapter
 *
 * Adapts EIP-1193 Provider to RpcClient interface for StateManager fork backend.
 * Wraps HttpProvider/WebSocketProvider to provide typed state queries.
 *
 * @module state-manager/StateManager/RpcClientAdapter
 */
import type { AddressType } from "../../primitives/Address/AddressType.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
import type { EthProof, RpcClient } from "./index.js";
/**
 * RPC Client Adapter Options
 */
export interface RpcClientAdapterOptions {
    /**
     * EIP-1193 provider (HttpProvider, WebSocketProvider, etc.)
     */
    provider: Provider;
    /**
     * Optional timeout for RPC calls (ms)
     */
    timeout?: number;
    /**
     * Optional retry attempts
     */
    retries?: number;
}
/**
 * Adapts EIP-1193 Provider to RpcClient interface
 *
 * Provides typed wrappers for eth_getProof and eth_getCode
 * with proper error handling and type conversion.
 *
 * @example
 * ```typescript
 * import { HttpProvider } from '../../provider/HttpProvider.js';
 * import { RpcClientAdapter } from './RpcClientAdapter.js';
 *
 * const httpProvider = new HttpProvider('https://eth-mainnet.g.alchemy.com/v2/KEY');
 * const rpcClient = new RpcClientAdapter({ provider: httpProvider });
 *
 * // Get account proof
 * const proof = await rpcClient.getProof(
 *   address,
 *   ['0x0', '0x1'],
 *   '0x112a880'
 * );
 *
 * // Get contract code
 * const code = await rpcClient.getCode(address, 'latest');
 * ```
 */
export declare class RpcClientAdapter implements RpcClient {
    private provider;
    private timeout;
    private retries;
    constructor(options: RpcClientAdapterOptions);
    /**
     * Get account proof (eth_getProof)
     *
     * @param address - Account address
     * @param slots - Storage slots to prove
     * @param blockTag - Block tag ("latest", "0x123...", etc.)
     * @returns Account proof with storage proofs
     */
    getProof(address: AddressType, slots: readonly Hex[], blockTag: string): Promise<EthProof>;
    /**
     * Get contract code (eth_getCode)
     *
     * @param address - Contract address
     * @param blockTag - Block tag ("latest", "0x123...", etc.)
     * @returns Contract bytecode as hex string
     */
    getCode(address: AddressType, blockTag: string): Promise<Hex>;
    /**
     * Get block by number (eth_getBlockByNumber)
     *
     * @param blockTag - Block tag or number
     * @param fullTransactions - Whether to include full transaction objects
     * @returns Block data
     */
    getBlockByNumber(blockTag: string | bigint, fullTransactions?: boolean): Promise<unknown>;
    /**
     * Get block by hash (eth_getBlockByHash)
     *
     * @param blockHash - Block hash
     * @param fullTransactions - Whether to include full transaction objects
     * @returns Block data
     */
    getBlockByHash(blockHash: Hex, fullTransactions?: boolean): Promise<unknown>;
    /**
     * Get current block number (eth_blockNumber)
     *
     * @returns Latest block number as hex string
     */
    getBlockNumber(): Promise<Hex>;
}
//# sourceMappingURL=RpcClientAdapter.d.ts.map