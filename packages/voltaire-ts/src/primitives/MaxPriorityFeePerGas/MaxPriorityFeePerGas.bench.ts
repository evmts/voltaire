import { runBenchSuite } from "../../bench-harness.js";
import * as MaxPriorityFeePerGas from "./index.js";

const fee = MaxPriorityFeePerGas.MaxPriorityFeePerGas.fromGwei(2n);

await runBenchSuite("voltaire-ts:MaxPriorityFeePerGas", [
	{
		name: "MaxPriorityFeePerGas.fromGwei",
		fn: () => MaxPriorityFeePerGas.MaxPriorityFeePerGas.fromGwei(2n),
	},
	{
		name: "MaxPriorityFeePerGas.toGwei",
		fn: () => MaxPriorityFeePerGas.toGwei(fee),
	},
	{
		name: "MaxPriorityFeePerGas.toWei",
		fn: () => MaxPriorityFeePerGas.toWei(fee),
	},
]);
