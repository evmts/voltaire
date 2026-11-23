import { runBenchSuite } from "../../bench-harness.js";
import * as TransactionIndex from "./index.js";

const idx = TransactionIndex.from(42);

await runBenchSuite("voltaire-ts:TransactionIndex", [
	{ name: "TransactionIndex.from", fn: () => TransactionIndex.from(42) },
	{
		name: "TransactionIndex.toNumber",
		fn: () => TransactionIndex.toNumber(idx),
	},
	{
		name: "TransactionIndex.equals",
		fn: () => TransactionIndex.equals(idx, idx),
	},
]);
