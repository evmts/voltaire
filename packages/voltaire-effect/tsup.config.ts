import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/primitives/index.ts",
		"src/crypto/index.ts",
		"src/services/index.ts",
		"src/native/index.ts",
	],
	format: ["esm"],
	// TODO: Re-enable once type issues in services/presets are fixed
	// Types have export mismatches with @tevm/voltaire and @effect/platform
	dts: false,
	clean: true,
	splitting: false,
	treeshake: true,
	external: [
		"@tevm/voltaire",
		"@tevm/voltaire/native",
		"effect",
		"@effect/platform",
	],
	noExternal: [],
	esbuildOptions(options) {
		options.external = [
			...(options.external || []),
			"@tevm/voltaire/Abi",
			"@tevm/voltaire/Hex",
			"@tevm/voltaire/ContractCode",
			"@tevm/voltaire/InitCode",
		];
	},
});
