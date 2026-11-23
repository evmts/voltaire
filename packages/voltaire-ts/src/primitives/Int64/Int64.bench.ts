import { runBenchSuite } from "../../bench-harness.js";
import * as Int64 from "./index.js";

const a = Int64.from(-1_000_000_000_000n);
const b = Int64.from(42_000_000n);

await runBenchSuite("voltaire-ts:Int64", [
	{ name: "Int64.from", fn: () => Int64.from(-1_000_000_000_000n) },
	{ name: "Int64.plus", fn: () => Int64.plus(a, b) },
	{ name: "Int64.abs", fn: () => Int64.abs(a) },
	{ name: "Int64.toHex", fn: () => Int64.toHex(a) },
]);
