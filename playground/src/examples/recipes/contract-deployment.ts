import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
	Rlp,
} from "@tevm/voltaire";

// === Contract Deployment Recipe ===
// This recipe demonstrates how to prepare and sign contract deployment transactions
// including CREATE and CREATE2 address prediction

console.log("=== Contract Deployment Recipe ===\n");

// === Step 1: Set up deployer account ===
console.log("Step 1: Set up deployer account");
console.log("-".repeat(50));

const deployerPrivateKey = Secp256k1.randomPrivateKey();
const deployerPublicKey = Secp256k1.derivePublicKey(deployerPrivateKey);
const deployerAddress = Address.fromPublicKey(deployerPublicKey);

console.log(`Deployer: ${Address.toChecksummed(deployerAddress)}`);

// === Step 2: Prepare contract bytecode ===
console.log("\n\nStep 2: Prepare contract bytecode");
console.log("-".repeat(50));

// Example: Simple storage contract bytecode
// This is the compiled bytecode for:
// contract Storage {
//     uint256 public value;
//     constructor(uint256 _value) { value = _value; }
//     function setValue(uint256 _value) public { value = _value; }
// }

// Init code (creation bytecode) - deploys the runtime code
// This is a simplified example bytecode
const initCodeHex =
	"0x608060405234801561001057600080fd5b506040516101" +
	"0f3803806101" +
	"0f83398101604081905261002f91610037565b600055610050565b" +
	"600060208284031215610048575f80fd5b5051919050565b60b18061005e5f395ff3fe" +
	"6080604052348015600e575f80fd5b5060043610602f575f3560e01c80633fa4f2451460335780635524107714604c575b5f80fd5b60395f5481565b6040519081526020015b60405180910390f35b605b60563660046063565b5f55565b005b5f60208284031215607257575f80fd5b503591905056fea264697066735822";

// Parse the hex string to bytes
const initCode = new Uint8Array(initCodeHex.length / 2 - 1);
for (let i = 2; i < initCodeHex.length; i += 2) {
	initCode[(i - 2) / 2] = Number.parseInt(initCodeHex.slice(i, i + 2), 16);
}

console.log(`Init code length: ${initCode.length} bytes`);
console.log(
	`Init code (first 64 bytes): ${Hex.fromBytes(initCode.slice(0, 64))}...`,
);

// Encode constructor argument (initial value = 42)
const constructorArg = 42n;
const constructorArgBytes = new Uint8Array(32);
let arg = constructorArg;
for (let i = 31; i >= 0 && arg > 0n; i--) {
	constructorArgBytes[i] = Number(arg & 0xffn);
	arg >>= 8n;
}

console.log(`Constructor argument: ${constructorArg}`);
console.log(`Encoded argument: ${Hex.fromBytes(constructorArgBytes)}`);

// Complete deployment bytecode = init code + constructor args
const deploymentBytecode = new Uint8Array(initCode.length + 32);
deploymentBytecode.set(initCode, 0);
deploymentBytecode.set(constructorArgBytes, initCode.length);

console.log(`\nTotal deployment bytecode: ${deploymentBytecode.length} bytes`);

// === Step 3: Predict CREATE address ===
console.log("\n\nStep 3: Predict CREATE address");
console.log("-".repeat(50));

// CREATE address = keccak256(rlp([sender, nonce]))[12:]
const deployerNonce = 0n;

console.log(`Deployer: ${Address.toChecksummed(deployerAddress)}`);
console.log(`Nonce: ${deployerNonce}`);

// Use Address.calculateCreateAddress if available
const predictedAddress = Address.calculateCreateAddress(
	deployerAddress,
	deployerNonce,
);

console.log(
	`Predicted contract address: ${Address.toChecksummed(predictedAddress)}`,
);

// === Step 4: Create deployment transaction ===
console.log("\n\nStep 4: Create deployment transaction");
console.log("-".repeat(50));

const unsignedTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: deployerNonce,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	maxFeePerGas: 50_000_000_000n, // 50 gwei
	gasLimit: 500_000n, // Contract deployment needs more gas
	to: null, // null = contract creation
	value: 0n,
	data: deploymentBytecode,
	accessList: [],
};

console.log("Transaction parameters:");
console.log(`  type: EIP-1559 (type 2)`);
console.log(`  chainId: ${unsignedTx.chainId}`);
console.log(`  nonce: ${unsignedTx.nonce}`);
console.log(
	`  maxPriorityFeePerGas: ${unsignedTx.maxPriorityFeePerGas / 1_000_000_000n} gwei`,
);
console.log(`  maxFeePerGas: ${unsignedTx.maxFeePerGas / 1_000_000_000n} gwei`);
console.log(`  gasLimit: ${unsignedTx.gasLimit}`);
console.log(`  to: null (contract creation)`);
console.log(`  value: 0`);
console.log(`  data: ${deploymentBytecode.length} bytes of bytecode`);

// === Step 5: Sign the transaction ===
console.log("\n\nStep 5: Sign the deployment transaction");
console.log("-".repeat(50));

const signingHash = Transaction.getSigningHash(unsignedTx);
console.log(`Signing hash: ${Hex.fromBytes(signingHash)}`);

const signature = Secp256k1.sign(signingHash, deployerPrivateKey);

const signedTx: Transaction.EIP1559 = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

console.log("Transaction signed!");

// === Step 6: Serialize for broadcast ===
console.log("\n\nStep 6: Serialize for broadcast");
console.log("-".repeat(50));

const serialized = Transaction.serialize(signedTx);
console.log(
	`Serialized transaction: ${Hex.fromBytes(serialized.slice(0, 100))}...`,
);
console.log(`Total serialized length: ${serialized.length} bytes`);

// Verify
const isValid = Transaction.verifySignature(signedTx);
const recoveredSender = Transaction.getSender(signedTx);
console.log(`\nSignature valid: ${isValid}`);
console.log(`Recovered sender: ${Address.toChecksummed(recoveredSender)}`);

// === Step 7: CREATE2 deployment ===
console.log("\n\n=== CREATE2 Deployment ===");
console.log("-".repeat(50));

// CREATE2 allows deterministic addresses using a salt
// CREATE2 address = keccak256(0xff ++ factory ++ salt ++ keccak256(initCode))[12:]

// Factory contract address (e.g., deployer contract)
const factoryAddress = Address.fromHex(
	"0x4e59b44847b379578588920cA78FbF26c0B4956C", // Deterministic deployment proxy
);

// Salt (32 bytes)
const salt = new Uint8Array(32);
// Use a meaningful salt, e.g., version number or unique identifier
salt[31] = 1; // salt = 1

console.log(`Factory: ${Address.toChecksummed(factoryAddress)}`);
console.log(`Salt: ${Hex.fromBytes(salt)}`);

// Calculate init code hash
const initCodeHash = Keccak256.hash(deploymentBytecode);
console.log(`Init code hash: ${Hex.fromBytes(initCodeHash)}`);

// Calculate CREATE2 address
// 0xff + address (20) + salt (32) + initCodeHash (32) = 85 bytes
const create2Input = new Uint8Array(1 + 20 + 32 + 32);
create2Input[0] = 0xff;
create2Input.set(factoryAddress, 1);
create2Input.set(salt, 21);
create2Input.set(initCodeHash, 53);

const create2Hash = Keccak256.hash(create2Input);
const create2Address = create2Hash.slice(12) as typeof deployerAddress;

console.log(
	`CREATE2 predicted address: ${Address.toChecksummed(create2Address)}`,
);

// === Step 8: Deploy via CREATE2 factory ===
console.log("\n\nStep 8: Deploy via CREATE2 factory");
console.log("-".repeat(50));

// The factory expects: salt (32 bytes) + init code
const factoryCalldata = new Uint8Array(32 + deploymentBytecode.length);
factoryCalldata.set(salt, 0);
factoryCalldata.set(deploymentBytecode, 32);

