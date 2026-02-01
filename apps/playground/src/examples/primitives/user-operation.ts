import { UserOperation, Address } from "@tevm/voltaire";

// UserOperation: ERC-4337 Account Abstraction
// Used for smart account transactions bundled by bundlers

// Create a basic user operation
const userOp = UserOperation.from({
	sender: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	nonce: 0n,
	initCode: new Uint8Array(0), // Empty for existing account
	callData: new Uint8Array([
		// transfer(address,uint256) selector + encoded params
		0xa9, 0x05, 0x9c, 0xbb,
		// ... rest of calldata
	]),
	callGasLimit: 100000n,
	verificationGasLimit: 50000n,
	preVerificationGas: 21000n,
	maxFeePerGas: 20000000000n, // 20 gwei
	maxPriorityFeePerGas: 1000000000n, // 1 gwei
	paymasterAndData: new Uint8Array(0), // No paymaster
	signature: new Uint8Array(65), // Placeholder
});

console.log("UserOperation created");
console.log("Sender:", userOp.sender);
console.log("Nonce:", userOp.nonce);
console.log("CallGasLimit:", userOp.callGasLimit);

// Hash the user operation for signing
const entryPoint = Address("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
const chainId = 1n;
const opHash = UserOperation.hash(userOp, entryPoint, chainId);
console.log("UserOp hash:", Buffer.from(opHash).toString("hex"));

// Pack for bundler submission
const packed = UserOperation.pack(userOp);
console.log("Packed UserOperation for bundler");

// Example: User operation with paymaster (gasless tx)
const sponsoredOp = UserOperation.from({
	sender: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	nonce: 1n,
	initCode: new Uint8Array(0),
	callData: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
	callGasLimit: 100000n,
	verificationGasLimit: 100000n, // Higher for paymaster
	preVerificationGas: 50000n,
	maxFeePerGas: 30000000000n,
	maxPriorityFeePerGas: 2000000000n,
	// Paymaster address + validation data
	paymasterAndData: new Uint8Array([
		// Paymaster address (20 bytes)
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
		// Paymaster data/signature...
	]),
	signature: new Uint8Array(65),
});

console.log("Sponsored UserOp has paymaster:", sponsoredOp.paymasterAndData.length > 0);
