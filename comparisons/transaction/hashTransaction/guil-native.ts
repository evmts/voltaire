import { hashTransaction } from "../../../native/primitives/transaction.js";
import {
	legacyTransaction,
	eip1559Transaction,
	eip7702Transaction,
} from "../test-data.js";

export function main(): void {
	hashTransaction(legacyTransaction);
	hashTransaction(eip1559Transaction);
	hashTransaction(eip7702Transaction);
}
