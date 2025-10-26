import { serializeEip1559 } from "../../../wasm/primitives/transaction.js";
import { eip1559Transaction } from "../test-data.js";

export function main(): void {
	serializeEip1559(eip1559Transaction);
}
