import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/primitives/index.ts",
		"src/crypto/index.ts",
		"src/services/index.ts",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	splitting: false,
	treeshake: true,
	external: ["@tevm/voltaire", "effect", "@effect/platform"],
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
