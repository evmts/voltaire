import { runBenchSuite } from "../../bench-harness.js";
import * as BlockHash from "./index.js";

const hex = `0x${"cd".repeat(32)}`;
const h = BlockHash.fromHex(hex);

await runBenchSuite("voltaire-ts:BlockHash", [
	{ name: "BlockHash.fromHex", fn: () => BlockHash.fromHex(hex) },
	{ name: "BlockHash.toHex", fn: () => BlockHash.toHex(h) },
	{ name: "BlockHash.equals", fn: () => BlockHash.equals(h, h) },
]);
