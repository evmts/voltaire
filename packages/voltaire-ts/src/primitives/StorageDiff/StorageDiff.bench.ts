import { runBenchSuite } from "../../bench-harness.js";
import * as Address from "../Address/index.js";
import * as StorageDiff from "./index.js";

const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
const diff = StorageDiff.from(addr, new Map());

await runBenchSuite("voltaire-ts:StorageDiff", [
	{ name: "StorageDiff.from", fn: () => StorageDiff.from(addr, new Map()) },
	{ name: "StorageDiff.size", fn: () => StorageDiff.size(diff) },
]);
