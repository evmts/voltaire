import { runBenchSuite } from "../../bench-harness.js";
import { BeaconBlockRoot } from "./index.js";

const hex = `0x${"ab".repeat(32)}`;
const root = BeaconBlockRoot.fromHex(hex);

await runBenchSuite("voltaire-ts:BeaconBlockRoot", [
	{ name: "BeaconBlockRoot.fromHex", fn: () => BeaconBlockRoot.fromHex(hex) },
	{ name: "BeaconBlockRoot.toHex", fn: () => BeaconBlockRoot.toHex(root) },
	{
		name: "BeaconBlockRoot.equals",
		fn: () => BeaconBlockRoot.equals(root, root),
	},
]);
