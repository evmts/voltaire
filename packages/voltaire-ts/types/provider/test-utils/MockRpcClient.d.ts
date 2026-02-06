/**
 * MockRpcClient for testing
 *
 * Simple mock that returns predefined responses for eth_* RPC methods.
 * Used for testing ForkProvider without real RPC dependency.
 */
import type { Provider } from "../Provider.js";
import type { RequestArguments } from "../types.js";
export interface MockAccountState {
    balance: bigint;
    nonce: bigint;
    code: string;
    storage: Map<bigint, bigint>;
}
export interface MockBlock {
    number: bigint;
    hash: string;
    parentHash: string;
    timestamp: bigint;
    gasLimit: bigint;
    gasUsed: bigint;
    baseFeePerGas?: bigint;
    miner: string;
    transactions: string[];
}
export declare class MockRpcClient implements Provider {
    private accounts;
    private blocks;
    private blocksByNumber;
    private currentBlockNumber;
    /**
     * Set account state for testing
     */
    setAccount(address: string, state: Partial<MockAccountState>): void;
    /**
     * Set block data for testing
     */
    setBlock(block: MockBlock): void;
    /**
     * EIP-1193 request implementation
     */
    request(args: RequestArguments): Promise<unknown>;
    private parseBlockTag;
    private formatBlock;
    on(): this;
    removeListener(): this;
}
//# sourceMappingURL=MockRpcClient.d.ts.map