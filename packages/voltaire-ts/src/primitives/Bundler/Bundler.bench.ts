import { runBenchSuite } from "../../bench-harness.js";
import * as Bundler from "./index.js";

const hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const b = Bundler.Bundler.from(hex);

await runBenchSuite("voltaire-ts:Bundler", [
	{ name: "Bundler.from", fn: () => Bundler.Bundler.from(hex) },
	{ name: "Bundler.toHex", fn: () => Bundler.toHex(b) },
	{ name: "Bundler.equals", fn: () => Bundler.equals(b, b) },
]);
