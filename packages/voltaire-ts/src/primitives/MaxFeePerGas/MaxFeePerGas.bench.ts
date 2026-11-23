import { runBenchSuite } from "../../bench-harness.js";
import * as MaxFeePerGas from "./index.js";

const fee = MaxFeePerGas.MaxFeePerGas.fromGwei(30n);

await runBenchSuite("voltaire-ts:MaxFeePerGas", [
	{
		name: "MaxFeePerGas.fromGwei",
		fn: () => MaxFeePerGas.MaxFeePerGas.fromGwei(30n),
	},
	{ name: "MaxFeePerGas.toGwei", fn: () => MaxFeePerGas.toGwei(fee) },
	{ name: "MaxFeePerGas.toWei", fn: () => MaxFeePerGas.toWei(fee) },
]);
