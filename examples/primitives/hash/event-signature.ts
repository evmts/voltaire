/**
 * Event Signature Example
 *
 * Demonstrates:
 * - Computing event signatures (topic0)
 * - Filtering logs by event type
 * - Decoding indexed parameters
 * - Working with common ERC standards
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

console.log("\n=== Event Signature Example ===\n");

// ============================================================
// Computing Event Signatures
// ============================================================

console.log("--- Computing Event Signatures ---\n");

// Event signatures are keccak256(eventName(param1Type,param2Type,...))
// The hash becomes topic0 in event logs

// ERC-20 Events
const transferSig = Hash.keccak256String("Transfer(address,address,uint256)");
const approvalSig = Hash.keccak256String("Approval(address,address,uint256)");

console.log("ERC-20 Transfer:", transferSig.toHex());
console.log("ERC-20 Approval:", approvalSig.toHex());

// ERC-721 Events
const nftTransferSig = Hash.keccak256String("Transfer(address,address,uint256)"); // Same as ERC-20
const nftApprovalSig = Hash.keccak256String("Approval(address,address,uint256)"); // Same as ERC-20
const approvalForAllSig = Hash.keccak256String("ApprovalForAll(address,address,bool)");

console.log("\nERC-721 ApprovalForAll:", approvalForAllSig.toHex());

// ERC-1155 Events
const transferSingleSig = Hash.keccak256String("TransferSingle(address,address,address,uint256,uint256)");
const transferBatchSig = Hash.keccak256String("TransferBatch(address,address,address,uint256[],uint256[])");

console.log("\nERC-1155 TransferSingle:", transferSingleSig.toHex());
console.log("ERC-1155 TransferBatch:", transferBatchSig.toHex());

// Custom Events
const depositSig = Hash.keccak256String("Deposit(address,uint256)");
const withdrawalSig = Hash.keccak256String("Withdrawal(address,uint256)");
const swapSig = Hash.keccak256String("Swap(address,uint256,uint256,uint256,uint256,address)");

console.log("\nCustom Deposit:", depositSig.toHex());
console.log("Custom Withdrawal:", withdrawalSig.toHex());
console.log("Custom Swap:", swapSig.toHex());

// ============================================================
// Event Log Structure
// ============================================================

console.log("\n--- Event Log Structure ---\n");

interface EventLog {
  address: string; // Contract address
  topics: string[]; // [topic0, indexed1, indexed2, indexed3]
  data: string; // Non-indexed parameters (ABI-encoded)
  blockNumber: number;
  transactionHash: string;
}

// Example Transfer event log
const transferLog: EventLog = {
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  topics: [
    transferSig.toHex(), // topic0 = event signature
    "0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", // from (indexed)
    "0x00000000000000000000000028c6c06298d514db089934071355e5743bf21d60", // to (indexed)
  ],
  data: "0x0000000000000000000000000000000000000000000000000000000005f5e100", // value (not indexed)
  blockNumber: 18000000,
  transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
};

console.log("Example Transfer log:");
console.log("  Contract:", transferLog.address);
console.log("  Topic0:", Hash.fromHex(transferLog.topics[0]).format());
console.log("  From:", transferLog.topics[1]);
console.log("  To:", transferLog.topics[2]);
console.log("  Value (data):", transferLog.data);

// ============================================================
// Filtering Logs by Event Type
// ============================================================

console.log("\n--- Filtering Logs by Event Type ---\n");

function isTransferEvent(log: EventLog): boolean {
  if (log.topics.length === 0) return false;
  const topic0 = Hash.fromHex(log.topics[0]);
  return topic0.equals(transferSig);
}

function isApprovalEvent(log: EventLog): boolean {
  if (log.topics.length === 0) return false;
  const topic0 = Hash.fromHex(log.topics[0]);
  return topic0.equals(approvalSig);
}

function isDepositEvent(log: EventLog): boolean {
  if (log.topics.length === 0) return false;
  const topic0 = Hash.fromHex(log.topics[0]);
  return topic0.equals(depositSig);
}

// Sample logs
const sampleLogs: EventLog[] = [
  { ...transferLog, topics: [transferSig.toHex(), "0x...", "0x..."] },
  { ...transferLog, topics: [approvalSig.toHex(), "0x...", "0x..."] },
  { ...transferLog, topics: [depositSig.toHex(), "0x..."] },
  { ...transferLog, topics: [transferSig.toHex(), "0x...", "0x..."] },
];

const transfers = sampleLogs.filter(isTransferEvent);
const approvals = sampleLogs.filter(isApprovalEvent);
const deposits = sampleLogs.filter(isDepositEvent);

console.log(`Total logs: ${sampleLogs.length}`);
console.log(`Transfers: ${transfers.length}`);
console.log(`Approvals: ${approvals.length}`);
console.log(`Deposits: ${deposits.length}`);

// ============================================================
// Multi-Event Filter
// ============================================================

console.log("\n--- Multi-Event Filter ---\n");

type EventType = "Transfer" | "Approval" | "Deposit" | "Unknown";

function getEventType(log: EventLog): EventType {
  if (log.topics.length === 0) return "Unknown";

  const topic0 = Hash.fromHex(log.topics[0]);

  if (topic0.equals(transferSig)) return "Transfer";
  if (topic0.equals(approvalSig)) return "Approval";
  if (topic0.equals(depositSig)) return "Deposit";

  return "Unknown";
}

console.log("Event types:");
sampleLogs.forEach((log, i) => {
  const type = getEventType(log);
  console.log(`  Log ${i + 1}: ${type}`);
});

// ============================================================
// Building Event Signature Registry
// ============================================================

console.log("\n--- Event Signature Registry ---\n");

interface EventInfo {
  name: string;
  signature: string;
  topic0: Hash;
}

class EventRegistry {
  private events = new Map<string, EventInfo>();

  register(signature: string): void {
    const topic0 = Hash.keccak256String(signature);
    const name = signature.split("(")[0];

    this.events.set(topic0.toHex(), {
      name,
      signature,
      topic0,
    });
  }

  lookup(topic0: string): EventInfo | undefined {
    return this.events.get(topic0);
  }

  lookupByHash(hash: Hash): EventInfo | undefined {
    return this.events.get(hash.toHex());
  }
}

// Build registry
const registry = new EventRegistry();
registry.register("Transfer(address,address,uint256)");
registry.register("Approval(address,address,uint256)");
registry.register("Deposit(address,uint256)");
registry.register("Withdrawal(address,uint256)");
registry.register("Swap(address,uint256,uint256,uint256,uint256,address)");

// Lookup events
console.log("Registry lookups:");
sampleLogs.forEach((log, i) => {
  const event = registry.lookup(log.topics[0]);
  if (event) {
    console.log(`  Log ${i + 1}: ${event.name} (${event.signature})`);
  } else {
    console.log(`  Log ${i + 1}: Unknown event`);
  }
});

// ============================================================
// Event Signature Verification
// ============================================================

console.log("\n--- Event Signature Verification ---\n");

function verifyEventSignature(signature: string, expectedHash: string): boolean {
  const computed = Hash.keccak256String(signature);
  const expected = Hash.fromHex(expectedHash);
  return computed.equals(expected);
}

// Known Transfer event hash
const knownTransferHash = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const isValid = verifyEventSignature("Transfer(address,address,uint256)", knownTransferHash);
console.log(`Transfer signature verification: ${isValid ? "PASS" : "FAIL"}`);

// ============================================================
// Anonymous Events (No topic0)
// ============================================================

console.log("\n--- Anonymous Events ---\n");

// Anonymous events don't include event signature in topics
// event Anonymous(address indexed user, uint256 value) anonymous;

console.log("Anonymous events:");
console.log("  - Don't include event signature in topics");
console.log("  - Can have up to 4 indexed parameters (vs 3 for regular events)");
console.log("  - Harder to filter (need to rely on contract address + topics)");
console.log("  - More gas efficient (saves 375 gas by not storing topic0)");

// ============================================================
// Computing All ERC-20 Event Signatures
// ============================================================

console.log("\n--- ERC-20 Event Signatures ---\n");

const erc20Events = [
  "Transfer(address,address,uint256)",
  "Approval(address,address,uint256)",
];

console.log("ERC-20 event hashes:");
erc20Events.forEach(sig => {
  const hash = Hash.keccak256String(sig);
  console.log(`  ${sig}`);
  console.log(`    ${hash.toHex()}`);
});

// ============================================================
// Using Event Signatures in Web3 Queries
// ============================================================

console.log("\n--- Web3 Query Example ---\n");

// Example: Get all Transfer events from a contract
interface GetLogsParams {
  fromBlock: number;
  toBlock: number;
  address: string; // Contract address
  topics: (string | null)[]; // Filter by topics
}

const transferQuery: GetLogsParams = {
  fromBlock: 18000000,
  toBlock: 18001000,
  address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  topics: [
    transferSig.toHex(), // topic0 = Transfer event
    null, // from (any address)
    null, // to (any address)
  ],
};

console.log("Transfer query:");
console.log(`  Contract: ${transferQuery.address}`);
console.log(`  Blocks: ${transferQuery.fromBlock} - ${transferQuery.toBlock}`);
console.log(`  Topic0: ${Hash.fromHex(transferQuery.topics[0]!).format()}`);

// Query for specific from address
const specificFromQuery: GetLogsParams = {
  ...transferQuery,
  topics: [
    transferSig.toHex(),
    "0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e", // specific from
    null, // any to
  ],
};

console.log("\nSpecific from query:");
console.log(`  From: ${specificFromQuery.topics[1]}`);

console.log("\n=== Example Complete ===\n");
