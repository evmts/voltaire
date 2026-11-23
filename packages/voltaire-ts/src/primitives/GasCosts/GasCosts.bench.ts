import { runBenchSuite } from "../../bench-harness.js";
import * as GasCosts from "./index.js";

await runBenchSuite("voltaire-ts:GasCosts", [
	{
		name: "GasCosts.lookup",
		fn: () => GasCosts.GAS_COSTS.TRANSACTION + GasCosts.GAS_COSTS.SLOAD,
	},
]);
