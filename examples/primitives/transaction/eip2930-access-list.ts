/**
 * EIP-2930 Access List Transaction Example
 *
 * Demonstrates EIP-2930 (Type 1) transactions with access lists for gas optimization:
 * - Creating access list transactions
 * - Building access lists for contract interactions
 * - Calculating gas savings from access lists
 * - Comparing with and without access lists
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const basic: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei (still uses fixed gas price)
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: new Uint8Array(),
	accessList: [], // Empty access list
	yParity: 0, // Note: yParity instead of v
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

// Example 2: EIP-2930 with access list for contract interaction
const tokenContract = Address.from(
	"0x6B175474E89094C44Da98b954EedeAC495271d0F",
); // DAI
const senderAddress = Address.from(
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
);
const recipientAddress = Address.from(
	"0x1234567890123456789012345678901234567890",
);

// Calculate storage slots for ERC20 balances mapping
// balances[sender] - slot 0 in DAI
function calculateMapSlot(address: Uint8Array, slot: bigint): Uint8Array {
	// keccak256(abi.encodePacked(address, slot))
	const data = new Uint8Array(64);
	// Pad address to 32 bytes (left-padded)
	data.set(new Uint8Array(12), 0); // 12 zero bytes
	data.set(address, 12); // 20-byte address
	// Pad slot to 32 bytes
	const slotBytes = new Uint8Array(32);
	const slotBigInt = slot;
	for (let i = 0; i < 32; i++) {
		slotBytes[31 - i] = Number((slotBigInt >> BigInt(i * 8)) & 0xffn);
	}
	data.set(slotBytes, 32);

	// In real usage, you'd hash this with keccak256
	// For now, return a placeholder hash
	return Hash.from(`0x${"00".repeat(31)}01`);
}

const senderBalanceSlot = calculateMapSlot(senderAddress, 0n);
const recipientBalanceSlot = calculateMapSlot(recipientAddress, 0n);

const withAccessList: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 5n,
	gasPrice: 25_000_000_000n, // 25 gwei
	gasLimit: 100_000n,
	to: tokenContract,
	value: 0n,
	// ERC20 transfer(address,uint256) call
	data: Hex.toBytes(
		"0xa9059cbb" + // transfer selector
			"0000000000000000000000001234567890123456789012345678901234567890" + // to
			"0000000000000000000000000000000000000000000000000de0b6b3a7640000", // 1 DAI
	),
	accessList: [
		{
			address: tokenContract,
			storageKeys: [senderBalanceSlot, recipientBalanceSlot],
		},
	],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

// Gas costs (Berlin hard fork)
const COLD_ACCOUNT_ACCESS = 2600n;
const COLD_SLOAD = 2100n;
const WARM_ACCOUNT_ACCESS = 100n;
const WARM_SLOAD = 100n;
const ACCESS_LIST_ADDRESS_COST = 2400n;
const ACCESS_LIST_STORAGE_KEY_COST = 1900n;

// Without access list
const withoutAccessListCost =
	COLD_ACCOUNT_ACCESS + // First access to contract
	COLD_SLOAD + // Read sender balance
	COLD_SLOAD; // Read recipient balance

// With access list
const accessListCost =
	ACCESS_LIST_ADDRESS_COST + // Add contract to list
	ACCESS_LIST_STORAGE_KEY_COST * 2n; // Add 2 storage keys

const withAccessListCost =
	WARM_ACCOUNT_ACCESS + // Contract already in list
	WARM_SLOAD + // Sender balance already in list
	WARM_SLOAD; // Recipient balance already in list

const totalWithout = withoutAccessListCost;
const totalWith = accessListCost + withAccessListCost;
const savings = totalWithout - totalWith;

// Example 4: Complex access list with multiple contracts
const uniswapRouter = Address.from(
	"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
);
const wethContract = Address.from("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

const complexAccessList: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n,
	nonce: 10n,
	gasPrice: 30_000_000_000n,
	gasLimit: 200_000n,
	to: uniswapRouter,
	value: 0n,
	data: new Uint8Array(), // Swap function call
	accessList: [
		{
			address: uniswapRouter,
			storageKeys: [], // Router state
		},
		{
			address: tokenContract,
			storageKeys: [senderBalanceSlot], // Token balance
		},
		{
			address: wethContract,
			storageKeys: [senderBalanceSlot], // WETH balance
		},
	],
	yParity: 1,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};
for (let i = 0; i < complexAccessList.accessList.length; i++) {
	const entry = complexAccessList.accessList[i];
}
const chainId = 1n;
const yParity = 0;

// Legacy v = chainId * 2 + 35 + yParity
const legacyV = chainId * 2n + 35n + BigInt(yParity);
