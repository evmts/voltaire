import { Address, Hex, Transaction } from "voltaire";
// Legacy Transaction: Create and serialize Legacy (Type 0) transaction

// Create a Legacy transaction (original Ethereum transaction type)
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21_000n, // Standard ETH transfer
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH in wei
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Serialize to bytes
const serialized = Transaction.serialize(legacy);
