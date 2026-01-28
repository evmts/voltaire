/**
 * @module toRpc
 * @description Convert EventLog to RPC format
 * @since 0.1.0
 */
import type { EventLogType } from "@tevm/voltaire/EventLog";
import * as Hex from "@tevm/voltaire/Hex";

interface RpcLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: string;
  transactionHash?: string;
  transactionIndex?: string;
  blockHash?: string;
  logIndex?: string;
  removed?: boolean;
}

/**
 * Convert EventLog to RPC response format
 */
export const toRpc = (log: EventLogType): RpcLog => {
  const result: RpcLog = {
    address: Hex.fromBytes(log.address),
    topics: log.topics.map((t) => Hex.fromBytes(t)),
    data: Hex.fromBytes(log.data),
  };
  if (log.blockNumber !== undefined) {
    result.blockNumber = `0x${log.blockNumber.toString(16)}`;
  }
  if (log.transactionHash !== undefined) {
    result.transactionHash = Hex.fromBytes(log.transactionHash);
  }
  if (log.transactionIndex !== undefined) {
    result.transactionIndex = `0x${log.transactionIndex.toString(16)}`;
  }
  if (log.blockHash !== undefined) {
    result.blockHash = Hex.fromBytes(log.blockHash);
  }
  if (log.logIndex !== undefined) {
    result.logIndex = `0x${log.logIndex.toString(16)}`;
  }
  if (log.removed !== undefined) {
    result.removed = log.removed;
  }
  return result;
};
