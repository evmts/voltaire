import { serializeEip7702 } from "../../../wasm/primitives/transaction.js";
import { eip7702Transaction } from "../test-data.js";

export function main(): void {
	serializeEip7702(eip7702Transaction);
}
