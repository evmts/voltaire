import { runBenchSuite } from "../../bench-harness.js";
import { byId, fromId } from "./index.js";

await runBenchSuite("voltaire-ts:Chain", [
	{ name: "Chain.fromId(1)", fn: () => fromId(1) },
	{ name: "Chain.fromId(10)", fn: () => fromId(10) },
	{ name: "Chain.byId[1]", fn: () => byId[1] },
]);
