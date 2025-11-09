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

const address = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Validate address size
try {
	Hex.assertSize(address, 20);
} catch (e) {}

// Zero address check (burn address)
const ZERO_ADDRESS = Hex.zero(20);
const isBurnAddress = Hex.equals(address, ZERO_ADDRESS);

// Convert address to U256 for storage/comparison
const addressAsU256 = Hex.pad(address, 32);

// ERC20 transfer(address,uint256) selector
const TRANSFER_SELECTOR = Hex("0xa9059cbb");

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

// Decode calldata
const decodedSelector = Hex.slice(transferCalldata, 0, 4);
const decodedRecipient = Hex.trim(Hex.slice(transferCalldata, 4, 36));
const decodedAmount = Hex.toBigInt(Hex.slice(transferCalldata, 36, 68));

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

// Transfer(address indexed from, address indexed to, uint256 value)
// Topic[0] is the event signature hash
const TRANSFER_TOPIC = Hex(
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
);

// Indexed parameters become topics
const from = Hex.pad(Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), 32);
const to = Hex.pad(Hex("0x1234567890123456789012345678901234567890"), 32);

// Non-indexed parameters go in data
const value = Hex.fromBigInt(1000000000000000000n, 32);

// Storage slots are 32 bytes
const SLOT_0 = Hex.zero(32);
const SLOT_1 = Hex.fromBigInt(1n, 32);
const SLOT_2 = Hex.fromBigInt(2n, 32);

// Mapping slot calculation: keccak256(key . slot)
// This is simplified - real implementation needs keccak256
const mappingSlot = 0n;
const key = Hex.pad(address, 32);
const slotInput = Hex.concat(key, Hex.fromBigInt(mappingSlot, 32));

// Simple ETH transfer has empty data
const ethTransferData = Hex("0x");

// Contract creation has bytecode as data
const deploymentBytecode = Hex.concat(
	Hex("0x60806040"), // PUSH1 0x80 PUSH1 0x40 MSTORE
	Hex.random(32), // ... rest of bytecode
);

// ECDSA signature: r (32) + s (32) + v (1) = 65 bytes
const r = Hex.random(32);
const s = Hex.random(32);
const v = Hex.fromNumber(27); // or 28

const signature = Hex.concat(r, s, v);

// Extract components
const extractedR = Hex.slice(signature, 0, 32);
const extractedS = Hex.slice(signature, 32, 64);
const extractedV = Hex.slice(signature, 64, 65);

// Compact signature (EIP-2098): 64 bytes
const compactSignature = Hex.concat(r, s);

// All hashes are 32 bytes
const blockHash = Hex.random(32);
const txHash = Hex.random(32);
const stateRoot = Hex.random(32);
const receiptRoot = Hex.random(32);

// Validate hash sizes
const hashes = [blockHash, txHash, stateRoot, receiptRoot];
const allValid = hashes.every((h) => Hex.isSized(h, 32));

// Nonce can be any size, but typically small
const nonce = Hex.fromNumber(42);

// Gas values
const gasLimit = Hex.fromNumber(21000);
const gasPrice = Hex.fromBigInt(50000000000n); // 50 gwei
const maxFeePerGas = Hex.fromBigInt(100000000000n); // 100 gwei
const maxPriorityFeePerGas = Hex.fromBigInt(2000000000n); // 2 gwei

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
