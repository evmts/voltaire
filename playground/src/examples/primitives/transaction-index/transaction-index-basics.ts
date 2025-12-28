import { TransactionIndex } from "voltaire";
// Example: TransactionIndex basics

// Create transaction indexes
const firstTx = TransactionIndex.from(0);
const secondTx = TransactionIndex.from(1);
const lastTx = TransactionIndex.from(149); // Block with 150 transactions

// Real block examples - Ethereum mainnet block 18500000 had 172 transactions
const block18500000FirstTx = TransactionIndex.from(0);
const block18500000MidTx = TransactionIndex.from(85);
const block18500000LastTx = TransactionIndex.from(171);
const idx1 = TransactionIndex.from(42);
const idx2 = TransactionIndex.from(42);
const idx3 = TransactionIndex.from(43);
const targetIdx = TransactionIndex.from(50);
const rangeStart = TransactionIndex.from(0);
const rangeEnd = TransactionIndex.from(100);
const inRange =
	TransactionIndex.toNumber(targetIdx) >=
		TransactionIndex.toNumber(rangeStart) &&
	TransactionIndex.toNumber(targetIdx) <= TransactionIndex.toNumber(rangeEnd);
const early = TransactionIndex.from(10);
const late = TransactionIndex.from(100);
const fromBigInt = TransactionIndex.from(123n);
