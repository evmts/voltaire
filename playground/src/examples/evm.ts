// EVM examples - imported as raw strings from actual JS files
// These files can be run directly with: bun playground/examples/evm/<file>.js

import frameCreate from "../../examples/evm/frame-create.js?raw";
import frameStack from "../../examples/evm/frame-stack.js?raw";
import hostMemory from "../../examples/evm/host-memory.js?raw";
import arithmetic from "../../examples/evm/arithmetic.js?raw";

// Transform imports for display (convert relative paths to voltaire/... format)
function transformForDisplay(code: string): string {
	return code
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/evm\/Frame\/index\.js["']/g,
			"from 'voltaire/evm/Frame'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/evm\/Host\/index\.js["']/g,
			"from 'voltaire/evm/Host'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/evm\/arithmetic\/index\.js["']/g,
			"from 'voltaire/evm/Arithmetic'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/primitives\/Address\/index\.js["']/g,
			"from 'voltaire/primitives/Address'",
		)
		.replace(
			/from ["']\.\.\/\.\.\/\.\.\/src\/primitives\/Hex\/index\.js["']/g,
			"from 'voltaire/primitives/Hex'",
		);
}

export const evmExamples: Record<string, string> = {
	"frame/create-frame.ts": transformForDisplay(frameCreate),
	"frame/stack-operations.ts": transformForDisplay(frameStack),
	"host/memory-host.ts": transformForDisplay(hostMemory),
	"opcodes/arithmetic.ts": transformForDisplay(arithmetic),
};
