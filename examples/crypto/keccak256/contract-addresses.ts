import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Address } from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

/**
 * Contract Address Calculation
 *
 * Demonstrates how Ethereum calculates contract addresses:
 * - CREATE: Hash of RLP([deployer, nonce])
 * - CREATE2: Deterministic address from deployer, salt, and bytecode
 * - Real-world examples and use cases
 */

console.log("=== Contract Address Calculation ===\n");

// 1. CREATE: Nonce-based Contract Addresses
console.log("1. CREATE: Nonce-Based Addresses");
console.log("-".repeat(40));
console.log("Formula: keccak256(rlp([sender, nonce]))[12:]\n");

const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

console.log(`Deployer: ${Address.toHex(deployer)}\n`);

// Calculate contract addresses for different nonces
for (const nonce of [0n, 1n, 5n, 10n, 100n]) {
	const contractAddr = Keccak256.contractAddress(deployer, nonce);
	console.log(
		`Nonce ${nonce.toString().padStart(3)}: ${Address.toHex(contractAddr)}`,
	);
}

console.log("\nNote: First contract deployed by an EOA has nonce 0");
console.log("      Smart contract deployers start at nonce 1\n");

// 2. CREATE2: Deterministic Contract Addresses
console.log("2. CREATE2: Deterministic Addresses");
console.log("-".repeat(40));
console.log(
	"Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:]\n",
);

const factory = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Simple bytecode example (empty contract)
const initCode = new Uint8Array([
	0x60,
	0x80,
	0x60,
	0x40,
	0x52, // PUSH1 0x80, PUSH1 0x40, MSTORE
	0x34,
	0x80,
	0x15,
	0x61,
	0x00,
	0x0f, // CALLVALUE, DUP1, ISZERO, PUSH2 0x000f
]);

console.log(`Factory:  ${Address.toHex(factory)}`);
console.log(`InitCode: ${Hex.fromBytes(initCode)}`);
console.log(`InitCode Hash: ${Hex.fromBytes(Keccak256.hash(initCode))}\n`);

// Calculate CREATE2 addresses with different salts
const initCodeHash = Keccak256.hash(initCode);

for (const saltValue of [0n, 1n, 42n, 12345n]) {
	// Convert bigint to 32-byte array
	const saltBytes = new Uint8Array(32);
	const view = new DataView(saltBytes.buffer);
	view.setBigUint64(24, saltValue, false); // Write at end (big-endian)

	const contractAddr = Keccak256.create2Address(
		factory,
		saltBytes,
		initCodeHash,
	);
	console.log(
		`Salt ${saltValue.toString().padStart(5)}: ${Address.toHex(contractAddr)}`,
	);
}

console.log(
	"\nNote: Same factory + salt + initCode always produces same address\n",
);

// 3. CREATE vs CREATE2 Comparison
console.log("3. CREATE vs CREATE2 Comparison");
console.log("-".repeat(40));

const deployer2 = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const createAddr = Keccak256.contractAddress(deployer2, 1n);

const saltZero = new Uint8Array(32);
const initCodeHash2 = Keccak256.hash(initCode);
const create2Addr = Keccak256.create2Address(
	deployer2,
	saltZero,
	initCodeHash2,
);

console.log("Same deployer, different methods:\n");
console.log(`Deployer:      ${Address.toHex(deployer2)}`);
console.log(`CREATE (n=1):  ${Address.toHex(createAddr)}`);
console.log(`CREATE2 (s=0): ${Address.toHex(create2Addr)}`);
console.log("\nCREATE:  Depends on deployer state (nonce)");
console.log("CREATE2: Independent of deployer state (deterministic)\n");

// 4. Factory Pattern with CREATE2
console.log("4. Factory Pattern with CREATE2");
console.log("-".repeat(40));
console.log("Use case: Counterfactual deployment, cross-chain addresses\n");

const factoryAddr = Address.from("0x1111111111111111111111111111111111111111");

// Simulate creating multiple instances with different salts
console.log(`Factory: ${Address.toHex(factoryAddr)}\n`);
console.log("Predicting addresses before deployment:");

const salts = [
	{ name: "Alice", value: 100n },
	{ name: "Bob", value: 200n },
	{ name: "Carol", value: 300n },
];

const factoryInitCodeHash = Keccak256.hash(initCode);

for (const { name, value } of salts) {
	const saltBytes = new Uint8Array(32);
	new DataView(saltBytes.buffer).setBigUint64(24, value, false);
	const addr = Keccak256.create2Address(
		factoryAddr,
		saltBytes,
		factoryInitCodeHash,
	);
	console.log(`  ${name}'s contract: ${Address.toHex(addr)}`);
}

