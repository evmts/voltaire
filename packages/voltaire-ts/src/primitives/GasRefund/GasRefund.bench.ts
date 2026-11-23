import { runBenchSuite } from "../../bench-harness.js";
import * as GasRefund from "./index.js";

const r = GasRefund.GasRefund.from(15000n);

await runBenchSuite("voltaire-ts:GasRefund", [
	{ name: "GasRefund.from", fn: () => GasRefund.GasRefund.from(15000n) },
	{
		name: "GasRefund.cappedRefund",
		fn: () => GasRefund.cappedRefund(r, 100000n),
	},
	{ name: "GasRefund.toHex", fn: () => GasRefund.toHex(r) },
]);
