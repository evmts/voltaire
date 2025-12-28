import { Bytecode } from "@tevm/voltaire";
// Example: EIP-1167 Minimal Proxy Contract

// EIP-1167 defines a minimal bytecode implementation that delegates all calls
// to a known, fixed address (the implementation contract)

// Minimal proxy bytecode structure:
// 0x363d3d373d3d3d363d73 (10 bytes prefix)
// + implementation address (20 bytes)
// + 0x5af43d82803e903d91602b57fd5bf3 (15 bytes suffix)

const implementationAddress = "742d35cc6634c0532925a3b844bc454e4438f44e";

// Construct minimal proxy bytecode
const prefix = "363d3d373d3d3d363d73";
const suffix = "5af43d82803e903d91602b57fd5bf3";
const proxyBytecode = prefix + implementationAddress + suffix;

const proxy = Bytecode.fromHex(`0x${proxyBytecode}`);
const instructions = proxy.parseInstructions();
for (const inst of instructions) {
}
const analysis = proxy.analyze();
const implAddressBytes = proxy.slice(10, 30);
const implAddressHex = Array.from(implAddressBytes)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("");

// Compare multiple proxies with different implementations
const impl2 = "d8da6bf26964af9d7eed9e03e53415d37aa96045";
const proxy2Bytecode = prefix + impl2 + suffix;
const proxy2 = Bytecode.fromHex(`0x${proxy2Bytecode}`);

// Size comparison with full contract
const fullContract = Bytecode.fromHex(
	"0x608060405234801561000f575f80fd5b506004361061003f575f3560e01c8063a413686214610043578063cfae32171461005f575b5f80fd5b",
);
