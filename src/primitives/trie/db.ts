/**
 * In-memory database for trie storage
 *
 * Provides a simple in-memory key-value store for trie nodes.
 * Can be replaced with persistent storage (LevelDB, RocksDB, etc.)
 */

import type { Bytes, TrieDB } from "./types.js";
import { bytesToHex } from "../hex.js";

/**
 * In-memory implementation of TrieDB
 */
export class MemoryDB implements TrieDB {
	private store = new Map<string, Bytes>();

	async get(key: Bytes): Promise<Bytes | null> {
		const keyStr = bytesToHex(key);
		return this.store.get(keyStr) || null;
	}

	async put(key: Bytes, value: Bytes): Promise<void> {
		const keyStr = bytesToHex(key);
		this.store.set(keyStr, value);
	}

	async del(key: Bytes): Promise<void> {
		const keyStr = bytesToHex(key);
		this.store.delete(keyStr);
	}

	async batch(ops: Array<{ type: "put" | "del"; key: Bytes; value?: Bytes }>): Promise<void> {
		for (const op of ops) {
			if (op.type === "put" && op.value) {
				await this.put(op.key, op.value);
			} else if (op.type === "del") {
				await this.del(op.key);
			}
		}
	}

	/**
	 * Get number of entries in the database
	 */
	size(): number {
		return this.store.size;
	}

	/**
	 * Clear all entries
	 */
	clear(): void {
		this.store.clear();
	}

	/**
	 * Create a copy of this database
	 */
	copy(): MemoryDB {
		const db = new MemoryDB();
		db.store = new Map(this.store);
		return db;
	}
}
