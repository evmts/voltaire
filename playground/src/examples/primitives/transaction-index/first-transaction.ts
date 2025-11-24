import * as TransactionIndex from "../../../primitives/TransactionIndex/index.js";
const firstTx = TransactionIndex.from(0);

// Block 18500000 (172 transactions)
const block18500000First = TransactionIndex.from(0);

// Block 18500001 (157 transactions)
const block18500001First = TransactionIndex.from(0);

// Block 18500002 (143 transactions)
const block18500002First = TransactionIndex.from(0);
const transactions = [
	TransactionIndex.from(0),
	TransactionIndex.from(1),
	TransactionIndex.from(50),
	TransactionIndex.from(100),
];

transactions.forEach((tx) => {
	const num = TransactionIndex.toNumber(tx);
	const isFirst = num === 0;
});
function isFirstTransaction(idx: typeof firstTx): boolean {
	return TransactionIndex.toNumber(idx) === 0;
}
