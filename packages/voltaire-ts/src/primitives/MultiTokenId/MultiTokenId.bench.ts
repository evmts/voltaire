import { runBenchSuite } from "../../bench-harness.js";
import * as MultiTokenId from "./index.js";

const id = MultiTokenId.from(123456n);

await runBenchSuite("voltaire-ts:MultiTokenId", [
	{ name: "MultiTokenId.from", fn: () => MultiTokenId.from(123456n) },
	{ name: "MultiTokenId.toHex", fn: () => MultiTokenId.toHex(id) },
	{ name: "MultiTokenId.equals", fn: () => MultiTokenId.equals(id, id) },
]);
