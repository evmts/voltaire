import { parseTransaction } from "../../../native/primitives/transaction.js";
import {
	serializedEip1559Tx,
	serializedEip7702Tx,
	serializedLegacyTx,
} from "../test-data.js";

// Parse all transaction types
export function main(): void {
	parseTransaction(serializedLegacyTx);
	parseTransaction(serializedEip1559Tx);
	parseTransaction(serializedEip7702Tx);
}
