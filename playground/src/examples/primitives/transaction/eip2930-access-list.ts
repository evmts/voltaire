import * as Address from "../../../primitives/Address/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
// EIP-2930 Transaction: Access lists for gas optimization
import * as Transaction from "../../../primitives/Transaction/index.js";

// Create EIP-2930 transaction with access list
const eip2930: Transaction.EIP2930 = {
	type: Transaction.Type.EIP2930,
	chainId: 1n, // Ethereum mainnet
	nonce: 5n,
	gasPrice: 25_000_000_000n, // 25 gwei
	gasLimit: 50_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 0n,
	data: new Uint8Array(),
	// Pre-declare which addresses and storage slots will be accessed
	accessList: [
		{
			address: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
			storageKeys: [
				Hash.from(`0x${"00".repeat(32)}`),
				Hash.from(`0x${"01".repeat(32)}`),
			],
		},
	],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Check if has access list
const hasAccessList = Transaction.hasAccessList(eip2930);

// Get access list
const accessList = Transaction.getAccessList(eip2930);
