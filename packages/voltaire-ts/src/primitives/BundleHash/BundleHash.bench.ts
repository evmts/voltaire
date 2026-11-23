import { runBenchSuite } from "../../bench-harness.js";
import * as BundleHash from "./index.js";

const hex = `0x${"ef".repeat(32)}`;
const h = BundleHash.fromHex(hex);

await runBenchSuite("voltaire-ts:BundleHash", [
	{ name: "BundleHash.fromHex", fn: () => BundleHash.fromHex(hex) },
	{ name: "BundleHash.toHex", fn: () => BundleHash.toHex(h) },
	{ name: "BundleHash.equals", fn: () => BundleHash.equals(h, h) },
]);
