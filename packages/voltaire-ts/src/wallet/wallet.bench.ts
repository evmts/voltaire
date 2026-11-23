import { runBenchSuite } from "../bench-harness.js";
import { randomAddress } from "./randomAddress.js";

await runBenchSuite("voltaire-ts:wallet", [
	{ name: "randomAddress", fn: () => randomAddress() },
]);
