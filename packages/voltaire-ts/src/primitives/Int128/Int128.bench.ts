import { runBenchSuite } from "../../bench-harness.js";
import { Int128 } from "./index.js";

const a = Int128.from(-1_000_000_000_000_000_000n);
const b = Int128.from(42_000_000_000n);

await runBenchSuite("voltaire-ts:Int128", [
	{ name: "Int128.from", fn: () => Int128.from(-1_000_000_000_000_000_000n) },
	{ name: "Int128.plus", fn: () => Int128.plus(a, b) },
	{ name: "Int128.abs", fn: () => Int128.abs(a) },
	{ name: "Int128.toHex", fn: () => Int128.toHex(a) },
]);
