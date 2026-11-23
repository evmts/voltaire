import { runBenchSuite } from "../../bench-harness.js";
import * as Int32 from "./index.js";

const a = Int32.from(-123456789);
const b = Int32.from(98765432);

await runBenchSuite("voltaire-ts:Int32", [
	{ name: "Int32.from", fn: () => Int32.from(-123456789) },
	{ name: "Int32.plus", fn: () => Int32.plus(a, b) },
	{ name: "Int32.abs", fn: () => Int32.abs(a) },
	{ name: "Int32.toHex", fn: () => Int32.toHex(a) },
]);
