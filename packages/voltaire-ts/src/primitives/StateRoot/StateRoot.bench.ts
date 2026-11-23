import { runBenchSuite } from "../../bench-harness.js";
import * as StateRoot from "./index.js";

const hex = `0x${"12".repeat(32)}`;
const root = StateRoot.fromHex(hex);

await runBenchSuite("voltaire-ts:StateRoot", [
	{ name: "StateRoot.fromHex", fn: () => StateRoot.fromHex(hex) },
	{ name: "StateRoot.toHex", fn: () => StateRoot.toHex(root) },
	{ name: "StateRoot.equals", fn: () => StateRoot.equals(root, root) },
]);
