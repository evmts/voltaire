// Featured interactive showcase demos highlighting Voltaire's core capabilities

import brandedTypesAndEip712 from "./showcase/branded-types-and-eip712.ts?raw";
import evmBytecodeDisassembler from "./showcase/evm-bytecode-disassembler.ts?raw";
import fusakaGlamsterdamProtocolLab from "./showcase/fusaka-glamsterdam-protocol-lab.ts?raw";
import liveSpeedLab from "./showcase/live-speed-lab.ts?raw";

export const showcaseExamples: Record<string, string> = {
	"evm-bytecode-disassembler.ts": evmBytecodeDisassembler,
	"fusaka-glamsterdam-protocol-lab.ts": fusakaGlamsterdamProtocolLab,
	"live-speed-lab.ts": liveSpeedLab,
	"branded-types-and-eip712.ts": brandedTypesAndEip712,
};
