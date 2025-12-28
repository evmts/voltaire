import { InvalidTransactionIndexError } from "voltaire";
import { TransactionIndex } from "voltaire";

const validIndexes = [0, 1, 100, 1000, 10000];
validIndexes.forEach((num) => {
	try {
		const idx = TransactionIndex.from(num);
	} catch (error) {}
});
const validBigInts = [0n, 1n, 100n, 1000n];
validBigInts.forEach((num) => {
	try {
		const idx = TransactionIndex.from(num);
	} catch (error) {}
});
const negatives = [-1, -10, -100];
negatives.forEach((num) => {
	try {
		TransactionIndex.from(num);
	} catch (error) {
		if (error instanceof InvalidTransactionIndexError) {
		}
	}
});
const nonIntegers = [1.5, 3.14, 0.1];
nonIntegers.forEach((num) => {
	try {
		TransactionIndex.from(num);
	} catch (error) {
		if (error instanceof InvalidTransactionIndexError) {
		}
	}
});
const wrongTypes = ["42", null, undefined, {}, []];
wrongTypes.forEach((val) => {
	try {
		// @ts-expect-error - testing invalid types
		TransactionIndex.from(val);
	} catch (error) {
		if (error instanceof InvalidTransactionIndexError) {
		}
	}
});
function isValidInBlock(
	idx: ReturnType<typeof TransactionIndex.from>,
	blockSize: number,
): boolean {
	return TransactionIndex.toNumber(idx) < blockSize;
}

const blockSize = 100;
const testIndexes = [0, 50, 99, 100, 150].map((n) => TransactionIndex.from(n));
testIndexes.forEach((idx) => {
	const num = TransactionIndex.toNumber(idx);
	const valid = isValidInBlock(idx, blockSize);
});
function safeCreateIndex(
	value: unknown,
): ReturnType<typeof TransactionIndex.from> | null {
	try {
		return TransactionIndex.from(value as number);
	} catch (error) {
		if (error instanceof InvalidTransactionIndexError) {
			return null;
		}
		throw error;
	}
}

const testValues = [0, -1, 42, 3.14, "100"];
testValues.forEach((val) => {
	const result = safeCreateIndex(val);
	if (result) {
	} else {
	}
});
interface TransactionResponse {
	transactionIndex: string | number;
}

const responses: TransactionResponse[] = [
	{ transactionIndex: "0x0" },
	{ transactionIndex: "0x2a" },
	{ transactionIndex: 42 },
];

responses.forEach((resp, i) => {
	try {
		const parsed =
			typeof resp.transactionIndex === "string"
				? Number.parseInt(resp.transactionIndex, 16)
				: resp.transactionIndex;
		const idx = TransactionIndex.from(parsed);
	} catch (error) {}
});
