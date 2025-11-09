/**
 * Ethereum Use Cases Example
 *
 * Demonstrates real-world Ethereum development patterns:
 * - Working with addresses and checksums
 * - Function selectors and calldata encoding
 * - Transaction data manipulation
 * - Event topic hashing
 * - Storage slot calculation
 */

import { Hex } from "@tevm/voltaire";

console.log("=== Ethereum Use Cases ===\n");

// 1. Address handling
console.log("1. Address handling:");

const address = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`  Address: ${address}`);
console.log(`  Size: ${Hex.size(address)} bytes`);

// Validate address size
try {
	Hex.assertSize(address, 20);
	console.log(`  ✓ Valid Ethereum address (20 bytes)`);
} catch (e) {
	console.log(`  ✗ Invalid address size`);
}

// Zero address check (burn address)
const ZERO_ADDRESS = Hex.zero(20);
const isBurnAddress = Hex.equals(address, ZERO_ADDRESS);
console.log(`  Is burn address? ${isBurnAddress}`);

// Convert address to U256 for storage/comparison
const addressAsU256 = Hex.pad(address, 32);
console.log(`  As U256: ${addressAsU256}`);

// 2. Function selectors and calldata
console.log("\n2. Function selectors and calldata:");

// ERC20 transfer(address,uint256) selector
const TRANSFER_SELECTOR = Hex("0xa9059cbb");
console.log(`  Function: transfer(address,uint256)`);
console.log(`  Selector: ${TRANSFER_SELECTOR}`);

// Encode transfer calldata
const recipient = Hex("0x1234567890123456789012345678901234567890");
const amount = 1000000000000000000n; // 1 token (18 decimals)

const encodedRecipient = Hex.pad(recipient, 32);
const encodedAmount = Hex.fromBigInt(amount, 32);
const transferCalldata = Hex.concat(
	TRANSFER_SELECTOR,
	encodedRecipient,
	encodedAmount,
);

console.log(`  Recipient: ${recipient}`);
console.log(`  Amount: ${amount}n`);
console.log(`  Calldata: ${transferCalldata}`);
console.log(`  Calldata size: ${Hex.size(transferCalldata)} bytes`);

// Decode calldata
const decodedSelector = Hex.slice(transferCalldata, 0, 4);
const decodedRecipient = Hex.trim(Hex.slice(transferCalldata, 4, 36));
const decodedAmount = Hex.toBigInt(Hex.slice(transferCalldata, 36, 68));

console.log(`  Decoded selector: ${decodedSelector}`);
console.log(`  Decoded recipient: ${decodedRecipient}`);
console.log(`  Decoded amount: ${decodedAmount}n`);

// 3. Multi-argument function calls
console.log("\n3. Multi-argument function calls:");

// approve(address spender, uint256 amount)
const APPROVE_SELECTOR = Hex("0x095ea7b3");
const spender = Hex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const approveAmount =
	0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn; // max uint256

const approveCalldata = Hex.concat(
	APPROVE_SELECTOR,
	Hex.pad(spender, 32),
	Hex.fromBigInt(approveAmount, 32),
);

console.log(`  Function: approve(address,uint256)`);
console.log(`  Selector: ${APPROVE_SELECTOR}`);
console.log(`  Spender: ${spender}`);
console.log(`  Amount: max uint256`);
console.log(`  Calldata size: ${Hex.size(approveCalldata)} bytes`);

// 4. Event topics
console.log("\n4. Event topics:");

// Transfer(address indexed from, address indexed to, uint256 value)
// Topic[0] is the event signature hash
const TRANSFER_TOPIC = Hex(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);
console.log(`  Event: Transfer(address,address,uint256)`);
console.log(`  Topic[0]: ${TRANSFER_TOPIC}`);

// Indexed parameters become topics
const from = Hex.pad(Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), 32);
const to = Hex.pad(Hex("0x1234567890123456789012345678901234567890"), 32);

console.log(`  Topic[1] (from): ${from}`);
console.log(`  Topic[2] (to): ${to}`);

// Non-indexed parameters go in data
const value = Hex.fromBigInt(1000000000000000000n, 32);
console.log(`  Data (value): ${value}`);

// 5. Storage slots
console.log("\n5. Storage slots:");

// Storage slots are 32 bytes
const SLOT_0 = Hex.zero(32);
const SLOT_1 = Hex.fromBigInt(1n, 32);
const SLOT_2 = Hex.fromBigInt(2n, 32);

console.log(`  Slot 0: ${SLOT_0}`);
console.log(`  Slot 1: ${SLOT_1}`);
console.log(`  Slot 2: ${SLOT_2}`);

// Mapping slot calculation: keccak256(key . slot)
// This is simplified - real implementation needs keccak256
const mappingSlot = 0n;
const key = Hex.pad(address, 32);
const slotInput = Hex.concat(key, Hex.fromBigInt(mappingSlot, 32));

