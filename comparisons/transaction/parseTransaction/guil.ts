import { parseTransaction } from "../../../src/primitives/transaction.js";
import {
	serializedLegacyTx,
	serializedEip1559Tx,
	serializedEip7702Tx,
} from "../test-data.js";

// Parse all transaction types
export function main(): void {
	parseTransaction(serializedLegacyTx);
	parseTransaction(serializedEip1559Tx);
	parseTransaction(serializedEip7702Tx);
}
