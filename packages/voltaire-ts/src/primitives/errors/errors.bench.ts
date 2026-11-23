import { runBenchSuite } from "../../bench-harness.js";
import { InvalidFormatError, InvalidLengthError } from "./index.js";

await runBenchSuite("voltaire-ts:errors", [
	{
		name: "new InvalidLengthError",
		fn: () =>
			new InvalidLengthError("Invalid length", {
				value: "0x00",
				expected: "20 bytes",
			}),
	},
	{
		name: "new InvalidFormatError",
		fn: () =>
			new InvalidFormatError("Invalid format", {
				value: "xyz",
				expected: "hex",
			}),
	},
]);
