import * as Nonce from "../../../primitives/Nonce/index.js";

interface Transaction {
	nonce: bigint;
	from: string;
	to: string;
	value: string;
	hash: string;
	status: "pending" | "confirmed" | "failed";
}

// Transaction pool manager
class TxPool {
	private pool: Transaction[] = [];
	private confirmedNonce: bigint;

	constructor(startNonce: bigint) {
		this.confirmedNonce = startNonce;
	}

	addPending(tx: Transaction) {
		this.pool.push(tx);
	}

	getPending(): Transaction[] {
		return this.pool.filter((tx) => tx.status === "pending");
	}

	confirmTransaction(nonce: bigint) {
		const tx = this.pool.find((t) => t.nonce === nonce);
		if (tx) {
			tx.status = "confirmed";
			this.confirmedNonce = Nonce.increment(nonce);
		}
	}

	getNextNonce(): bigint {
		const pending = this.getPending();
		if (pending.length === 0) {
			return this.confirmedNonce;
		}

		// Find highest pending nonce
		const maxPending = pending.reduce(
			(max, tx) => (tx.nonce > max ? tx.nonce : max),
			this.confirmedNonce,
		);

		return Nonce.increment(maxPending);
	}

	showStatus() {
		const pending = this.getPending();
		if (pending.length > 0) {
			for (const tx of pending.sort((a, b) => Number(a.nonce - b.nonce))) {
			}
		}
	}
}

// Initialize pool
const pool = new TxPool(Nonce.from(0));

// Add sequential transactions
pool.addPending({
	nonce: Nonce.from(0),
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: "1.0 ETH",
	hash: "0xabc123",
	status: "pending",
});

pool.addPending({
	nonce: Nonce.from(1),
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0x5aAed5930b9EB3Cd462dDbAEfA21DA757F30FbD",
	value: "0.5 ETH",
	hash: "0xdef456",
	status: "pending",
});

pool.addPending({
	nonce: Nonce.from(2),
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0x1234567890123456789012345678901234567890",
	value: "2.0 ETH",
	hash: "0xghi789",
	status: "pending",
});

pool.showStatus();
pool.confirmTransaction(Nonce.from(0));
pool.showStatus();
const nextNonce = pool.getNextNonce();

pool.addPending({
	nonce: nextNonce,
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
	value: "3.0 ETH",
	hash: "0xjkl012",
	status: "pending",
});

pool.showStatus();
pool.confirmTransaction(Nonce.from(1));
pool.confirmTransaction(Nonce.from(2));
pool.confirmTransaction(Nonce.from(3));
pool.showStatus();

pool.addPending({
	nonce: Nonce.from(4),
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeeedeed",
	value: "1.0 ETH",
	hash: "0xold111",
	status: "pending",
});
pool.showStatus();
// In real scenario, would remove old tx first
pool.addPending({
	nonce: Nonce.from(4),
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeeedeed",
	value: "1.0 ETH",
	hash: "0xnew222",
	status: "pending",
});

pool.showStatus();
