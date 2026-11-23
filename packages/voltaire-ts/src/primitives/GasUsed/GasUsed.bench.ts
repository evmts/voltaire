import { runBenchSuite } from "../../bench-harness.js";
import * as GasUsed from "./index.js";

const g = GasUsed.GasUsed.from(50000n);

await runBenchSuite("voltaire-ts:GasUsed", [
	{ name: "GasUsed.from", fn: () => GasUsed.GasUsed.from(50000n) },
	{
		name: "GasUsed.calculateCost",
		fn: () => GasUsed.calculateCost(g, 20_000_000_000n),
	},
	{ name: "GasUsed.toHex", fn: () => GasUsed.toHex(g) },
]);
