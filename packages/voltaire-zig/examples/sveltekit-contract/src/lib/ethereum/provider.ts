/**
 * BrowserProvider wrapper for MetaMask/injected wallets using Voltaire primitives
 */

import { Address, Hex, Keccak256 } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire";

/**
 * EIP-1193 Provider interface (MetaMask, etc.)
 */
export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

/**
 * Typed wrapper around injected Ethereum provider
 */
export class BrowserProvider {
  private provider: EIP1193Provider;

  constructor(provider: EIP1193Provider) {
    this.provider = provider;
  }

  /**
   * Get browser provider from window.ethereum
   */
  static fromWindow(): BrowserProvider | null {
    if (typeof window === "undefined" || !window.ethereum) {
      return null;
    }
    return new BrowserProvider(window.ethereum);
  }

  /**
   * Request wallet connection
   * @returns Array of connected addresses
   */
  async connect(): Promise<AddressType[]> {
    const accounts = (await this.provider.request({
      method: "eth_requestAccounts",
    })) as string[];

    return accounts.map((acc) => Address(acc, { keccak256: Keccak256.hash }));
  }

  /**
   * Get currently connected accounts
   */
  async getAccounts(): Promise<AddressType[]> {
    const accounts = (await this.provider.request({
      method: "eth_accounts",
    })) as string[];

    return accounts.map((acc) => Address(acc, { keccak256: Keccak256.hash }));
  }

  /**
   * Get current chain ID
   */
  async getChainId(): Promise<bigint> {
    const chainId = (await this.provider.request({
      method: "eth_chainId",
    })) as string;
    return BigInt(chainId);
  }

  /**
   * Get balance of address
   */
  async getBalance(address: AddressType): Promise<bigint> {
    const balance = (await this.provider.request({
      method: "eth_getBalance",
      params: [Address.toHex(address), "latest"],
    })) as string;
    return BigInt(balance);
  }

  /**
   * Send raw JSON-RPC request
   */
  async request<T>(method: string, params?: unknown[]): Promise<T> {
    return (await this.provider.request({ method, params })) as T;
  }

  /**
   * Call a contract (read-only)
   */
  async call(params: {
    to: AddressType;
    data: Uint8Array;
    from?: AddressType;
  }): Promise<Uint8Array> {
    const result = (await this.provider.request({
      method: "eth_call",
      params: [
        {
          to: Address.toHex(params.to),
          data: Hex.fromBytes(params.data),
          ...(params.from && { from: Address.toHex(params.from) }),
        },
        "latest",
      ],
    })) as string;

    return Hex.toBytes(result as `0x${string}`);
  }

  /**
   * Send a transaction (write)
   */
  async sendTransaction(params: {
    to: AddressType;
    data: Uint8Array;
    from: AddressType;
    value?: bigint;
    gas?: bigint;
  }): Promise<string> {
    const txHash = (await this.provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          to: Address.toHex(params.to),
          data: Hex.fromBytes(params.data),
          from: Address.toHex(params.from),
          ...(params.value && { value: `0x${params.value.toString(16)}` }),
          ...(params.gas && { gas: `0x${params.gas.toString(16)}` }),
        },
      ],
    })) as string;

    return txHash;
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransaction(
    txHash: string,
    timeout = 60000
  ): Promise<{ status: boolean; blockNumber: bigint }> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const receipt = (await this.provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      })) as { status: string; blockNumber: string } | null;

      if (receipt) {
        return {
          status: receipt.status === "0x1",
          blockNumber: BigInt(receipt.blockNumber),
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Transaction timeout");
  }

  /**
   * Subscribe to account changes
   */
  onAccountsChanged(handler: (accounts: AddressType[]) => void): () => void {
    const wrappedHandler = (accounts: unknown) => {
      const addrs = (accounts as string[]).map((acc) =>
        Address(acc, { keccak256: Keccak256.hash })
      );
      handler(addrs);
    };
    this.provider.on("accountsChanged", wrappedHandler);
    return () => this.provider.removeListener("accountsChanged", wrappedHandler);
  }

  /**
   * Subscribe to chain changes
   */
  onChainChanged(handler: (chainId: bigint) => void): () => void {
    const wrappedHandler = (chainId: unknown) => {
      handler(BigInt(chainId as string));
    };
    this.provider.on("chainChanged", wrappedHandler);
    return () => this.provider.removeListener("chainChanged", wrappedHandler);
  }

  /**
   * Get logs for event filtering
   */
  async getLogs(params: {
    address: AddressType;
    topics: (string | null)[];
    fromBlock?: bigint | "latest";
    toBlock?: bigint | "latest";
  }): Promise<
    Array<{
      address: AddressType;
      topics: string[];
      data: Uint8Array;
      blockNumber: bigint;
      transactionHash: string;
      logIndex: number;
    }>
  > {
    const logs = (await this.provider.request({
      method: "eth_getLogs",
      params: [
        {
          address: Address.toHex(params.address),
          topics: params.topics,
          fromBlock:
            params.fromBlock === "latest" || params.fromBlock === undefined
              ? "latest"
              : `0x${params.fromBlock.toString(16)}`,
          toBlock:
            params.toBlock === "latest" || params.toBlock === undefined
              ? "latest"
              : `0x${params.toBlock.toString(16)}`,
        },
      ],
    })) as Array<{
      address: string;
      topics: string[];
      data: string;
      blockNumber: string;
      transactionHash: string;
      logIndex: string;
    }>;

    return logs.map((log) => ({
      address: Address(log.address, { keccak256: Keccak256.hash }),
      topics: log.topics,
      data: Hex.toBytes(log.data as `0x${string}`),
      blockNumber: BigInt(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: parseInt(log.logIndex, 16),
    }));
  }
}
