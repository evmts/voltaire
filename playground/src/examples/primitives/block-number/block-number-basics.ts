import { BlockNumber } from "voltaire";
// Example: BlockNumber basics - creation, conversion, comparison

// Create from number
const currentBlock = BlockNumber.from(21000000);
const recentBlock = BlockNumber.from(20999950);
const genesis = BlockNumber.from(0);

// Create from bigint (for large block numbers)
const futureBlock = BlockNumber.from(100000000n);
const veryLargeBlock = BlockNumber.from(999999999999n);

// Block arithmetic (using bigint operations)
const blockA = BlockNumber.from(15000000);
const blockB = BlockNumber.from(14000000);
const blockDiff = BlockNumber.toBigInt(blockA) - BlockNumber.toBigInt(blockB);

// Important mainnet milestones
const homestead = BlockNumber.from(1150000); // Homestead fork
const dao = BlockNumber.from(1920000); // DAO fork
const byzantium = BlockNumber.from(4370000); // Byzantium
const london = BlockNumber.from(12965000); // EIP-1559
const merge = BlockNumber.from(15537394); // The Merge (Paris)
const shanghai = BlockNumber.from(17034870); // Withdrawals
const cancun = BlockNumber.from(19426587); // Dencun (EIP-4844)
