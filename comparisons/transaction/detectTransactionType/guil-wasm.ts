import { detectTransactionType } from "../../../wasm/primitives/transaction.js";
import {
	serializedLegacyTx,
	serializedEip1559Tx,
	serializedEip7702Tx,
} from "../test-data.js";

export function main(): void {
	detectTransactionType(serializedLegacyTx);
	detectTransactionType(serializedEip1559Tx);
	detectTransactionType(serializedEip7702Tx);
}
