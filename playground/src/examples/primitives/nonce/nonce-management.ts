import { Nonce } from "@tevm/voltaire";

// Strategy 1: Simple sequential nonce tracker
class SimpleNonceTracker {
	private current: bigint;

	constructor(startNonce: bigint) {
		this.current = startNonce;
	}

	getNext(): bigint {
		const nonce = this.current;
		this.current = Nonce.increment(this.current);
		return nonce;
	}

	peek(): bigint {
		return this.current;
	}
}
const tracker = new SimpleNonceTracker(Nonce(0));

// Strategy 2: Nonce tracker with pending awareness
class PendingAwareTracker {
	private confirmed: bigint;
	private pending: Set<bigint>;

	constructor(confirmedNonce: bigint) {
		this.confirmed = confirmedNonce;
		this.pending = new Set();
	}

	getNext(): bigint {
		// Find lowest available nonce
		let candidate = this.confirmed;
		while (this.pending.has(candidate)) {
			candidate = Nonce.increment(candidate);
		}
		this.pending.add(candidate);
		return candidate;
	}

	confirm(nonce: bigint): void {
		this.pending.delete(nonce);
		if (nonce === this.confirmed) {
			// Update confirmed to highest sequential confirmed nonce
			this.confirmed = Nonce.increment(nonce);
			while (this.pending.has(this.confirmed)) {
				this.pending.delete(this.confirmed);
				this.confirmed = Nonce.increment(this.confirmed);
			}
		}
	}

	reject(nonce: bigint): void {
		this.pending.delete(nonce);
	}

	getStatus() {
		return {
			confirmed: this.confirmed,
			pending: Array.from(this.pending).sort((a, b) => Number(a - b)),
		};
	}
}
const advTracker = new PendingAwareTracker(Nonce(0));

const nonce1 = advTracker.getNext();

const nonce2 = advTracker.getNext();

const nonce3 = advTracker.getNext();

let status = advTracker.getStatus();
advTracker.confirm(nonce2);
status = advTracker.getStatus();
advTracker.confirm(nonce1);
status = advTracker.getStatus();

// Strategy 3: Nonce reservation system
class NonceReservationSystem {
	private current: bigint;
	private reserved: Map<string, bigint>;

	constructor(startNonce: bigint) {
		this.current = startNonce;
		this.reserved = new Map();
	}

	reserve(txId: string): bigint {
		if (this.reserved.has(txId)) {
			return this.reserved.get(txId)!;
		}
		const nonce = this.current;
		this.reserved.set(txId, nonce);
		this.current = Nonce.increment(this.current);
		return nonce;
	}

	release(txId: string): void {
		this.reserved.delete(txId);
	}

	commit(txId: string): bigint | null {
		const nonce = this.reserved.get(txId);
		if (nonce !== undefined) {
			this.reserved.delete(txId);
			return nonce;
		}
		return null;
	}

	showReservations(): void {
		for (const [txId, nonce] of this.reserved) {
		}
	}
}
const reservationSystem = new NonceReservationSystem(Nonce(0));
const reserved1 = reservationSystem.reserve("tx-001");
const reserved2 = reservationSystem.reserve("tx-002");
const reserved3 = reservationSystem.reserve("tx-003");

reservationSystem.showReservations();
const committed = reservationSystem.commit("tx-002");

reservationSystem.showReservations();
reservationSystem.release("tx-003");

reservationSystem.showReservations();

class MultiAccountNonceManager {
	private accounts: Map<string, bigint>;

	constructor() {
		this.accounts = new Map();
	}

	initialize(address: string, nonce: bigint): void {
		this.accounts.set(address.toLowerCase(), nonce);
	}

	getNext(address: string): bigint {
		const key = address.toLowerCase();
		const current = this.accounts.get(key) ?? Nonce(0);
		this.accounts.set(key, Nonce.increment(current));
		return current;
	}

	peek(address: string): bigint {
		return this.accounts.get(address.toLowerCase()) ?? Nonce(0);
	}

	showAll(): void {
		for (const [addr, nonce] of this.accounts) {
		}
	}
}

const multiManager = new MultiAccountNonceManager();

multiManager.initialize("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", Nonce(5));
multiManager.initialize(
	"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	Nonce(10),
);
multiManager.initialize("0x5aAed5930b9EB3Cd462dDbAEfA21DA757F30FbD", Nonce(0));

multiManager.showAll();

multiManager.showAll();
