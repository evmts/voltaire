import { BlockNumber } from "voltaire";
// Small block numbers (recent transactions)
const block1 = BlockNumber.from(100);
const block2 = BlockNumber.from(1000);
const block3 = BlockNumber.from(10000);

// Current mainnet blocks (~21M range)
const currentRange = BlockNumber.from(21234567);

// Safe integer limits in JavaScript
const maxSafeInt = BlockNumber.from(Number.MAX_SAFE_INTEGER);

// Very large block numbers (beyond safe integer range)
const largeBlock1 = BlockNumber.from(999999999999n);
const largeBlock2 = BlockNumber.from(1000000000000n);

// Edge case: zero (genesis)
const zeroBlock = BlockNumber.from(0n);

// Both number and bigint work for same value
const fromNum = BlockNumber.from(1000000);
const fromBig = BlockNumber.from(1000000n);
