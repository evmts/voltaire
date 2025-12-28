import { Bytecode } from "@tevm/voltaire";
// Example: Constructor arguments in deployment bytecode

// Constructor arguments are appended to the end of deployment bytecode
// Format: <constructor_code> + <runtime_code> + <constructor_args>

// Simple constructor that uses constructor argument
// This is a simplified example showing the concept

// Constructor code (copies runtime and uses constructor args)
const constructorCode = "0x6005600b60003960056000f3";

// Runtime code (stores value from constructor)
const runtimeCode = "0x602a600055";

// Constructor argument: uint256(100) = 0x0000...0064
const constructorArg =
	"0000000000000000000000000000000000000000000000000000000000000064";

// Full deployment bytecode
const fullDeploymentCode =
	constructorCode + runtimeCode.slice(2) + constructorArg;
const deployment = Bytecode.fromHex(fullDeploymentCode);

// Break down the components
const constructorPart = Bytecode.fromHex(constructorCode);
const runtimePart = Bytecode.fromHex(runtimeCode);

// Extract runtime (should not include constructor args)
const extracted = deployment.extractRuntime();

// Multiple constructor arguments example
// uint256(100), address(0x742d35Cc6634C0532925a3b844Bc454e4438f44e)
const arg1 = "0000000000000000000000000000000000000000000000000000000000000064";
const arg2 = "000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e";
const multiArgs = arg1 + arg2;

const deploymentMultiArgs = Bytecode.fromHex(
	constructorCode + runtimeCode.slice(2) + multiArgs,
);
const analysis = deployment.analyze();
const instructions = deployment.parseInstructions();
for (let i = 0; i < Math.min(5, instructions.length); i++) {}
