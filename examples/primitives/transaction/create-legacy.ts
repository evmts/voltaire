/**
 * Create Legacy Transaction Example
 *
 * Demonstrates creating Legacy (Type 0) transactions with:
 * - Simple ETH transfers
 * - Contract calls with data
 * - Contract deployment
 * - EIP-155 chain ID encoding
 */

import * as Transaction from "../../../src/primitives/Transaction/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";

// Example 1: Simple ETH transfer
const transfer: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21000n, // Standard transfer gas
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: new Uint8Array(),
	v: 37n, // EIP-155: chainId=1, yParity=0 → 1*2+35+0 = 37
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

console.log("Legacy Transfer Transaction:");
console.log("  Type:", transfer.type, "(Legacy)");
console.log("  Nonce:", transfer.nonce);
console.log("  Gas Price:", transfer.gasPrice / 1_000_000_000n, "gwei");
console.log("  Gas Limit:", transfer.gasLimit);
console.log("  To:", Address.toHex(transfer.to));
console.log("  Value:", transfer.value / 1_000_000_000_000_000_000n, "ETH");
console.log("  Data:", Hex.fromBytes(transfer.data));
console.log(
	"  Chain ID:",
	Transaction.Legacy.getChainId.call(transfer),
	"(from v value)",
);
console.log("  v:", transfer.v);
console.log();

// Example 2: Contract call with data
const contractCall: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 5n,
	gasPrice: 25_000_000_000n, // 25 gwei
	gasLimit: 100_000n,
	to: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"), // DAI contract
	value: 0n,
	// ERC20 transfer(address,uint256) function call
	data: Hex.toBytes(
		"0xa9059cbb" + // Function selector
			"000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f51e3e" + // to address
			"0000000000000000000000000000000000000000000000000de0b6b3a7640000", // amount (1 DAI)
	),
	v: 37n,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Contract Call Transaction:");
console.log("  Contract:", Address.toHex(contractCall.to));
console.log("  Function: transfer(address,uint256)");
console.log("  Data Length:", contractCall.data.length, "bytes");
console.log(
	"  Gas Limit:",
	contractCall.gasLimit,
	"(higher for contract calls)",
);
console.log();

// Example 3: Contract deployment (to = null)
const bytecode = Hex.toBytes(
	"0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220",
);

const deployment: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 500_000n, // Much higher for deployment
	to: null, // null = contract creation
	value: 0n,
	data: bytecode,
	v: 37n,
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Contract Deployment Transaction:");
console.log(
	"  To:",
	deployment.to === null ? "null (contract creation)" : "address",
);
console.log("  Bytecode Length:", deployment.data.length, "bytes");
console.log("  Gas Limit:", deployment.gasLimit, "(high for deployment)");
console.log(
	"  Is Contract Creation:",
	Transaction.isContractCreation(deployment),
);
console.log();

// Example 4: Different chain IDs (EIP-155)
function createChainIdExample(chainId: bigint, chainName: string) {
	// v = chainId * 2 + 35 + yParity (yParity = 0)
	const v = chainId * 2n + 35n;

	const tx: Transaction.Legacy = {
		type: Transaction.Type.Legacy,
		nonce: 0n,
		gasPrice: 20_000_000_000n,
		gasLimit: 21000n,
		to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
		value: 1_000_000_000_000_000_000n,
		data: new Uint8Array(),
		v,
		r: Hex.toBytes("0x" + "00".repeat(32)),
		s: Hex.toBytes("0x" + "00".repeat(32)),
	};

	return {
		chainName,
		chainId,
		v,
		recoveredChainId: Transaction.Legacy.getChainId.call(tx),
	};
}

console.log("EIP-155 Chain ID Examples:");
const chains = [
	createChainIdExample(1n, "Ethereum Mainnet"),
	createChainIdExample(5n, "Goerli"),
	createChainIdExample(137n, "Polygon"),
	createChainIdExample(42161n, "Arbitrum One"),
];

for (const chain of chains) {
	console.log(`  ${chain.chainName}:`);
	console.log(`    Chain ID: ${chain.chainId}`);
	console.log(`    v value: ${chain.v}`);
	console.log(`    Recovered: ${chain.recoveredChainId}`);
}
console.log();

// Example 5: Pre-EIP-155 transaction (no chain ID)
const preEIP155: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n, // Pre-EIP-155: just 27 or 28
	r: Hex.toBytes("0x" + "00".repeat(32)),
	s: Hex.toBytes("0x" + "00".repeat(32)),
};

console.log("Pre-EIP-155 Transaction (old format):");
console.log("  v:", preEIP155.v, "(27 or 28 only, no chain ID)");
console.log(
	"  Chain ID:",
	Transaction.Legacy.getChainId.call(preEIP155),
	"(null = pre-EIP-155)",
);
console.log("  Warning: No replay protection!");
