import { runBenchSuite } from "../../bench-harness.js";
import * as FilterId from "../FilterId/index.js";
import * as PendingTransactionFilter from "./index.js";

const id = FilterId.from("0x1");

await runBenchSuite("voltaire-ts:PendingTransactionFilter", [
	{
		name: "PendingTransactionFilter.from",
		fn: () => PendingTransactionFilter.from(id),
	},
]);
