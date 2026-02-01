/**
 * Contract wrapper using Voltaire's Abi, Address, Hex, and Keccak256
 */

import { Abi, Address, Hex, Keccak256 } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire";
import type { BrowserProvider } from "./provider";

/**
 * Simple Counter ABI for demonstration
 */
export const COUNTER_ABI = [
  {
    type: "function",
    name: "count",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "increment",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "decrement",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "setCount",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256", name: "newCount" }],
    outputs: [],
  },
  {
    type: "event",
    name: "CountChanged",
    inputs: [
      { type: "uint256", name: "oldValue", indexed: false },
      { type: "uint256", name: "newValue", indexed: false },
      { type: "address", name: "changedBy", indexed: true },
    ],
  },
] as const;

/**
 * ERC20 ABI (minimal)
 */
export const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string", name: "" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string", name: "" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [{ type: "bool", name: "" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { type: "address", name: "from", indexed: true },
      { type: "address", name: "to", indexed: true },
      { type: "uint256", name: "value", indexed: false },
    ],
  },
] as const;

export type AbiItem = (typeof COUNTER_ABI)[number] | (typeof ERC20_ABI)[number];

/**
 * Contract instance for interacting with smart contracts
 */
export class Contract<T extends readonly AbiItem[]> {
  readonly address: AddressType;
  readonly abi: ReturnType<typeof Abi>;
  private provider: BrowserProvider;

  constructor(params: {
    address: string | AddressType;
    abi: T;
    provider: BrowserProvider;
  }) {
    this.address =
      typeof params.address === "string"
        ? Address(params.address, { keccak256: Keccak256.hash })
        : params.address;
    this.abi = Abi(params.abi);
    this.provider = params.provider;
  }

  /**
   * Read from contract (call a view/pure function)
   */
  async read<TName extends string>(
    functionName: TName,
    args: unknown[] = []
  ): Promise<unknown> {
    const calldata = this.abi.encode(functionName, args);
    const result = await this.provider.call({
      to: this.address,
      data: calldata,
    });
    return this.abi.decode(functionName, result);
  }

  /**
   * Write to contract (send a transaction)
   */
  async write(
    functionName: string,
    args: unknown[] = [],
    options: { from: AddressType; value?: bigint; gas?: bigint } = {
      from: Address.zero(),
    }
  ): Promise<string> {
    const calldata = this.abi.encode(functionName, args);
    return this.provider.sendTransaction({
      to: this.address,
      data: calldata,
      from: options.from,
      value: options.value,
      gas: options.gas,
    });
  }

  /**
   * Get event topic hash
   */
  getEventTopic(eventName: string): string {
    const event = (this.abi as unknown as { items: AbiItem[] }).items?.find(
      (item: AbiItem) => item.type === "event" && item.name === eventName
    );
    if (!event || event.type !== "event") {
      throw new Error(`Event ${eventName} not found in ABI`);
    }

    const signature = `${event.name}(${event.inputs.map((i) => i.type).join(",")})`;
    const hash = Keccak256.hash(new TextEncoder().encode(signature));
    return Hex.fromBytes(hash);
  }

  /**
   * Parse log data into decoded event
   */
  parseLog(log: {
    topics: string[];
    data: Uint8Array;
  }): { name: string; args: Record<string, unknown> } | null {
    const eventTopic = log.topics[0];
    if (!eventTopic) return null;

    // Find matching event in ABI
    const abiItems = (this.abi as unknown as { items: AbiItem[] }).items;
    const event = abiItems?.find((item: AbiItem) => {
      if (item.type !== "event") return false;
      const sig = `${item.name}(${item.inputs.map((i) => i.type).join(",")})`;
      const hash = Keccak256.hash(new TextEncoder().encode(sig));
      return Hex.fromBytes(hash) === eventTopic;
    });

    if (!event || event.type !== "event") return null;

    // Decode indexed and non-indexed params
    const args: Record<string, unknown> = {};
    let topicIndex = 1;
    let dataOffset = 0;

    for (const input of event.inputs) {
      if (input.indexed) {
        // Indexed params are in topics
        const topic = log.topics[topicIndex];
        if (topic) {
          if (input.type === "address") {
            args[input.name] = Address(`0x${topic.slice(26)}`, {
              keccak256: Keccak256.hash,
            });
          } else if (input.type.startsWith("uint") || input.type.startsWith("int")) {
            args[input.name] = BigInt(topic);
          } else {
            args[input.name] = topic;
          }
        }
        topicIndex++;
      } else {
        // Non-indexed params are in data
        const chunk = log.data.slice(dataOffset, dataOffset + 32);
        if (input.type.startsWith("uint") || input.type.startsWith("int")) {
          let value = 0n;
          for (const byte of chunk) {
            value = (value << 8n) | BigInt(byte);
          }
          args[input.name] = value;
        } else if (input.type === "address") {
          args[input.name] = Address.fromBytes(chunk.slice(12));
        } else if (input.type === "bool") {
          args[input.name] = chunk[31] === 1;
        }
        dataOffset += 32;
      }
    }

    return { name: event.name, args };
  }

  /**
   * Get historical events
   */
  async getEvents(
    eventName: string,
    options: {
      fromBlock?: bigint;
      toBlock?: bigint;
    } = {}
  ): Promise<Array<{ name: string; args: Record<string, unknown>; blockNumber: bigint; transactionHash: string }>> {
    const topic = this.getEventTopic(eventName);

    const logs = await this.provider.getLogs({
      address: this.address,
      topics: [topic],
      fromBlock: options.fromBlock,
      toBlock: options.toBlock,
    });

    return logs
      .map((log) => {
        const parsed = this.parseLog(log);
        if (!parsed) return null;
        return {
          ...parsed,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }
}

/**
 * Factory function for creating Contract instances
 */
export function createContract<T extends readonly AbiItem[]>(params: {
  address: string | AddressType;
  abi: T;
  provider: BrowserProvider;
}): Contract<T> {
  return new Contract(params);
}
