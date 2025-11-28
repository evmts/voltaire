// Crypto examples - imported as raw strings from actual JS files
// These files can be run directly with: bun playground/examples/crypto/<file>.js

import keccak256HashString from "../../examples/crypto/keccak256/hash-string.js?raw";
import sha256HashString from "../../examples/crypto/sha256/hash-string.js?raw";
import sha256HashBytes from "../../examples/crypto/sha256/hash-bytes.js?raw";

// Transform imports for display (convert relative paths to voltaire/... format)
function transformForDisplay(code: string): string {
	return code
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/crypto\/Keccak256\/index\.js["']/g,
			"from 'voltaire/crypto/Keccak256'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/crypto\/SHA256\/index\.js["']/g,
			"from 'voltaire/crypto/SHA256'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/\.\.\/src\/primitives\/Hex\/index\.js["']/g,
			"from 'voltaire/primitives/Hex'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/crypto\/Keccak256\/index\.js["']/g,
			"from 'voltaire/crypto/Keccak256'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/crypto\/SHA256\/index\.js["']/g,
			"from 'voltaire/crypto/SHA256'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/primitives\/Hex\/index\.js["']/g,
			"from 'voltaire/primitives/Hex'",
		);
}

export const cryptoExamples: Record<string, string> = {
	"keccak256/hash-string.ts": transformForDisplay(keccak256HashString),
	"sha256/hash-string.ts": transformForDisplay(sha256HashString),
	"sha256/hash-bytes.ts": transformForDisplay(sha256HashBytes),
};
