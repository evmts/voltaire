import { runBenchSuite } from "../../bench-harness.js";
import * as Paymaster from "./index.js";

const hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const pm = Paymaster.Paymaster.from(hex);

await runBenchSuite("voltaire-ts:Paymaster", [
	{ name: "Paymaster.from", fn: () => Paymaster.Paymaster.from(hex) },
	{ name: "Paymaster.toHex", fn: () => Paymaster.toHex(pm) },
	{ name: "Paymaster.equals", fn: () => Paymaster.equals(pm, pm) },
]);