console.log("\nBenefit: Know contract address before deployment");
console.log("         Fund contract before it exists\n");

// 5. Salt Encoding Strategies
console.log("5. Salt Encoding Strategies");
console.log("-".repeat(40));

const factoryAddr2 = Address.from("0x2222222222222222222222222222222222222222");

const strategyInitCodeHash = Keccak256.hash(initCode);

// Strategy 1: Sequential numbering
const salt1 = new Uint8Array(32);
new DataView(salt1.buffer).setBigUint64(24, 1n, false);
const sequential = Keccak256.create2Address(
	factoryAddr2,
	salt1,
	strategyInitCodeHash,
);
console.log(`Sequential (1):     ${Address.toHex(sequential)}`);

// Strategy 2: Timestamp-based
const timestamp = BigInt(Date.now());
const salt2 = new Uint8Array(32);
new DataView(salt2.buffer).setBigUint64(24, timestamp, false);
const timestampAddr = Keccak256.create2Address(
	factoryAddr2,
	salt2,
	strategyInitCodeHash,
);
console.log(`Timestamp-based:    ${Address.toHex(timestampAddr)}`);

// Strategy 3: User-specific (encode user address in salt)
// Note: In production, you'd encode the user address into the salt bytes
const userSalt = new Uint8Array(32);
const userAddress = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
userSalt.set(userAddress, 12); // Put address in last 20 bytes
const userAddr = Keccak256.create2Address(
	factoryAddr2,
	userSalt,
	strategyInitCodeHash,
);
console.log(`User-specific:      ${Address.toHex(userAddr)}`);

console.log("\nCommon patterns:");
console.log("  - Sequential: Simple incrementing counter");
console.log("  - Hash-based: keccak256(abi.encodePacked(params))");
console.log("  - User-specific: Encode user address in salt\n");

// 6. Bytecode Hash Importance
console.log("6. Bytecode Hash in CREATE2");
console.log("-".repeat(40));

const bytecode1 = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]);
const bytecode2 = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x53]); // Last byte different

const zeroSalt = new Uint8Array(32);
const bytecode1Hash = Keccak256.hash(bytecode1);
const bytecode2Hash = Keccak256.hash(bytecode2);
const addr1 = Keccak256.create2Address(factoryAddr, zeroSalt, bytecode1Hash);
const addr2 = Keccak256.create2Address(factoryAddr, zeroSalt, bytecode2Hash);

console.log(`Bytecode 1: ${Hex.fromBytes(bytecode1)}`);
console.log(`Address 1:  ${Address.toHex(addr1)}\n`);
console.log(`Bytecode 2: ${Hex.fromBytes(bytecode2)}`);
console.log(`Address 2:  ${Address.toHex(addr2)}`);

console.log("\nSmall bytecode change -> completely different address");
console.log("This prevents front-running attacks on CREATE2\n");

// 7. Real-World Example: Uniswap V2
console.log("7. Real-World: Uniswap V2 Pair Prediction");
console.log("-".repeat(40));
console.log("Uniswap V2 uses CREATE2 for pair contracts\n");

const uniswapFactory = Address.from(
	"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
);

// Simplified pair bytecode for demo (real one is much larger)
// In production, use the actual init code from Uniswap V2
const pairInitCode = new Uint8Array(100); // Simplified
crypto.getRandomValues(pairInitCode); // Simulate bytecode

// In real usage, salt = keccak256(abi.encodePacked(token0, token1))
// For demo, we'll use a simple salt
const pairSalt = 12345n;
const pairSaltBytes = new Uint8Array(32);
new DataView(pairSaltBytes.buffer).setBigUint64(24, pairSalt, false);

const pairInitCodeHash = Keccak256.hash(pairInitCode);
const pairAddr = Keccak256.create2Address(
	uniswapFactory,
	pairSaltBytes,
	pairInitCodeHash,
);

console.log(`Factory:        ${Address.toHex(uniswapFactory)}`);
console.log(`Salt:           ${pairSalt}`);
console.log(
	`Init Code Hash: ${Hex.fromBytes(pairInitCodeHash).slice(0, 20)}...`,
);
console.log(`Predicted Pair: ${Address.toHex(pairAddr)}`);
console.log(
	"\nNote: Real Uniswap salt = keccak256(abi.encodePacked(token0, token1))\n",
);

console.log("=== Complete ===");
