// Primitives examples - imported as raw strings from actual JS files
// These files can be run directly with: bun playground/examples/primitives/<file>.js

import addressBasics from "../../examples/primitives/address-basics.js?raw";
import hexConcat from "../../examples/primitives/hex/concat.js?raw";
import hexFromBytes from "../../examples/primitives/hex/from-bytes.js?raw";
import hexFromString from "../../examples/primitives/hex/from-string.js?raw";
import hexSlice from "../../examples/primitives/hex/slice.js?raw";
import hexToBytes from "../../examples/primitives/hex/to-bytes.js?raw";
import hexToString from "../../examples/primitives/hex/to-string.js?raw";

// Transform imports for display (convert relative paths to voltaire/... format)
function transformForDisplay(code: string): string {
	return code
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/primitives\/Address\/index\.js["']/g,
			"from 'voltaire/primitives/Address'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/primitives\/Hex\/index\.js["']/g,
			"from 'voltaire/primitives/Hex'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/primitives\/Address\/index\.js["']/g,
			"from 'voltaire/primitives/Address'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/primitives\/Hex\/index\.js["']/g,
			"from 'voltaire/primitives/Hex'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/crypto\/Secp256k1\/index\.js["']/g,
			"from 'voltaire/crypto/Secp256k1'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/crypto\/Secp256k1\/index\.js["']/g,
			"from 'voltaire/crypto/Secp256k1'",
		);
}

export const primitiveExamples: Record<string, string> = {
	"address/basics.ts": transformForDisplay(addressBasics),
	"hex/from-string.ts": transformForDisplay(hexFromString),
	"hex/from-bytes.ts": transformForDisplay(hexFromBytes),
	"hex/to-string.ts": transformForDisplay(hexToString),
	"hex/to-bytes.ts": transformForDisplay(hexToBytes),
	"hex/concat.ts": transformForDisplay(hexConcat),
	"hex/slice.ts": transformForDisplay(hexSlice),
};
