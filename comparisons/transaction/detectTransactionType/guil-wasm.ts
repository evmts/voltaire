import { detectTransactionType } from "../../../wasm/primitives/transaction.js";
import {
	serializedEip1559Tx,
	serializedEip7702Tx,
	serializedLegacyTx,
} from "../test-data.js";

export function main(): void {
	detectTransactionType(serializedLegacyTx);
	detectTransactionType(serializedEip1559Tx);
	detectTransactionType(serializedEip7702Tx);
}
