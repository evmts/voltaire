/**
 * Ethereum event log structures and utilities
 */

export interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: bigint;
  transactionHash?: string;
  transactionIndex?: number;
  blockHash?: string;
  logIndex?: number;
  removed?: boolean;
}

export interface EventSignature {
  name: string;
  inputs: EventInput[];
}

export interface EventInput {
  name: string;
  type: string;
  indexed: boolean;
}

export interface DecodedLog {
  eventName: string;
  args: Record<string, any>;
  address: string;
}

/**
 * Parse an event log with a given signature
 * @param log - The event log
 * @param signature - The event signature
 * @returns Decoded log
 */
export function parseEventLog(log: EventLog, signature: EventSignature): DecodedLog {
  const args: Record<string, any> = {};

  // Extract indexed parameters from topics (skip topic0 which is event signature)
  let topicIndex = 1;
  for (const input of signature.inputs) {
    if (input.indexed) {
      if (topicIndex < log.topics.length) {
        args[input.name] = log.topics[topicIndex];
        topicIndex++;
      }
    }
  }

  // For simplicity, store data as-is for non-indexed parameters
  // Full implementation would decode based on types
  const nonIndexedInputs = signature.inputs.filter(i => !i.indexed);
  if (nonIndexedInputs.length > 0) {
    args["_data"] = log.data;
  }

  return {
    eventName: signature.name,
    args,
    address: log.address,
  };
}

/**
 * Filter logs by topics
 * @param logs - Array of logs
 * @param topics - Topics to filter by (null matches any)
 * @returns Filtered logs
 */
export function filterLogsByTopics(logs: EventLog[], topics: (string | null)[]): EventLog[] {
  return logs.filter(log => {
    for (let i = 0; i < topics.length; i++) {
      const filterTopic = topics[i];
      if (filterTopic === null) {
        continue;
      }
      if (i >= log.topics.length || log.topics[i] !== filterTopic) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Create event signature hash (topic0)
 * @param signature - Event signature string (e.g., "Transfer(address,address,uint256)")
 * @returns Keccak256 hash of signature
 */
export function createEventSignatureHash(signature: string): string {
  // This would use keccak256 in real implementation
  // For now, return a placeholder
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);

  // Simple hash placeholder - real implementation would use keccak256
  let hash = "0x";
  for (let i = 0; i < 32; i++) {
    const byte = data[i % data.length] ^ (i * 7);
    hash += byte.toString(16).padStart(2, "0");
  }

  return hash;
}

/**
 * Encode indexed parameter for topic
 * @param value - The value to encode
 * @param type - The parameter type
 * @returns Encoded topic as hex string
 */
export function encodeIndexedParameter(value: any, type: string): string {
  // Simplified implementation
  if (typeof value === "string" && value.startsWith("0x")) {
    return value.padEnd(66, "0"); // Pad to 32 bytes
  }

  if (typeof value === "number" || typeof value === "bigint") {
    const hex = value.toString(16).padStart(64, "0");
    return "0x" + hex;
  }

  // Convert to string and pad
  const str = String(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let hex = "0x";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex.padEnd(66, "0");
}
