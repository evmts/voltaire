import {
	Abi,
	Address,
	BrandedAbi,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

// Sender account
const senderPrivateKey = Secp256k1.randomPrivateKey();
const senderPublicKey = Secp256k1.derivePublicKey(senderPrivateKey);
const senderAddress = Address.fromPublicKey(senderPublicKey);

// Recipient account
const recipientPrivateKey = Secp256k1.randomPrivateKey();
const recipientPublicKey = Secp256k1.derivePublicKey(recipientPrivateKey);
const recipientAddress = Address.fromPublicKey(recipientPublicKey);

// Common ERC-20 token address (USDC on mainnet)
const tokenAddress = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

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

// Transfer amount: 100 USDC (6 decimals)
const transferAmount = 100_000_000n; // 100 USDC = 100 * 10^6

// Get the function selector for transfer(address,uint256)
const transferSelector = Keccak256.selector("transfer(address,uint256)");

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

// Transaction parameters
const chainId = 1n; // Ethereum Mainnet
const nonce = 0n;
const maxPriorityFeePerGas = 1_000_000_000n; // 1 gwei
const maxFeePerGas = 50_000_000_000n; // 50 gwei
const gasLimit = 100_000n; // Safe gas limit for ERC-20 transfer

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

// Get the signing hash
const signingHash = Transaction.getSigningHash(unsignedTx);

// Sign with secp256k1
const signature = Secp256k1.sign(signingHash, senderPrivateKey);

// Create signed transaction
const signedTx: Transaction.EIP1559 = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27), // EIP-1559 uses yParity (0 or 1)
};

const serialized = Transaction.serialize(signedTx);

const isValid = Transaction.verifySignature(signedTx);

const recoveredSender = Transaction.getSender(signedTx);

// Example: Approve Uniswap Router to spend tokens
const uniswapRouter = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
);
const maxApproval = 2n ** 256n - 1n; // Max uint256 (infinite approval)

// Encode approve(address,uint256)
const approveSelector = Keccak256.selector("approve(address,uint256)");
const approveCalldata = new Uint8Array(4 + 32 + 32);

approveCalldata.set(approveSelector, 0);
approveCalldata.set(uniswapRouter, 4 + 12);

// Encode max uint256
const maxBytes = new Uint8Array(32);
maxBytes.fill(0xff); // All 1s = max uint256
approveCalldata.set(maxBytes, 4 + 32);

const balanceOfSelector = Keccak256.selector("balanceOf(address)");
const balanceOfCalldata = new Uint8Array(4 + 32);

balanceOfCalldata.set(balanceOfSelector, 0);
balanceOfCalldata.set(senderAddress, 4 + 12);

const gasPrice = maxFeePerGas;
const estimatedGasUsed = 65000n; // Typical ERC-20 transfer
const gasCostWei = gasPrice * estimatedGasUsed;
const gasCostGwei = gasCostWei / 1_000_000_000n;
const gasCostEth = Number(gasCostWei) / 1e18;
