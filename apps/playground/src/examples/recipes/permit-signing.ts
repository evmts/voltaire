import {
	Address,
	EIP712,
	Hex,
	Keccak256,
	Permit,
	Secp256k1,
	type Transaction,
} from "@tevm/voltaire";

// Token owner (signer)
const ownerPrivateKey = Secp256k1.randomPrivateKey();
const ownerPublicKey = Secp256k1.derivePublicKey(ownerPrivateKey);
const ownerAddress = Address.fromPublicKey(ownerPublicKey);

// Spender (DEX router, lending protocol, etc.)
const spenderAddress = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // Uniswap Router
);

// Example: USDC on Ethereum
const tokenAddress = Address.fromHex(
	"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

// Domain separator for USDC
// Note: Different tokens may use different domain parameters
const domain = {
	name: "USD Coin",
	version: "2", // USDC uses version "2"
	chainId: 1n,
	verifyingContract: Address.toHex(tokenAddress),
};

// Permit parameters
const value = 1_000_000_000n; // 1000 USDC (6 decimals)
const nonce = 0n; // First permit for this owner
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

const permitMessage = {
	owner: Address.toHex(ownerAddress),
	spender: Address.toHex(spenderAddress),
	value,
	nonce,
	deadline,
};

// Standard ERC-2612 permit types
const permitTypes = {
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
};

const typedData = {
	domain,
	types: permitTypes,
	primaryType: "Permit" as const,
	message: permitMessage,
};

// Hash the typed data
const permitHash = EIP712.hashTypedData(typedData);

// Sign with EIP-712
const signature = EIP712.signTypedData(typedData, ownerPrivateKey);

// Extract r, s, v components
const r = signature.slice(0, 32);
const s = signature.slice(32, 64);
const v = signature[64];

// Recover the signer
const recoveredAddress = EIP712.recoverAddress(signature, typedData);

// Verify signature
const isValid = EIP712.verifyTypedData(signature, typedData, ownerAddress);

// permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
const permitSelector = Keccak256.selector(
	"permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
);

// Encode calldata
const permitCalldata = new Uint8Array(4 + 32 * 7);
let offset = 0;

// Selector
permitCalldata.set(permitSelector, offset);
offset += 4;

// owner (address padded to 32 bytes)
permitCalldata.set(ownerAddress, offset + 12);
offset += 32;

// spender (address padded to 32 bytes)
permitCalldata.set(spenderAddress, offset + 12);
offset += 32;

// value (uint256)
const valueBytes = new Uint8Array(32);
let val = value;
for (let i = 31; i >= 0 && val > 0n; i--) {
	valueBytes[i] = Number(val & 0xffn);
	val >>= 8n;
}
permitCalldata.set(valueBytes, offset);
offset += 32;

// deadline (uint256)
const deadlineBytes = new Uint8Array(32);
let dl = deadline;
for (let i = 31; i >= 0 && dl > 0n; i--) {
	deadlineBytes[i] = Number(dl & 0xffn);
	dl >>= 8n;
}
permitCalldata.set(deadlineBytes, offset);
offset += 32;

// v (uint8, but padded to 32 bytes)
permitCalldata[offset + 31] = v;
offset += 32;

// r (bytes32)
permitCalldata.set(r, offset);
offset += 32;

// s (bytes32)
permitCalldata.set(s, offset);

// The spender would create a transaction calling permit() on the token
const permitTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 50_000_000_000n,
	gasLimit: 80_000n, // permit() is relatively cheap
	to: tokenAddress,
	value: 0n,
	data: permitCalldata,
	accessList: [],
};

// DAI uses a slightly different permit structure
const daiAddress = Address.fromHex(
	"0x6B175474E89094C44Da98b954EescdecAD3F9e6Db",
);

const daiDomain = {
	name: "Dai Stablecoin",
	version: "1",
	chainId: 1n,
	verifyingContract: Address.toHex(daiAddress),
};

// DAI permit uses 'allowed' instead of 'value' and adds 'holder'
const daiPermitTypes = {
	Permit: [
		{ name: "holder", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "nonce", type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "allowed", type: "bool" },
	],
};

const daiPermitMessage = {
	holder: Address.toHex(ownerAddress),
	spender: Address.toHex(spenderAddress),
	nonce: 0n,
	expiry: deadline,
	allowed: true, // true = approve, false = revoke
};

const daiTypedData = {
	domain: daiDomain,
	types: daiPermitTypes,
	primaryType: "Permit" as const,
	message: daiPermitMessage,
};

const daiSignature = EIP712.signTypedData(daiTypedData, ownerPrivateKey);

const permit2Address = Address.fromHex(
	"0x000000000022D473030F116dDEE9F6B43aC78BA3",
);

// Permit2 PermitSingle structure
const permit2Types = {
	PermitSingle: [
		{ name: "details", type: "PermitDetails" },
		{ name: "spender", type: "address" },
		{ name: "sigDeadline", type: "uint256" },
	],
	PermitDetails: [
		{ name: "token", type: "address" },
		{ name: "amount", type: "uint160" },
		{ name: "expiration", type: "uint48" },
		{ name: "nonce", type: "uint48" },
	],
};

/**
 * Creates a permit signature for ERC-2612 tokens
 * @param params - Permit parameters
 * @returns Signature components (v, r, s)
 */
function createPermitSignature(params: {
	tokenName: string;
	tokenVersion: string;
	tokenAddress: Uint8Array;
	chainId: bigint;
	owner: Uint8Array;
	spender: Uint8Array;
	value: bigint;
	nonce: bigint;
	deadline: bigint;
	privateKey: Uint8Array;
}): { v: number; r: Uint8Array; s: Uint8Array } {
	const typedData = {
		domain: {
			name: params.tokenName,
			version: params.tokenVersion,
			chainId: params.chainId,
			verifyingContract: Address.toHex(params.tokenAddress),
		},
		types: {
			Permit: [
				{ name: "owner", type: "address" },
				{ name: "spender", type: "address" },
				{ name: "value", type: "uint256" },
				{ name: "nonce", type: "uint256" },
				{ name: "deadline", type: "uint256" },
			],
		},
		primaryType: "Permit" as const,
		message: {
			owner: Address.toHex(params.owner),
			spender: Address.toHex(params.spender),
			value: params.value,
			nonce: params.nonce,
			deadline: params.deadline,
		},
	};

	const sig = EIP712.signTypedData(typedData, params.privateKey);

	return {
		v: sig[64],
		r: sig.slice(0, 32),
		s: sig.slice(32, 64),
	};
}

// Example usage
const exampleSig = createPermitSignature({
	tokenName: "USD Coin",
	tokenVersion: "2",
	tokenAddress: tokenAddress,
	chainId: 1n,
	owner: ownerAddress,
	spender: spenderAddress,
	value: 1_000_000n,
	nonce: 0n,
	deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
	privateKey: ownerPrivateKey,
});
