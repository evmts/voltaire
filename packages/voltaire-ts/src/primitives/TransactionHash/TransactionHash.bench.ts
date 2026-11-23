import { runBenchSuite } from "../../bench-harness.js";
import * as TransactionHash from "./index.js";

const hex = `0x${"ab".repeat(32)}`;
const h = TransactionHash.fromHex(hex);

await runBenchSuite("voltaire-ts:TransactionHash", [
	{ name: "TransactionHash.fromHex", fn: () => TransactionHash.fromHex(hex) },
	{ name: "TransactionHash.toHex", fn: () => TransactionHash.toHex(h) },
	{ name: "TransactionHash.equals", fn: () => TransactionHash.equals(h, h) },
]);
