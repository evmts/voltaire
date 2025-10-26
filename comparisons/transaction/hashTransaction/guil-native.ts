import { hashTransaction } from "../../../native/primitives/transaction.js";
import {
	eip1559Transaction,
	eip7702Transaction,
	legacyTransaction,
} from "../test-data.js";

export function main(): void {
	hashTransaction(legacyTransaction);
	hashTransaction(eip1559Transaction);
	hashTransaction(eip7702Transaction);
}
