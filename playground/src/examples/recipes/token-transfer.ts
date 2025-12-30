import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Abi,
	BrandedAbi,
	Transaction,
} from "@tevm/voltaire";

// === ERC-20 Token Transfer Recipe ===
// This recipe demonstrates the complete flow for transferring ERC-20 tokens
// including ABI encoding, transaction creation, and signing

console.log("=== ERC-20 Token Transfer Recipe ===\n");

// === Step 1: Set up accounts ===
console.log("Step 1: Set up sender and recipient accounts");
console.log("-".repeat(50));

// Sender account
const senderPrivateKey = Secp256k1.randomPrivateKey();
const senderPublicKey = Secp256k1.derivePublicKey(senderPrivateKey);
const senderAddress = Address.fromPublicKey(senderPublicKey);

// Recipient account
const recipientPrivateKey = Secp256k1.randomPrivateKey();
const recipientPublicKey = Secp256k1.derivePublicKey(recipientPrivateKey);
const recipientAddress = Address.fromPublicKey(recipientPublicKey);

console.log(`Sender: ${Address.toChecksummed(senderAddress)}`);
console.log(`Recipient: ${Address.toChecksummed(recipientAddress)}`);

// === Step 2: Define the ERC-20 contract ===
console.log("\n\nStep 2: Define the ERC-20 contract interface");
console.log("-".repeat(50));

// Common ERC-20 token address (USDC on mainnet)
const tokenAddress = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

console.log(`Token Contract: ${Address.toChecksummed(tokenAddress)}`);
console.log("Token: USD Coin (USDC)");
console.log("Decimals: 6");

// ERC-20 ABI (only the functions we need)
const ERC20_ABI = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "approve",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "transferFrom",
		inputs: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "allowance",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ name: "owner", type: "address", indexed: true },
			{ name: "spender", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

console.log("\nERC-20 Functions:");
console.log("  - transfer(to, amount)");
console.log("  - approve(spender, amount)");
console.log("  - transferFrom(from, to, amount)");
console.log("  - balanceOf(account) -> uint256");
console.log("  - allowance(owner, spender) -> uint256");

// === Step 3: Encode transfer function call ===
console.log("\n\nStep 3: Encode the transfer function call");
console.log("-".repeat(50));

// Transfer amount: 100 USDC (6 decimals)
const transferAmount = 100_000_000n; // 100 USDC = 100 * 10^6

console.log(`Transfer amount: ${transferAmount} (100 USDC)`);
console.log(`Recipient: ${Address.toChecksummed(recipientAddress)}`);

// Get the function selector for transfer(address,uint256)
const transferSelector = Keccak256.selector("transfer(address,uint256)");
console.log(`\nFunction selector: ${Hex.fromBytes(transferSelector)}`);

// Encode the parameters
// For transfer: address (32 bytes padded) + uint256 (32 bytes)
const transferCalldata = new Uint8Array(4 + 32 + 32);

// Copy selector
transferCalldata.set(transferSelector, 0);

// Encode recipient address (left-padded to 32 bytes)
transferCalldata.set(recipientAddress, 4 + 12); // 12 bytes padding + 20 bytes address

// Encode amount (big-endian uint256)
const amountBytes = new Uint8Array(32);
let amount = transferAmount;
for (let i = 31; i >= 0 && amount > 0n; i--) {
	amountBytes[i] = Number(amount & 0xffn);
	amount >>= 8n;
}
transferCalldata.set(amountBytes, 4 + 32);

console.log(`Encoded calldata: ${Hex.fromBytes(transferCalldata)}`);
console.log(`Calldata length: ${transferCalldata.length} bytes`);

// Breakdown
console.log("\nCalldata breakdown:");
console.log(`  Selector: ${Hex.fromBytes(transferCalldata.slice(0, 4))}`);
console.log(`  To (padded): ${Hex.fromBytes(transferCalldata.slice(4, 36))}`);
console.log(`  Amount: ${Hex.fromBytes(transferCalldata.slice(36, 68))}`);

// === Step 4: Create the transaction (EIP-1559) ===
console.log("\n\nStep 4: Create an EIP-1559 transaction");
console.log("-".repeat(50));

// Transaction parameters
const chainId = 1n; // Ethereum Mainnet
const nonce = 0n;
const maxPriorityFeePerGas = 1_000_000_000n; // 1 gwei
const maxFeePerGas = 50_000_000_000n; // 50 gwei
const gasLimit = 100_000n; // Safe gas limit for ERC-20 transfer

console.log("Transaction parameters:");
console.log(`  chainId: ${chainId}`);
console.log(`  nonce: ${nonce}`);
console.log(`  maxPriorityFeePerGas: ${maxPriorityFeePerGas} (1 gwei)`);
console.log(`  maxFeePerGas: ${maxFeePerGas} (50 gwei)`);
console.log(`  gasLimit: ${gasLimit}`);
console.log(`  to: ${Address.toChecksummed(tokenAddress)}`);
console.log(`  value: 0 (no ETH transfer)`);

// Create unsigned EIP-1559 transaction
const unsignedTx: Transaction.EIP1559 = {
	type: 2, // EIP-1559
	chainId,
	nonce,
	maxPriorityFeePerGas,
	maxFeePerGas,
	gasLimit,
	to: tokenAddress,
	value: 0n, // No ETH transfer for ERC-20
	data: transferCalldata,
	accessList: [],
};

console.log("\nUnsigned transaction created");

// === Step 5: Sign the transaction ===
console.log("\n\nStep 5: Sign the transaction");
console.log("-".repeat(50));

// Get the signing hash
const signingHash = Transaction.getSigningHash(unsignedTx);
console.log(`Signing hash: ${Hex.fromBytes(signingHash)}`);

// Sign with secp256k1
const signature = Secp256k1.sign(signingHash, senderPrivateKey);

console.log(`Signature r: ${Hex.fromBytes(signature.r)}`);
console.log(`Signature s: ${Hex.fromBytes(signature.s)}`);
console.log(`Signature v: ${signature.v}`);

// Create signed transaction
const signedTx: Transaction.EIP1559 = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27), // EIP-1559 uses yParity (0 or 1)
};

