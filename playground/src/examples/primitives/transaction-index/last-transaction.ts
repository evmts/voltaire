import { TransactionIndex } from "voltaire";
const blockTxCount = 150;
const lastTx = TransactionIndex.from(blockTxCount - 1);

// Block 18500000: 172 transactions
const block18500000Last = TransactionIndex.from(171);

// Block 18500001: 157 transactions
const block18500001Last = TransactionIndex.from(156);

// Block 18500002: 143 transactions
const block18500002Last = TransactionIndex.from(142);
function isLastTransaction(idx: typeof lastTx, totalCount: number): boolean {
	return TransactionIndex.toNumber(idx) === totalCount - 1;
}

const testIdx = TransactionIndex.from(171);
const counts = [100, 200, 250, 300];
counts.forEach((count) => {
	const last = TransactionIndex.from(count - 1);
});
const blockSize = 200;
const positions = [0, 50, 150, 199];
positions.forEach((pos) => {
	const idx = TransactionIndex.from(pos);
	const fromEnd = blockSize - TransactionIndex.toNumber(idx);
});
