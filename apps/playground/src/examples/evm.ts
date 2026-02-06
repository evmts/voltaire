// EVM examples - imported as raw strings
// These demonstrate the Voltaire EVM API

import bytecode from "./evm/bytecode.ts?raw";
import gas from "./evm/gas.ts?raw";
import opcodes from "./evm/opcodes.ts?raw";
import precompiles from "./evm/precompiles.ts?raw";
import selectors from "./evm/selectors.ts?raw";
import state from "./evm/state.ts?raw";

export const evmExamples: Record<string, string> = {
	"bytecode.ts": bytecode,
	"gas.ts": gas,
	"opcodes.ts": opcodes,
	"precompiles.ts": precompiles,
	"selectors.ts": selectors,
	"state.ts": state,
};