console.log("\nTransaction signed!");

// === Step 6: Serialize the transaction ===
console.log("\n\nStep 6: Serialize for broadcast");
console.log("-".repeat(50));

const serialized = Transaction.serialize(signedTx);
console.log(`Serialized transaction: ${Hex.fromBytes(serialized)}`);
console.log(`Serialized length: ${serialized.length} bytes`);

// === Step 7: Verify the transaction ===
console.log("\n\nStep 7: Verify the signed transaction");
console.log("-".repeat(50));

const isValid = Transaction.verifySignature(signedTx);
console.log(`Signature valid: ${isValid}`);

const recoveredSender = Transaction.getSender(signedTx);
console.log(`Recovered sender: ${Address.toChecksummed(recoveredSender)}`);
console.log(`Expected sender: ${Address.toChecksummed(senderAddress)}`);
console.log(`Match: ${Address.equals(recoveredSender, senderAddress)}`);

// === Step 8: Encode approve call (for DEX interactions) ===
console.log("\n\n=== Bonus: Approve for DEX Interaction ===");
console.log("-".repeat(50));

// Example: Approve Uniswap Router to spend tokens
const uniswapRouter = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
);
const maxApproval = 2n ** 256n - 1n; // Max uint256 (infinite approval)

console.log(
	`Spender (Uniswap Router): ${Address.toChecksummed(uniswapRouter)}`,
);
console.log(`Approval amount: MAX_UINT256 (infinite)`);

// Encode approve(address,uint256)
const approveSelector = Keccak256.selector("approve(address,uint256)");
const approveCalldata = new Uint8Array(4 + 32 + 32);

approveCalldata.set(approveSelector, 0);
approveCalldata.set(uniswapRouter, 4 + 12);

// Encode max uint256
const maxBytes = new Uint8Array(32);
maxBytes.fill(0xff); // All 1s = max uint256
approveCalldata.set(maxBytes, 4 + 32);

console.log(`\nApprove calldata: ${Hex.fromBytes(approveCalldata)}`);

// === Step 9: Encode balanceOf call (for checking balance) ===
console.log("\n\n=== Bonus: Query Balance ===");
console.log("-".repeat(50));

const balanceOfSelector = Keccak256.selector("balanceOf(address)");
const balanceOfCalldata = new Uint8Array(4 + 32);

balanceOfCalldata.set(balanceOfSelector, 0);
balanceOfCalldata.set(senderAddress, 4 + 12);

console.log(`balanceOf calldata: ${Hex.fromBytes(balanceOfCalldata)}`);
console.log("Use this calldata with eth_call to query balance");

// === Step 10: Calculate gas cost estimate ===
console.log("\n\n=== Gas Cost Estimate ===");
console.log("-".repeat(50));

const gasPrice = maxFeePerGas;
const estimatedGasUsed = 65000n; // Typical ERC-20 transfer
const gasCostWei = gasPrice * estimatedGasUsed;
const gasCostGwei = gasCostWei / 1_000_000_000n;
const gasCostEth = Number(gasCostWei) / 1e18;

console.log(`Estimated gas used: ${estimatedGasUsed}`);
console.log(`Gas price: ${gasPrice / 1_000_000_000n} gwei`);
console.log(
	`Estimated cost: ${gasCostGwei} gwei (${gasCostEth.toFixed(6)} ETH)`,
);

console.log("\n=== Recipe Complete ===");
console.log("\nNext steps:");
console.log("1. Fund the sender address with ETH for gas");
console.log("2. Fund the sender address with USDC tokens");
console.log("3. Broadcast the serialized transaction to a node");
console.log("4. Wait for confirmation");
