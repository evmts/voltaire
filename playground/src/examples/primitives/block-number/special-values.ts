import { BlockNumber } from "@tevm/voltaire";
// Genesis block - the beginning of the chain
const genesis = BlockNumber(0);

// In Ethereum JSON-RPC, special strings are used for block parameters:
// - "latest": Most recent block
// - "earliest": Genesis block (0)
// - "pending": Pending block being mined
// - "safe": Most recent safe block (post-Merge)
// - "finalized": Most recent finalized block (post-Merge)

// When using numeric block numbers instead of tags:
const latestBlock = BlockNumber(21000000); // Example: current latest
const earliestBlock = BlockNumber(0); // Always genesis
const safeDept = BlockNumber(32); // Safe blocks are typically ~32 blocks behind

// Post-Merge concepts (Proof of Stake)
const current = BlockNumber(21000000);
const safeDepth = 32n; // Approximately 6-7 minutes
const finalizedDepth = 64n; // Approximately 12-13 minutes

const safeBlock = BlockNumber(BlockNumber.toBigInt(current) - safeDepth);
const finalizedBlock = BlockNumber(
	BlockNumber.toBigInt(current) - finalizedDepth,
);

// Different applications require different safety guarantees
const INSTANT_CONFIRMATIONS = 1n; // High risk
const STANDARD_CONFIRMATIONS = 12n; // ~2-3 minutes
const EXCHANGE_CONFIRMATIONS = 35n; // ~7 minutes (Coinbase, Binance)
const HIGH_VALUE_CONFIRMATIONS = 64n; // ~13 minutes (finalized)

const tip = BlockNumber(20000000);

// Maximum safe block number (in practice, limited by time)
// Year 2100 estimate: ~20 billion blocks (assuming 12s blocks)
const year2100Estimate = BlockNumber(20000000000n);

// Far future theoretical maximum (bigint supports arbitrary precision)
const farFuture = BlockNumber(999999999999999n);

// Zero is valid (genesis)
const zero = BlockNumber(0n);

// Historical analysis
const historicalBlock = BlockNumber(15537394); // The Merge

// Current state queries
const currentState = BlockNumber(21000000);

// Future projections
const futureProjection = BlockNumber(25000000);