console.log(`Factory calldata length: ${factoryCalldata.length} bytes`);
console.log(`  Salt: ${Hex.fromBytes(factoryCalldata.slice(0, 32))}`);
console.log(`  Init code: ${deploymentBytecode.length} bytes`);

const create2Tx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 1n, // Second transaction
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 600_000n,
	to: factoryAddress,
	value: 0n,
	data: factoryCalldata,
	accessList: [],
};

console.log("\nCREATE2 Transaction:");
console.log(`  to: ${Address.toChecksummed(factoryAddress)} (factory)`);
console.log(`  data: salt + init code`);

// === Step 9: Deploying with value (payable constructor) ===
console.log("\n\n=== Deploying with Value ===");
console.log("-".repeat(50));

// If the constructor is payable, you can send ETH with deployment
const payableDeployTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 2n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 500_000n,
	to: null,
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: deploymentBytecode,
	accessList: [],
};

console.log("Payable deployment:");
console.log(
	`  value: ${payableDeployTx.value / 1_000_000_000_000_000_000n} ETH`,
);
console.log("  This ETH will be the contract's initial balance");

// === Step 10: Gas estimation ===
console.log("\n\n=== Gas Estimation ===");
console.log("-".repeat(50));

// Base deployment cost
const baseGas = 21000n;
// Per-byte cost for non-zero bytes (~68 gas per byte)
const bytecodeCost = BigInt(deploymentBytecode.length) * 68n;
// Contract creation cost (32000 gas)
const createCost = 32000n;
// Estimated execution cost (varies by constructor)
const executionCost = 50000n;

const totalEstimate = baseGas + bytecodeCost + createCost + executionCost;

console.log("Gas breakdown (rough estimate):");
console.log(`  Base: ${baseGas}`);
console.log(
	`  Bytecode data: ~${bytecodeCost} (${deploymentBytecode.length} bytes)`,
);
console.log(`  Contract creation: ${createCost}`);
console.log(`  Execution (estimated): ~${executionCost}`);
console.log(`  Total estimate: ~${totalEstimate}`);

const gasPrice = 50_000_000_000n;
const costEth = Number(totalEstimate * gasPrice) / 1e18;
console.log(`\nAt 50 gwei: ~${costEth.toFixed(4)} ETH`);

// === Step 11: Deploy proxy pattern ===
console.log("\n\n=== Proxy Deployment Pattern ===");
console.log("-".repeat(50));

console.log("For upgradeable contracts, deploy:");
console.log("1. Implementation contract (logic)");
console.log("2. Proxy contract (points to implementation)");
console.log("3. ProxyAdmin (manages upgrades)");

// Minimal proxy (EIP-1167)
const implementationAddress = predictedAddress;
const minimalProxyBytecode = new Uint8Array([
	0x36,
	0x3d,
	0x3d,
	0x37,
	0x3d,
	0x3d,
	0x3d,
	0x36,
	0x3d,
	0x73,
	// Implementation address (20 bytes)
	...implementationAddress,
	0x5a,
	0xf4,
	0x3d,
	0x82,
	0x80,
	0x3e,
	0x90,
	0x3d,
	0x91,
	0x60,
	0x2b,
	0x57,
	0xfd,
	0x5b,
	0xf3,
]);

console.log(`\nMinimal proxy bytecode: ${Hex.fromBytes(minimalProxyBytecode)}`);
console.log(
	`Proxy size: ${minimalProxyBytecode.length} bytes (very gas efficient)`,
);

console.log("\n=== Recipe Complete ===");
console.log("\nKey points:");
console.log("1. Contract deployment tx has to: null");
console.log("2. data field contains init code + constructor args");
console.log("3. CREATE address is deterministic: keccak(rlp([sender, nonce]))");
console.log("4. CREATE2 allows pre-computed addresses with a salt");
console.log("5. Always estimate gas and add a safety margin");
