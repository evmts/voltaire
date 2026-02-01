import { AccessList, Address, Hash } from "@tevm/voltaire";

// Scenario: Transfer USDC tokens
const usdc = Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
const sender = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const recipient = Address("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");

// Storage slots for ERC-20 balances (keccak256 of address + slot)
// Simplified: using placeholder slots for demonstration
const senderBalanceSlot = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000001",
);
const recipientBalanceSlot = Hash(
	"0x0000000000000000000000000000000000000000000000000000000000000002",
);

// Build access list for token transfer
const accessList = AccessList([
	{
		address: usdc,
		storageKeys: [senderBalanceSlot, recipientBalanceSlot],
	},
]);

// Gas analysis
const cost = AccessList.gasCost(accessList);
const savings = AccessList.gasSavings(accessList);

// EIP-2930 transaction structure
const transaction = {
	type: 1, // EIP-2930
	chainId: 1,
	nonce: 42,
	gasPrice: 50000000000n, // 50 gwei
	gasLimit: 100000n,
	to: usdc,
	value: 0n,
	data: "0xa9059cbb...", // transfer(address,uint256)
	accessList: accessList,
};
