import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Address } from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const deployer = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Calculate contract addresses for different nonces
for (const nonce of [0n, 1n, 5n, 10n, 100n]) {
	const contractAddr = Keccak256.contractAddress(deployer, nonce);
}

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
}

const deployer2 = Address.from("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

const createAddr = Keccak256.contractAddress(deployer2, 1n);

const saltZero = new Uint8Array(32);
const initCodeHash2 = Keccak256.hash(initCode);
const create2Addr = Keccak256.create2Address(
	deployer2,
	saltZero,
	initCodeHash2,
);

const factoryAddr = Address.from("0x1111111111111111111111111111111111111111");

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
}

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

// Strategy 2: Timestamp-based
const timestamp = BigInt(Date.now());
const salt2 = new Uint8Array(32);
new DataView(salt2.buffer).setBigUint64(24, timestamp, false);
const timestampAddr = Keccak256.create2Address(
	factoryAddr2,
	salt2,
	strategyInitCodeHash,
);

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

const bytecode1 = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]);
const bytecode2 = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x53]); // Last byte different

const zeroSalt = new Uint8Array(32);
const bytecode1Hash = Keccak256.hash(bytecode1);
const bytecode2Hash = Keccak256.hash(bytecode2);
const addr1 = Keccak256.create2Address(factoryAddr, zeroSalt, bytecode1Hash);
const addr2 = Keccak256.create2Address(factoryAddr, zeroSalt, bytecode2Hash);

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
