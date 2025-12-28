import { BlockNumber } from "@tevm/voltaire";
// Small block numbers (recent transactions)
const block1 = BlockNumber(100);
const block2 = BlockNumber(1000);
const block3 = BlockNumber(10000);

// Current mainnet blocks (~21M range)
const currentRange = BlockNumber(21234567);

// Safe integer limits in JavaScript
const maxSafeInt = BlockNumber(Number.MAX_SAFE_INTEGER);

// Very large block numbers (beyond safe integer range)
const largeBlock1 = BlockNumber(999999999999n);
const largeBlock2 = BlockNumber(1000000000000n);

// Edge case: zero (genesis)
const zeroBlock = BlockNumber(0n);

// Both number and bigint work for same value
const fromNum = BlockNumber(1000000);
const fromBig = BlockNumber(1000000n);
