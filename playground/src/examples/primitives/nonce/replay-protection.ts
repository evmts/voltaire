import { Nonce } from "@tevm/voltaire";

// Simulate account state
interface AccountState {
	address: string;
	nonce: bigint;
	executedTxs: Set<string>;
}

const account: AccountState = {
	address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	nonce: Nonce(0),
	executedTxs: new Set(),
};

// Function to validate and execute transaction
function validateAndExecute(txNonce: bigint, txHash: string): boolean {
	const txNum = Nonce.toNumber(txNonce);
	const accNum = Nonce.toNumber(account.nonce);

	// Check if nonce matches expected
	if (txNonce !== account.nonce) {
		if (txNonce < account.nonce) {
		} else {
		}
		return false;
	}

	// Check if transaction hash already executed
	if (account.executedTxs.has(txHash)) {
		return false;
	}
	account.nonce = Nonce.increment(account.nonce);
	account.executedTxs.add(txHash);
	return true;
}
validateAndExecute(Nonce(0), "0xabc123");
validateAndExecute(Nonce(1), "0xdef456");
validateAndExecute(Nonce(2), "0xghi789");
validateAndExecute(Nonce(0), "0xabc123");
validateAndExecute(Nonce(0), "0xnew999");
validateAndExecute(Nonce(2), "0xevil666");
validateAndExecute(Nonce(5), "0xskip555");
validateAndExecute(Nonce(3), "0xjkl012");

interface ChainState {
	chainId: number;
	accounts: Map<string, bigint>;
}

const ethereum: ChainState = {
	chainId: 1,
	accounts: new Map([
		["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", Nonce(10)],
	]),
};

const optimism: ChainState = {
	chainId: 10,
	accounts: new Map([
		["0x742d35Cc6634C0532925a3b844Bc454e4438f44e", Nonce(5)],
	]),
};

interface NonceHistory {
	nonce: bigint;
	txHash: string;
	timestamp: number;
}

const history: NonceHistory[] = [
	{ nonce: Nonce(0), txHash: "0xabc123", timestamp: 1000 },
	{ nonce: Nonce(1), txHash: "0xdef456", timestamp: 2000 },
	{ nonce: Nonce(2), txHash: "0xghi789", timestamp: 3000 },
	{ nonce: Nonce(3), txHash: "0xjkl012", timestamp: 4000 },
];
for (const entry of history) {
}
let expectedNonce = Nonce(0);
let valid = true;

for (const entry of history) {
	if (entry.nonce !== expectedNonce) {
		valid = false;
		break;
	}
	expectedNonce = Nonce.increment(expectedNonce);
}

if (valid) {
}
