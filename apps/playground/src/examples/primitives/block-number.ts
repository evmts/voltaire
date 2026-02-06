import { BlockNumber } from "@tevm/voltaire";
// Example: BlockNumber basics - creation, conversion, comparison

// Create from number
const currentBlock = BlockNumber(21000000);
const recentBlock = BlockNumber(20999950);
const genesis = BlockNumber(0);

// Create from bigint (for large block numbers)
const futureBlock = BlockNumber(100000000n);
const veryLargeBlock = BlockNumber(999999999999n);

// Block arithmetic (using bigint operations)
const blockA = BlockNumber(15000000);
const blockB = BlockNumber(14000000);
const blockDiff = BlockNumber.toBigInt(blockA) - BlockNumber.toBigInt(blockB);

// Important mainnet milestones
const homestead = BlockNumber(1150000); // Homestead fork
const dao = BlockNumber(1920000); // DAO fork
const byzantium = BlockNumber(4370000); // Byzantium
const london = BlockNumber(12965000); // EIP-1559
const merge = BlockNumber(15537394); // The Merge (Paris)
const shanghai = BlockNumber(17034870); // Withdrawals
const cancun = BlockNumber(19426587); // Dencun (EIP-4844)
