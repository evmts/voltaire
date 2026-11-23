import { runBenchSuite } from "../../bench-harness.js";
import * as GasEstimate from "./index.js";

const g = GasEstimate.GasEstimate.from(21000n);

await runBenchSuite("voltaire-ts:GasEstimate", [
	{ name: "GasEstimate.from", fn: () => GasEstimate.GasEstimate.from(21000n) },
	{
		name: "GasEstimate.withBuffer(20%)",
		fn: () => GasEstimate.withBuffer(g, 20),
	},
	{ name: "GasEstimate.toHex", fn: () => GasEstimate.toHex(g) },
]);
