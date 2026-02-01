import { Permit, Address, ChainId } from "@tevm/voltaire";

// Permit: ERC-2612 Token Permits
// Gasless approvals using EIP-712 signatures

// Create a permit signature for token approval
const permitParams = {
	owner: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	spender: Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"), // Uniswap
	value: BigInt("1000000000000000000"), // 1 token
	nonce: 0n,
	deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
};

// Token domain (from contract)
const domain = {
	name: "USD Coin",
	version: "2",
	chainId: ChainId(1n),
	verifyingContract: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
};

console.log("Permit params:", permitParams);
console.log("Domain:", domain);

// Create permit signature structure
const permitSignature = Permit.createPermitSignature({
	...permitParams,
	domain,
});
console.log("Permit signature structure created");

// Standard permit types (EIP-2612)
console.log("Permit types:", Permit.PERMIT_TYPES);

// Known tokens with permit support
console.log("Known tokens with permit:", Object.keys(Permit.KnownTokens));

// Example: USDC permit (uses different nonce pattern)
const usdcPermit = {
	owner: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	spender: Address("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"), // SwapRouter02
	value: BigInt("1000000"), // 1 USDC (6 decimals)
	nonce: 0n,
	deadline: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours
};

console.log("USDC Permit created:", usdcPermit);

// Example: DAI permit (uses different signature)
const daiDomain = {
	name: "Dai Stablecoin",
	version: "1",
	chainId: ChainId(1n),
	verifyingContract: Address("0x6B175474E89094C44Da98b954EescdeCB5BE3830"), // DAI
};

console.log("DAI domain:", daiDomain);