console.log(`  Mapping key: ${address}`);
console.log(`  Mapping slot: ${mappingSlot}`);
console.log(`  Hash input: ${slotInput}`);
console.log(`  Hash input size: ${Hex.size(slotInput)} bytes`);

// 6. Transaction data
console.log("\n6. Transaction data:");

// Simple ETH transfer has empty data
const ethTransferData = Hex("0x");
console.log(`  ETH transfer data: ${ethTransferData}`);

// Contract creation has bytecode as data
const deploymentBytecode = Hex.concat(
	Hex("0x60806040"), // PUSH1 0x80 PUSH1 0x40 MSTORE
	Hex.random(32), // ... rest of bytecode
);
console.log(`  Deployment bytecode: ${deploymentBytecode.slice(0, 20)}...`);
console.log(`  Bytecode size: ${Hex.size(deploymentBytecode)} bytes`);

// 7. Signature handling
console.log("\n7. Signature handling:");

// ECDSA signature: r (32) + s (32) + v (1) = 65 bytes
const r = Hex.random(32);
const s = Hex.random(32);
const v = Hex.fromNumber(27); // or 28

const signature = Hex.concat(r, s, v);
console.log(`  Signature: ${signature}`);
console.log(`  Size: ${Hex.size(signature)} bytes`);

// Extract components
const extractedR = Hex.slice(signature, 0, 32);
const extractedS = Hex.slice(signature, 32, 64);
const extractedV = Hex.slice(signature, 64, 65);

console.log(`  r: ${extractedR}`);
console.log(`  s: ${extractedS}`);
console.log(`  v: ${extractedV} (${Hex.toNumber(extractedV)})`);

// Compact signature (EIP-2098): 64 bytes
const compactSignature = Hex.concat(r, s);
console.log(`  Compact signature: ${compactSignature}`);
console.log(`  Compact size: ${Hex.size(compactSignature)} bytes`);

// 8. Block and transaction hashes
console.log("\n8. Block and transaction hashes:");

// All hashes are 32 bytes
const blockHash = Hex.random(32);
const txHash = Hex.random(32);
const stateRoot = Hex.random(32);
const receiptRoot = Hex.random(32);

console.log(`  Block hash: ${blockHash}`);
console.log(`  Tx hash: ${txHash}`);
console.log(`  State root: ${stateRoot}`);
console.log(`  Receipt root: ${receiptRoot}`);

// Validate hash sizes
const hashes = [blockHash, txHash, stateRoot, receiptRoot];
const allValid = hashes.every((h) => Hex.isSized(h, 32));
console.log(`  All hashes valid (32 bytes): ${allValid}`);

// 9. Nonce and gas values
console.log("\n9. Nonce and gas values:");

// Nonce can be any size, but typically small
const nonce = Hex.fromNumber(42);
console.log(`  Nonce: ${nonce} (${Hex.toNumber(nonce)})`);

// Gas values
const gasLimit = Hex.fromNumber(21000);
const gasPrice = Hex.fromBigInt(50000000000n); // 50 gwei
const maxFeePerGas = Hex.fromBigInt(100000000000n); // 100 gwei
const maxPriorityFeePerGas = Hex.fromBigInt(2000000000n); // 2 gwei

console.log(`  Gas limit: ${gasLimit} (${Hex.toNumber(gasLimit)})`);
console.log(`  Gas price: ${gasPrice} (${Hex.toBigInt(gasPrice)}n wei)`);
console.log(`  Max fee: ${maxFeePerGas} (${Hex.toBigInt(maxFeePerGas)}n wei)`);
console.log(
	`  Priority fee: ${maxPriorityFeePerGas} (${Hex.toBigInt(maxPriorityFeePerGas)}n wei)`,
);

// 10. CREATE2 address calculation
console.log("\n10. CREATE2 address calculation:");

// CREATE2 needs: 0xff + deployer + salt + keccak256(bytecode)
const deployer = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const create2Salt = Hex.random(32);
const bytecodeHash = Hex.random(32); // keccak256 of bytecode

const create2Input = Hex.concat(
	Hex("0xff"),
	deployer,
	create2Salt,
	bytecodeHash,
);

console.log(`  Deployer: ${deployer}`);
console.log(`  Salt: ${create2Salt}`);
console.log(`  Bytecode hash: ${bytecodeHash}`);
console.log(`  Input for hashing: ${create2Input}`);
console.log(`  Input size: ${Hex.size(create2Input)} bytes (expected: 85)`);

// The resulting address would be last 20 bytes of keccak256(create2Input)
// (not implemented here, but shows the pattern)

console.log("\n=== Example completed ===\n");
