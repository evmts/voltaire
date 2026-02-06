import { TransactionIndex } from "@tevm/voltaire";
// Example: TransactionIndex basics

// Create transaction indexes
const firstTx = TransactionIndex(0);
const secondTx = TransactionIndex(1);
const lastTx = TransactionIndex(149); // Block with 150 transactions

// Real block examples - Ethereum mainnet block 18500000 had 172 transactions
const block18500000FirstTx = TransactionIndex(0);
const block18500000MidTx = TransactionIndex(85);
const block18500000LastTx = TransactionIndex(171);
const idx1 = TransactionIndex(42);
const idx2 = TransactionIndex(42);
const idx3 = TransactionIndex(43);
const targetIdx = TransactionIndex(50);
const rangeStart = TransactionIndex(0);
const rangeEnd = TransactionIndex(100);
const inRange =
	TransactionIndex.toNumber(targetIdx) >=
		TransactionIndex.toNumber(rangeStart) &&
	TransactionIndex.toNumber(targetIdx) <= TransactionIndex.toNumber(rangeEnd);
const early = TransactionIndex(10);
const late = TransactionIndex(100);
const fromBigInt = TransactionIndex(123n);
