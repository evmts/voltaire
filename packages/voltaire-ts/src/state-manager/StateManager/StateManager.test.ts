import { describe, expect, it, vi } from "vitest";
import type { AddressType } from "../../primitives/Address/AddressType.js";
import * as Address from "../../primitives/Address/index.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import type { Provider } from "../../provider/Provider.js";
import {
	type EthProof,
	type RpcClient,
	STATE_MANAGER_ERROR_INVALID_INPUT,
	STATE_MANAGER_ERROR_INVALID_SNAPSHOT,
	STATE_MANAGER_ERROR_NO_PENDING_REQUEST,
	STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL,
	STATE_MANAGER_ERROR_RPC_PENDING,
	STATE_MANAGER_SUCCESS,
	StateManager,
	type StateManagerFFIExports,
} from "./index.js";

const ADDR = Address.Address(
	"0x1111111111111111111111111111111111111111",
) as AddressType;
const SLOT_0 = `0x${"00".repeat(32)}` as Hex;
const SLOT_1 = `0x${"00".repeat(31)}01` as Hex;
const VAL_42 = `0x${"00".repeat(31)}2a` as Hex;
const CODE_HASH = `0x${"aa".repeat(32)}` as Hex;
const STORAGE_ROOT = `0x${"bb".repeat(32)}` as Hex;

function decodeCString(raw: string): string {
	if (typeof raw === "string") return raw.replace(/\0$/, "");
	const bytes = raw as unknown as Uint8Array;
	const nul = bytes.indexOf(0);
	return new TextDecoder().decode(nul === -1 ? bytes : bytes.subarray(0, nul));
}

function writeCString(buf: Uint8Array, text: string): void {
	buf.fill(0);
	const encoded = new TextEncoder().encode(text);
	buf.set(encoded, 0);
	buf[encoded.length] = 0;
}

interface AccountRecord {
	balance: string;
	nonce: bigint;
	code: Uint8Array;
	storage: Map<string, string>;
}

interface MockStateFfi {
	ffi: StateManagerFFIExports;
	accounts: Map<string, AccountRecord>;
	pendingRequests: Array<{ id: bigint; method: string; params: unknown[] }>;
	continuedResponses: Array<{ id: bigint; payload: unknown }>;
	destroyedHandles: bigint[];
	destroyedForkHandles: bigint[];
	checkpointDepth: number;
	commits: number;
	reverts: number;
	snapshots: Map<bigint, Map<string, AccountRecord>>;
	nextSnapshotId: bigint;
	clearedCaches: number;
	clearedForkCaches: number;
}

function cloneAccounts(
	src: Map<string, AccountRecord>,
): Map<string, AccountRecord> {
	const copy = new Map<string, AccountRecord>();
	for (const [k, v] of src.entries()) {
		copy.set(k, {
			balance: v.balance,
			nonce: v.nonce,
			code: new Uint8Array(v.code),
			storage: new Map(v.storage),
		});
	}
	return copy;
}

