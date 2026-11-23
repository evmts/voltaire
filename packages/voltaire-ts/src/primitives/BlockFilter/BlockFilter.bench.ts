import { runBenchSuite } from "../../bench-harness.js";
import * as FilterId from "../FilterId/index.js";
import * as BlockFilter from "./index.js";

const id = FilterId.from("0x1");

await runBenchSuite("voltaire-ts:BlockFilter", [
	{ name: "BlockFilter.from", fn: () => BlockFilter.from(id) },
]);
