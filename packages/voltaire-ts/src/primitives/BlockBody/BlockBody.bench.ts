import { runBenchSuite } from "../../bench-harness.js";
import * as BlockBody from "./index.js";

await runBenchSuite("voltaire-ts:BlockBody", [
	{
		name: "BlockBody.from (empty)",
		fn: () => BlockBody.from({ transactions: [], ommers: [], withdrawals: [] }),
	},
]);
