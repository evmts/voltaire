import { serializeLegacy } from "../../../src/primitives/transaction.js";
import { legacyTransaction } from "../test-data.js";

export function main(): void {
	serializeLegacy(legacyTransaction);
}