function createMockStateFfi(
	overrides: Partial<StateManagerFFIExports> = {},
): MockStateFfi {
	const accounts = new Map<string, AccountRecord>();
	const pendingRequests: Array<{
		id: bigint;
		method: string;
		params: unknown[];
	}> = [];
	const continuedResponses: Array<{ id: bigint; payload: unknown }> = [];
	const destroyedHandles: bigint[] = [];
	const destroyedForkHandles: bigint[] = [];
	const snapshots = new Map<bigint, Map<string, AccountRecord>>();

	const state: MockStateFfi = {
		ffi: null as unknown as StateManagerFFIExports,
		accounts,
		pendingRequests,
		continuedResponses,
		destroyedHandles,
		destroyedForkHandles,
		checkpointDepth: 0,
		commits: 0,
		reverts: 0,
		snapshots,
		nextSnapshotId: 1n,
		clearedCaches: 0,
		clearedForkCaches: 0,
	};

	const getOrCreate = (addr: string): AccountRecord => {
		const key = addr.toLowerCase();
		let rec = accounts.get(key);
		if (!rec) {
			rec = {
				balance: "0x0",
				nonce: 0n,
				code: new Uint8Array(0),
				storage: new Map(),
			};
			accounts.set(key, rec);
		}
		return rec;
	};

	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const ffi: StateManagerFFIExports = {
		state_manager_create: vi.fn(() => 10n),
		state_manager_create_with_fork: vi.fn(() => 20n),
		state_manager_destroy: vi.fn((handle: bigint) => {
			destroyedHandles.push(handle);
		}),

		fork_backend_create: vi.fn(() => 30n),
		fork_backend_destroy: vi.fn((handle: bigint) => {
			destroyedForkHandles.push(handle);
		}),
		fork_backend_clear_cache: vi.fn(() => {
			state.clearedForkCaches++;
		}),
		fork_backend_next_request: vi.fn(
			(
				_handle,
				outRequestId,
				outMethod,
				methodBufLen,
				outMethodLen,
				outParams,
				paramsBufLen,
				outParamsLen,
			) => {
				const next = pendingRequests[0];
				if (!next) return STATE_MANAGER_ERROR_NO_PENDING_REQUEST;
				const methodBytes = encoder.encode(next.method);
				const paramsBytes = encoder.encode(JSON.stringify(next.params));
				outMethodLen[0] = BigInt(methodBytes.length);
				outParamsLen[0] = BigInt(paramsBytes.length);
				if (
					methodBytes.length > methodBufLen ||
					paramsBytes.length > paramsBufLen
				) {
					return STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL;
				}
				pendingRequests.shift();
				outRequestId[0] = next.id;
				outMethod.set(methodBytes, 0);
				outParams.set(paramsBytes, 0);
				return STATE_MANAGER_SUCCESS;
			},
		),
		fork_backend_continue: vi.fn(
			(_handle, requestId, responsePtr, responseLen) => {
				const text = decoder.decode(responsePtr.subarray(0, responseLen));
				continuedResponses.push({ id: requestId, payload: JSON.parse(text) });
				return STATE_MANAGER_SUCCESS;
			},
		),

		state_manager_get_balance_sync: vi.fn((_h, addrRaw, outBuf) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			writeCString(outBuf, rec.balance);
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_set_balance: vi.fn((_h, addrRaw, balRaw) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			rec.balance = decodeCString(balRaw);
			return STATE_MANAGER_SUCCESS;
		}),

		state_manager_get_nonce_sync: vi.fn((_h, addrRaw, outNonce) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			outNonce[0] = rec.nonce;
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_set_nonce: vi.fn((_h, addrRaw, nonce) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			rec.nonce = nonce;
			return STATE_MANAGER_SUCCESS;
		}),

		state_manager_get_storage_sync: vi.fn((_h, addrRaw, slotRaw, outBuf) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			const slot = decodeCString(slotRaw);
			writeCString(outBuf, rec.storage.get(slot) ?? `0x${"00".repeat(32)}`);
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_set_storage: vi.fn((_h, addrRaw, slotRaw, valRaw) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			rec.storage.set(decodeCString(slotRaw), decodeCString(valRaw));
			return STATE_MANAGER_SUCCESS;
		}),

		state_manager_get_code_len_sync: vi.fn((_h, addrRaw, outLen) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			outLen[0] = BigInt(rec.code.length);
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_get_code_sync: vi.fn((_h, addrRaw, outBuf, bufLen) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			outBuf.set(rec.code.subarray(0, bufLen), 0);
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_set_code: vi.fn((_h, addrRaw, codePtr, codeLen) => {
			const rec = getOrCreate(decodeCString(addrRaw));
			rec.code = new Uint8Array(codePtr.subarray(0, codeLen));
			return STATE_MANAGER_SUCCESS;
		}),

		state_manager_checkpoint: vi.fn(() => {
			state.checkpointDepth++;
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_revert: vi.fn(() => {
			state.reverts++;
			state.checkpointDepth = Math.max(0, state.checkpointDepth - 1);
		}),
		state_manager_commit: vi.fn(() => {
			state.commits++;
			state.checkpointDepth = Math.max(0, state.checkpointDepth - 1);
		}),

		state_manager_snapshot: vi.fn((_h, outId) => {
			const id = state.nextSnapshotId++;
			snapshots.set(id, cloneAccounts(accounts));
			outId[0] = id;
			return STATE_MANAGER_SUCCESS;
		}),
		state_manager_revert_to_snapshot: vi.fn((_h, snapshotId) => {
			const snap = snapshots.get(snapshotId);
			if (!snap) return STATE_MANAGER_ERROR_INVALID_SNAPSHOT;
			accounts.clear();
			for (const [k, v] of snap.entries()) accounts.set(k, v);
			return STATE_MANAGER_SUCCESS;
		}),

		state_manager_clear_caches: vi.fn(() => {
			state.clearedCaches++;
		}),
		state_manager_clear_fork_cache: vi.fn(() => {
			state.clearedForkCaches++;
		}),
		...overrides,
	};

	state.ffi = ffi;
	return state;
}

describe("StateManager", () => {
	describe("lifecycle", () => {
		it("creates and destroys an in-memory StateManager", () => {
			const mock = createMockStateFfi();
			const sm = new StateManager({ ffi: mock.ffi });

			expect(mock.ffi.state_manager_create).toHaveBeenCalledTimes(1);
			expect(mock.ffi.fork_backend_create).not.toHaveBeenCalled();

			sm.destroy();
			expect(mock.destroyedHandles).toEqual([10n]);
			expect(mock.destroyedForkHandles).toEqual([]);
		});

		it("throws when state_manager_create returns null", () => {
			const mock = createMockStateFfi({
				state_manager_create: vi.fn(() => null),
			});
			expect(() => new StateManager({ ffi: mock.ffi })).toThrow(
				"Failed to create StateManager",
			);
		});

		it("creates a forked StateManager with defaults and cleans up both handles", () => {
			const mock = createMockStateFfi();
			const rpcClient: RpcClient = {
				getProof: vi.fn(async () => ({
					nonce: 0n,
					balance: 0n,
					codeHash: CODE_HASH,
					storageRoot: STORAGE_ROOT,
					storageProof: [],
				})),
				getCode: vi.fn(async () => "0x" as Hex),
			};

			const sm = new StateManager({
				ffi: mock.ffi,
				rpcClient,
				forkBlockTag: "0x112a880",
				maxCacheSize: 5000,
			});

			expect(mock.ffi.fork_backend_create).toHaveBeenCalledTimes(1);
			const call = (mock.ffi.fork_backend_create as ReturnType<typeof vi.fn>)
				.mock.calls[0];
			expect(call?.[0]).toBe(0n);
			expect(call?.[1]).toBe(0n);
			expect(decodeCString(call?.[2] as string)).toBe("0x112a880");
			expect(call?.[3]).toBe(5000);
			expect(mock.ffi.state_manager_create_with_fork).toHaveBeenCalledWith(30n);

			sm.destroy();
			expect(mock.destroyedHandles).toEqual([20n]);
			expect(mock.destroyedForkHandles).toEqual([30n]);
		});

		it("cleans up fork backend if state_manager_create_with_fork fails", () => {
			const failFork = createMockStateFfi({
				fork_backend_create: vi.fn(() => null),
			});
			const rpcClient: RpcClient = {
				getProof: vi.fn(),
				getCode: vi.fn(),
			};
			expect(() => new StateManager({ ffi: failFork.ffi, rpcClient })).toThrow(
				"Failed to create fork backend",
			);

			const failManager = createMockStateFfi({
				state_manager_create_with_fork: vi.fn(() => null),
			});
			expect(
				() => new StateManager({ ffi: failManager.ffi, rpcClient }),
			).toThrow("Failed to create StateManager with fork");
			expect(failManager.destroyedForkHandles).toEqual([30n]);
		});
	});

	describe("account state, storage, and bytecode operations", () => {
		it("reads and writes balances, nonces, storage slots, and bytecode", async () => {
			const mock = createMockStateFfi();
			const sm = new StateManager({ ffi: mock.ffi });

			expect(await sm.getBalance(ADDR)).toBe(0n);
			await sm.setBalance(ADDR, 1_000_000_000_000_000_000n);
			expect(await sm.getBalance(ADDR)).toBe(1_000_000_000_000_000_000n);

			expect(await sm.getNonce(ADDR)).toBe(0n);
			await sm.setNonce(ADDR, 42n);
			expect(await sm.getNonce(ADDR)).toBe(42n);

			expect(await sm.getStorage(ADDR, SLOT_0)).toBe(`0x${"00".repeat(32)}`);
			await sm.setStorage(ADDR, SLOT_1, VAL_42);
			expect(await sm.getStorage(ADDR, SLOT_1)).toBe(VAL_42);

			expect(await sm.getCode(ADDR)).toBe("0x");
			await sm.setCode(ADDR, "0x6080604052" as Hex);
			expect(await sm.getCode(ADDR)).toBe("0x6080604052");
		});

		it("surfaces FFI errors on state reads and writes", async () => {
			const mock = createMockStateFfi({
				state_manager_get_balance_sync: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_set_balance: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_get_nonce_sync: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_set_nonce: vi.fn(() => STATE_MANAGER_ERROR_INVALID_INPUT),
				state_manager_get_storage_sync: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_set_storage: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_get_code_len_sync: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_set_code: vi.fn(() => STATE_MANAGER_ERROR_INVALID_INPUT),
			});
			const sm = new StateManager({ ffi: mock.ffi });

			await expect(sm.getBalance(ADDR)).rejects.toThrow(
				`Failed to get balance: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.setBalance(ADDR, 1n)).rejects.toThrow(
				`Failed to set balance: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.getNonce(ADDR)).rejects.toThrow(
				`Failed to get nonce: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.setNonce(ADDR, 1n)).rejects.toThrow(
				`Failed to set nonce: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.getStorage(ADDR, SLOT_0)).rejects.toThrow(
				`Failed to get storage: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.setStorage(ADDR, SLOT_0, VAL_42)).rejects.toThrow(
				`Failed to set storage: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.getCode(ADDR)).rejects.toThrow(
				`Failed to get code length: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.setCode(ADDR, "0x6000" as Hex)).rejects.toThrow(
				`Failed to set code: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
		});

		it("surfaces get_code_sync errors after non-zero length lookup", async () => {
			const mock = createMockStateFfi({
				state_manager_get_code_len_sync: vi.fn((_h, _a, outLen) => {
					outLen[0] = 4n;
					return STATE_MANAGER_SUCCESS;
				}),
				state_manager_get_code_sync: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
			});
			const sm = new StateManager({ ffi: mock.ffi });

			await expect(sm.getCode(ADDR)).rejects.toThrow(
				`Failed to get code: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
		});
	});

	describe("checkpoints, snapshots, and caches", () => {
		it("handles checkpoints, commits, reverts, snapshots, and cache clears", async () => {
			const mock = createMockStateFfi();
			const sm = new StateManager({ ffi: mock.ffi });

			await sm.setBalance(ADDR, 100n);
			const snapId = await sm.snapshot();
			expect(snapId).toBe(1n);

			await sm.setBalance(ADDR, 500n);
			expect(await sm.getBalance(ADDR)).toBe(500n);

			await sm.revertToSnapshot(snapId);
			expect(await sm.getBalance(ADDR)).toBe(100n);

			await expect(sm.revertToSnapshot(999n)).rejects.toThrow(
				"Invalid snapshot ID: 999",
			);

			await sm.checkpoint();
			expect(mock.checkpointDepth).toBe(1);
			sm.commit();
			expect(mock.commits).toBe(1);

			await sm.checkpoint();
			sm.revert();
			expect(mock.reverts).toBe(1);

			sm.clearCaches();
			sm.clearForkCache();
			expect(mock.clearedCaches).toBe(1);
			expect(mock.clearedForkCaches).toBe(1);
		});

		it("throws on checkpoint, snapshot, and generic revertToSnapshot FFI errors", async () => {
			const mock = createMockStateFfi({
				state_manager_checkpoint: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
				state_manager_snapshot: vi.fn(() => STATE_MANAGER_ERROR_INVALID_INPUT),
				state_manager_revert_to_snapshot: vi.fn(
					() => STATE_MANAGER_ERROR_INVALID_INPUT,
				),
			});
			const sm = new StateManager({ ffi: mock.ffi });

			await expect(sm.checkpoint()).rejects.toThrow(
				`Failed to checkpoint: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.snapshot()).rejects.toThrow(
				`Failed to snapshot: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
			await expect(sm.revertToSnapshot(1n)).rejects.toThrow(
				`Failed to revert to snapshot: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);
		});
	});

	describe("async fork RPC continuation", () => {
		it("resolves eth_getProof via RpcClient including OUTPUT_TOO_SMALL buffer resize", async () => {
			const mock = createMockStateFfi();
			let pending = true;
			const largeSlotList = Array.from(
				{ length: 80 },
				(_, i) => `0x${i.toString(16).padStart(64, "0")}`,
			);

			mock.ffi.state_manager_get_balance_sync = vi.fn((_h, _a, outBuf) => {
				if (pending) {
					pending = false;
					mock.pendingRequests.push({
						id: 4n,
						method: "eth_getProof",
						params: [Address.toHex(ADDR), largeSlotList, "0x112a880"],
					});
					return STATE_MANAGER_ERROR_RPC_PENDING;
				}
				writeCString(outBuf, "0xde0b6b3a7640000");
				return STATE_MANAGER_SUCCESS;
			});

			const proof: EthProof = {
				nonce: 3n,
				balance: 1_000_000_000_000_000_000n,
				codeHash: CODE_HASH,
				storageRoot: STORAGE_ROOT,
				storageProof: [],
			};
			const rpcClient: RpcClient = {
				getProof: vi.fn(async () => proof),
				getCode: vi.fn(async () => "0x" as Hex),
			};

			const sm = new StateManager({ ffi: mock.ffi, rpcClient });
			const balance = await sm.getBalance(ADDR);

			expect(balance).toBe(1_000_000_000_000_000_000n);
			expect(rpcClient.getProof).toHaveBeenCalledTimes(1);
			expect(mock.continuedResponses).toEqual([
				{
					id: 4n,
					payload: {
						nonce: "0x3",
						balance: "0xde0b6b3a7640000",
						codeHash: CODE_HASH,
						storageHash: STORAGE_ROOT,
						storageProof: [],
					},
				},
			]);
		});

		it("resolves eth_getCode via RpcClient when getCode length or bytes are pending", async () => {
			const mock = createMockStateFfi();
			let lenPending = true;
			let bytesPending = true;

			mock.ffi.state_manager_get_code_len_sync = vi.fn((_h, _a, outLen) => {
				if (lenPending) {
					lenPending = false;
					mock.pendingRequests.push({
						id: 5n,
						method: "eth_getCode",
						params: [Address.toHex(ADDR), "latest"],
					});
					return STATE_MANAGER_ERROR_RPC_PENDING;
				}
				outLen[0] = 2n;
				return STATE_MANAGER_SUCCESS;
			});
			mock.ffi.state_manager_get_code_sync = vi.fn((_h, _a, outBuf) => {
				if (bytesPending) {
					bytesPending = false;
					mock.pendingRequests.push({
						id: 6n,
						method: "eth_getCode",
						params: [Address.toHex(ADDR), "latest"],
					});
					return STATE_MANAGER_ERROR_RPC_PENDING;
				}
				outBuf.set([0x60, 0x00], 0);
				return STATE_MANAGER_SUCCESS;
			});

			const rpcClient: RpcClient = {
				getProof: vi.fn(),
				getCode: vi.fn(async () => "0x6000" as Hex),
			};

			const sm = new StateManager({ ffi: mock.ffi, rpcClient });
			expect(await sm.getCode(ADDR)).toBe("0x6000");
			expect(rpcClient.getCode).toHaveBeenCalledTimes(2);
			expect(mock.continuedResponses).toEqual([
				{ id: 5n, payload: "0x6000" },
				{ id: 6n, payload: "0x6000" },
			]);
		});

		it("routes nonce and storage fork requests through an EIP-1193 Provider", async () => {
			const mock = createMockStateFfi();
			let noncePending = true;
			let storagePending = true;

			mock.ffi.state_manager_get_nonce_sync = vi.fn((_h, _a, outNonce) => {
				if (noncePending) {
					noncePending = false;
					mock.pendingRequests.push({
						id: 10n,
						method: "eth_getTransactionCount",
						params: [Address.toHex(ADDR), "latest"],
					});
					return STATE_MANAGER_ERROR_RPC_PENDING;
				}
				outNonce[0] = 9n;
				return STATE_MANAGER_SUCCESS;
			});
			mock.ffi.state_manager_get_storage_sync = vi.fn(
				(_h, _a, _slot, outBuf) => {
					if (storagePending) {
						storagePending = false;
						mock.pendingRequests.push({
							id: 11n,
							method: "eth_getStorageAt",
							params: [Address.toHex(ADDR), SLOT_1, "latest"],
						});
						return STATE_MANAGER_ERROR_RPC_PENDING;
					}
					writeCString(outBuf, VAL_42);
					return STATE_MANAGER_SUCCESS;
				},
			);

			const provider: Provider = {
				request: vi.fn(async ({ method }) =>
					method === "eth_getTransactionCount" ? "0x9" : VAL_42,
				),
				on: vi.fn(() => provider),
				removeListener: vi.fn(() => provider),
			};

			const sm = new StateManager({ ffi: mock.ffi, rpcClient: provider });
			expect(await sm.getNonce(ADDR)).toBe(9n);
			expect(await sm.getStorage(ADDR, SLOT_1)).toBe(VAL_42);
			expect(provider.request).toHaveBeenCalledTimes(2);
		});

		it("rejects unsupported fork methods, continue failures, and retry exhaustion", async () => {
			const rpcClient: RpcClient = {
				getProof: vi.fn(),
				getCode: vi.fn(async () => "0x" as Hex),
			};

			const badMethodMock = createMockStateFfi();
			badMethodMock.ffi.state_manager_get_balance_sync = vi.fn(() => {
				badMethodMock.pendingRequests.push({
					id: 1n,
					method: "eth_unsupported",
					params: [],
				});
				return STATE_MANAGER_ERROR_RPC_PENDING;
			});
			const badMethodSm = new StateManager({
				ffi: badMethodMock.ffi,
				rpcClient,
			});
			await expect(badMethodSm.getBalance(ADDR)).rejects.toThrow(
				"Unsupported fork method: eth_unsupported",
			);

			const badContinueMock = createMockStateFfi({
				fork_backend_continue: vi.fn(() => STATE_MANAGER_ERROR_INVALID_INPUT),
			});
			badContinueMock.ffi.state_manager_get_code_len_sync = vi.fn(() => {
				badContinueMock.pendingRequests.push({
					id: 2n,
					method: "eth_getCode",
					params: [Address.toHex(ADDR), "latest"],
				});
				return STATE_MANAGER_ERROR_RPC_PENDING;
			});
			const badContinueSm = new StateManager({
				ffi: badContinueMock.ffi,
				rpcClient,
			});
			await expect(badContinueSm.getCode(ADDR)).rejects.toThrow(
				`fork_backend_continue failed: ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
			);

			const exhaustedMock = createMockStateFfi({
				state_manager_get_balance_sync: vi.fn(
					() => STATE_MANAGER_ERROR_RPC_PENDING,
				),
				state_manager_get_nonce_sync: vi.fn(
					() => STATE_MANAGER_ERROR_RPC_PENDING,
				),
				state_manager_get_storage_sync: vi.fn(
					() => STATE_MANAGER_ERROR_RPC_PENDING,
				),
				state_manager_get_code_len_sync: vi.fn(
					() => STATE_MANAGER_ERROR_RPC_PENDING,
				),
			});
			const exhaustedSm = new StateManager({
				ffi: exhaustedMock.ffi,
				rpcClient,
			});
			await expect(exhaustedSm.getBalance(ADDR)).rejects.toThrow(
				"Failed to resolve forked balance",
			);
			await expect(exhaustedSm.getNonce(ADDR)).rejects.toThrow(
				"Failed to resolve forked nonce",
			);
			await expect(exhaustedSm.getStorage(ADDR, SLOT_0)).rejects.toThrow(
				"Failed to resolve forked storage",
			);
			await expect(exhaustedSm.getCode(ADDR)).rejects.toThrow(
				"Failed to resolve forked code",
			);
		});
	});
});
