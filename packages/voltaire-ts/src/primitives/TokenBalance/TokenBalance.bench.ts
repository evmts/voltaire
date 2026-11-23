import { runBenchSuite } from "../../bench-harness.js";
import * as TokenBalance from "./index.js";

const bal = TokenBalance.from(1_000_000_000_000_000_000n);

await runBenchSuite("voltaire-ts:TokenBalance", [
	{
		name: "TokenBalance.from",
		fn: () => TokenBalance.from(1_000_000_000_000_000_000n),
	},
	{ name: "TokenBalance.toHex", fn: () => TokenBalance.toHex(bal) },
	{ name: "TokenBalance.format", fn: () => TokenBalance.format(bal, 18) },
]);
