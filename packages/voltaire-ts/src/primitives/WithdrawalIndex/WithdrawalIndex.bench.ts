import { runBenchSuite } from "../../bench-harness.js";
import { WithdrawalIndex } from "./index.js";

const idx = WithdrawalIndex.from(12345n);

await runBenchSuite("voltaire-ts:WithdrawalIndex", [
	{ name: "WithdrawalIndex.from", fn: () => WithdrawalIndex.from(12345n) },
	{ name: "WithdrawalIndex.toNumber", fn: () => WithdrawalIndex.toNumber(idx) },
	{
		name: "WithdrawalIndex.equals",
		fn: () => WithdrawalIndex.equals(idx, idx),
	},
]);
