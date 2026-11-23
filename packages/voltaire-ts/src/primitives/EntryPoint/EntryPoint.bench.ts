import { runBenchSuite } from "../../bench-harness.js";
import * as EntryPoint from "./index.js";

const ep = EntryPoint.EntryPoint.from(EntryPoint.ENTRYPOINT_V07);

await runBenchSuite("voltaire-ts:EntryPoint", [
	{
		name: "EntryPoint.from",
		fn: () => EntryPoint.EntryPoint.from(EntryPoint.ENTRYPOINT_V07),
	},
	{ name: "EntryPoint.toHex", fn: () => EntryPoint.toHex(ep) },
	{ name: "EntryPoint.equals", fn: () => EntryPoint.equals(ep, ep) },
]);
