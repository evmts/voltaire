import { Bytecode } from "@tevm/voltaire";
// Example: Contract deployment bytecode

// Constructor bytecode copies runtime code to memory and returns it
// This is how contracts are deployed on Ethereum

// Simple contract: stores 42 at slot 0
// Runtime code: PUSH1 0x2a, PUSH1 0x00, SSTORE, STOP
const runtimeCode = Bytecode.fromHex("0x602a600055");

const runtimeInstructions = runtimeCode.parseInstructions();
for (const inst of runtimeInstructions) {
}

// Constructor bytecode that deploys the runtime code
// PUSH1 <runtime_size>, PUSH1 <runtime_offset>, PUSH1 0x00, CODECOPY
// PUSH1 <runtime_size>, PUSH1 0x00, RETURN
// Runtime code is appended after the constructor
const constructorCode = Bytecode.fromHex(
	"0x6005600b60003960056000f3602a600055",
);

const constructorInstructions = constructorCode.parseInstructions();
for (const inst of constructorInstructions) {
}
const extracted = constructorCode.extractRuntime();

// More complex example: constructor with parameters
// Constructor that takes constructor arguments
const constructorWithArgs = Bytecode.fromHex(
	"0x60806040523480156100105760008035",
);

const analysis = constructorWithArgs.analyze();
const deploymentCode = Bytecode.fromHex("0x6005600b60003960056000f3602a600055");
