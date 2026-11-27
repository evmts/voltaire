import { describe, expect, it, vi } from "vitest";
import * as Address from "../../primitives/Address/index.js";
import type { Hex } from "../../primitives/Hex/HexType.js";
import * as HexUtils from "../../primitives/Hex/index.js";
import { MockRpcClient } from "../../provider/test-utils/MockRpcClient.js";
import {
	type EthProof,
	type RpcClient,
	STATE_MANAGER_ERROR_INVALID_HEX,
	STATE_MANAGER_ERROR_INVALID_INPUT,
	STATE_MANAGER_ERROR_INVALID_REQUEST,
	STATE_MANAGER_ERROR_INVALID_SNAPSHOT,
	STATE_MANAGER_ERROR_NO_PENDING_REQUEST,
	STATE_MANAGER_ERROR_OUT_OF_MEMORY,
	STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL,
	STATE_MANAGER_ERROR_RPC_FAILED,
	STATE_MANAGER_ERROR_RPC_PENDING,
	STATE_MANAGER_SUCCESS,
	StateManager,
	type StateManagerFFIExports,
} from "./index.js";

const ALICE = Address.Address("0x1111111111111111111111111111111111111111");
const BOB = Address.Address("0x2222222222222222222222222222222222222222");
const CONTRACT = Address.Address("0x3333333333333333333333333333333333333333");
const SLOT_0 =
	"0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;
const SLOT_1 =
	"0x0000000000000000000000000000000000000000000000000000000000000001" as Hex;
const VAL_A =
	"0x000000000000000000000000000000000000000000000000000000000000002a" as Hex;
const VAL_B =
	"0xdeadbeef00000000000000000000000000000000000000000000000000001234" as Hex;

interface AccountRecord {
	balance: bigint;
	nonce: bigint;
	code: Uint8Array;
	storage: Map<string, string>;
}

interface PendingForkRequest {
	requestId: bigint;
	method: string;
	params: unknown[];
	onResponse: (response: unknown) => void;
}

interface SimulatorState {
	accounts: Map<string, AccountRecord>;
	checkpoints: Array<Map<string, AccountRecord>>;
	snapshots: Map<bigint, number>;
	nextSnapshotId: bigint;
	forkBackendHandle: bigint | null;
	clearedCachesCount: number;
	clearedForkCacheCount: number;
}

interface ForkBackendState {
	blockTag: string;
	maxCacheSize: number;
	pending: PendingForkRequest[];
	nextRequestId: bigint;
	resolvedAccounts: Set<string>;
	resolvedCode: Set<string>;
}

function decodeCString(input: string | Uint8Array): string {
	if (typeof input === "string") {
		const nul = input.indexOf("\0");
		return nul === -1 ? input : input.slice(0, nul);
	}
	const nul = input.indexOf(0);
	const slice = nul === -1 ? input : input.subarray(0, nul);
	return new TextDecoder().decode(slice);
}

function writeNullTerminated(target: Uint8Array, text: string): number {
	const bytes = new TextEncoder().encode(text);
	if (bytes.length + 1 > target.length) {
		return STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL;
	}
	target.set(bytes, 0);
	target[bytes.length] = 0;
	return STATE_MANAGER_SUCCESS;
}

function cloneAccounts(
	source: Map<string, AccountRecord>,
): Map<string, AccountRecord> {
	const copy = new Map<string, AccountRecord>();
	for (const [addr, rec] of source.entries()) {
		copy.set(addr, {
			balance: rec.balance,
			nonce: rec.nonce,
			code: new Uint8Array(rec.code),
			storage: new Map(rec.storage),
		});
	}
	return copy;
}

function createStateManagerFFISimulator() {
	let nextHandle = 100n;
	const managers = new Map<bigint, SimulatorState>();
	const forkBackends = new Map<bigint, ForkBackendState>();
	const destroyedManagers: bigint[] = [];
	const destroyedForkBackends: bigint[] = [];

	function getManager(handle: bigint): SimulatorState {
		const state = managers.get(handle);
		if (!state) {
			throw new Error(`Unknown StateManager handle ${handle}`);
		}
		return state;
	}

	function getAccount(state: SimulatorState, addr: string): AccountRecord {
		const key = addr.toLowerCase();
		let rec = state.accounts.get(key);
		if (!rec) {
			rec = {
				balance: 0n,
				nonce: 0n,
				code: new Uint8Array(0),
				storage: new Map(),
			};
			state.accounts.set(key, rec);
		}
		return rec;
	}

	function queueAccountProofIfForked(
		state: SimulatorState,
		addr: string,
		slots: string[] = [],
	): boolean {
		if (!state.forkBackendHandle) return false;
		const fb = forkBackends.get(state.forkBackendHandle);
		if (!fb) return false;
		const key = addr.toLowerCase();
		if (fb.resolvedAccounts.has(key) && slots.length === 0) return false;
		if (
			fb.resolvedAccounts.has(key) &&
			slots.every((s) => state.accounts.get(key)?.storage.has(s.toLowerCase()))
		) {
			return false;
		}
		const requestId = fb.nextRequestId++;
		fb.pending.push({
			requestId,
			method: "eth_getProof",
			params: [key, slots, fb.blockTag],
			onResponse: (response: unknown) => {
				const proof = response as {
					balance: string;
					nonce: string;
					storageProof?: Array<{ key: string; value: string }>;
				};
				const rec = getAccount(state, key);
				rec.balance = BigInt(proof.balance);
				rec.nonce = BigInt(proof.nonce);
				if (proof.storageProof) {
					for (const item of proof.storageProof) {
						const padded = `0x${BigInt(item.value).toString(16).padStart(64, "0")}`;
						rec.storage.set(item.key.toLowerCase(), padded);
					}
				}
				fb.resolvedAccounts.add(key);
			},
		});
		return true;
	}

	function queueCodeIfForked(state: SimulatorState, addr: string): boolean {
		if (!state.forkBackendHandle) return false;
		const fb = forkBackends.get(state.forkBackendHandle);
		if (!fb) return false;
		const key = addr.toLowerCase();
		if (fb.resolvedCode.has(key)) return false;
		const requestId = fb.nextRequestId++;
		fb.pending.push({
			requestId,
			method: "eth_getCode",
			params: [key, fb.blockTag],
			onResponse: (response: unknown) => {
				const hex = response as Hex;
				const rec = getAccount(state, key);
				rec.code = hex === "0x" ? new Uint8Array(0) : HexUtils.toBytes(hex);
				fb.resolvedCode.add(key);
			},
		});
		return true;
	}

	const ffi: StateManagerFFIExports = {
		state_manager_create: () => {
			const handle = nextHandle++;
			managers.set(handle, {
				accounts: new Map(),
				checkpoints: [],
				snapshots: new Map(),
				nextSnapshotId: 0n,
				forkBackendHandle: null,
				clearedCachesCount: 0,
				clearedForkCacheCount: 0,
			});
			return handle;
		},

		state_manager_create_with_fork: (forkBackend: bigint) => {
			if (!forkBackends.has(forkBackend)) return null;
			const handle = nextHandle++;
			managers.set(handle, {
				accounts: new Map(),
				checkpoints: [],
				snapshots: new Map(),
				nextSnapshotId: 0n,
				forkBackendHandle: forkBackend,
				clearedCachesCount: 0,
				clearedForkCacheCount: 0,
			});
			return handle;
		},

		state_manager_destroy: (handle: bigint) => {
			destroyedManagers.push(handle);
			managers.delete(handle);
		},

		fork_backend_create: (
			_rpcClientPtr: bigint,
			_vtablePtr: bigint,
			blockTag: string,
			maxCacheSize: number,
		) => {
			const handle = nextHandle++;
			forkBackends.set(handle, {
				blockTag: decodeCString(blockTag),
				maxCacheSize,
				pending: [],
				nextRequestId: 1n,
				resolvedAccounts: new Set(),
				resolvedCode: new Set(),
			});
			return handle;
		},

		fork_backend_destroy: (handle: bigint) => {
			destroyedForkBackends.push(handle);
			forkBackends.delete(handle);
		},

		fork_backend_clear_cache: (handle: bigint) => {
			const fb = forkBackends.get(handle);
			if (fb) {
				fb.resolvedAccounts.clear();
				fb.resolvedCode.clear();
			}
		},

		fork_backend_next_request: (
			handle: bigint,
			outRequestId: BigUint64Array,
			outMethod: Uint8Array,
			methodBufLen: number,
			outMethodLen: BigUint64Array,
			outParams: Uint8Array,
			paramsBufLen: number,
			outParamsLen: BigUint64Array,
		) => {
			const fb = forkBackends.get(handle);
			if (!fb) return STATE_MANAGER_ERROR_INVALID_INPUT;
			const req = fb.pending[0];
			if (!req) return STATE_MANAGER_ERROR_NO_PENDING_REQUEST;

			const encoder = new TextEncoder();
			const methodBytes = encoder.encode(req.method);
			const paramsBytes = encoder.encode(JSON.stringify(req.params));
			outMethodLen[0] = BigInt(methodBytes.length);
			outParamsLen[0] = BigInt(paramsBytes.length);

			if (
				methodBytes.length > methodBufLen ||
				paramsBytes.length > paramsBufLen
			) {
				return STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL;
			}

			outRequestId[0] = req.requestId;
			outMethod.set(methodBytes, 0);
			outParams.set(paramsBytes, 0);
			return STATE_MANAGER_SUCCESS;
		},

		fork_backend_continue: (
			handle: bigint,
			requestId: bigint,
			responsePtr: Uint8Array,
			responseLen: number,
		) => {
			const fb = forkBackends.get(handle);
			if (!fb) return STATE_MANAGER_ERROR_INVALID_INPUT;
			const idx = fb.pending.findIndex((r) => r.requestId === requestId);
			if (idx === -1) return STATE_MANAGER_ERROR_INVALID_REQUEST;
			const [req] = fb.pending.splice(idx, 1);
			if (!req) return STATE_MANAGER_ERROR_INVALID_REQUEST;
			const json = new TextDecoder().decode(
				responsePtr.subarray(0, responseLen),
			);
			req.onResponse(JSON.parse(json));
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_get_balance_sync: (
			handle: bigint,
			addressHex: string,
			outBuffer: Uint8Array,
			_bufferLen: number,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			if (!state.accounts.has(addr) && queueAccountProofIfForked(state, addr)) {
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			const rec = state.accounts.get(addr);
			const balanceHex = `0x${(rec?.balance ?? 0n).toString(16).padStart(64, "0")}`;
			return writeNullTerminated(outBuffer, balanceHex);
		},

		state_manager_set_balance: (
			handle: bigint,
			addressHex: string,
			balanceHex: string,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const rec = getAccount(state, addr);
			rec.balance = BigInt(decodeCString(balanceHex));
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_get_nonce_sync: (
			handle: bigint,
			addressHex: string,
			outNonce: BigUint64Array,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			if (!state.accounts.has(addr) && queueAccountProofIfForked(state, addr)) {
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			const rec = state.accounts.get(addr);
			outNonce[0] = rec?.nonce ?? 0n;
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_set_nonce: (
			handle: bigint,
			addressHex: string,
			nonce: bigint,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const rec = getAccount(state, addr);
			rec.nonce = nonce;
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_get_storage_sync: (
			handle: bigint,
			addressHex: string,
			slotHex: string,
			outBuffer: Uint8Array,
			_bufferLen: number,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const slot = decodeCString(slotHex).toLowerCase();
			const hasSlot = state.accounts.get(addr)?.storage.has(slot) ?? false;
			if (!hasSlot && queueAccountProofIfForked(state, addr, [slot])) {
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			const val =
				state.accounts.get(addr)?.storage.get(slot) ?? `0x${"0".repeat(64)}`;
			return writeNullTerminated(outBuffer, val);
		},

		state_manager_set_storage: (
			handle: bigint,
			addressHex: string,
			slotHex: string,
			valueHex: string,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const slot = decodeCString(slotHex).toLowerCase();
			const value = decodeCString(valueHex).toLowerCase();
			const rec = getAccount(state, addr);
			rec.storage.set(slot, value);
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_get_code_len_sync: (
			handle: bigint,
			addressHex: string,
			outLen: BigUint64Array,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const existing = state.accounts.get(addr);
			const hasLocalCode = existing !== undefined && existing.code.length > 0;
			if (!hasLocalCode && queueCodeIfForked(state, addr)) {
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			outLen[0] = BigInt(existing?.code.length ?? 0);
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_get_code_sync: (
			handle: bigint,
			addressHex: string,
			outBuffer: Uint8Array,
			bufferLen: number,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const code = state.accounts.get(addr)?.code ?? new Uint8Array(0);
			if (code.length > bufferLen) {
				return STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL;
			}
			outBuffer.set(code, 0);
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_set_code: (
			handle: bigint,
			addressHex: string,
			codePtr: Uint8Array,
			codeLen: number,
		) => {
			const state = getManager(handle);
			const addr = decodeCString(addressHex).toLowerCase();
			const rec = getAccount(state, addr);
			rec.code = new Uint8Array(codePtr.subarray(0, codeLen));
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_checkpoint: (handle: bigint) => {
			const state = getManager(handle);
			state.checkpoints.push(cloneAccounts(state.accounts));
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_revert: (handle: bigint) => {
			const state = getManager(handle);
			const prev = state.checkpoints.pop();
			if (prev) {
				state.accounts = prev;
			}
		},

		state_manager_commit: (handle: bigint) => {
			const state = getManager(handle);
			state.checkpoints.pop();
		},

		state_manager_snapshot: (handle: bigint, outSnapshotId: BigUint64Array) => {
			const state = getManager(handle);
			const id = state.nextSnapshotId++;
			state.snapshots.set(id, state.checkpoints.length);
			state.checkpoints.push(cloneAccounts(state.accounts));
			outSnapshotId[0] = id;
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_revert_to_snapshot: (handle: bigint, snapshotId: bigint) => {
			const state = getManager(handle);
			const targetDepth = state.snapshots.get(snapshotId);
			if (targetDepth === undefined) {
				return STATE_MANAGER_ERROR_INVALID_SNAPSHOT;
			}
			while (state.checkpoints.length > targetDepth) {
				const prev = state.checkpoints.pop();
				if (prev) {
					state.accounts = prev;
				}
			}
			for (const id of Array.from(state.snapshots.keys())) {
				if (id >= snapshotId) {
					state.snapshots.delete(id);
				}
			}
			return STATE_MANAGER_SUCCESS;
		},

		state_manager_clear_caches: (handle: bigint) => {
			const state = getManager(handle);
			state.clearedCachesCount++;
			state.accounts.clear();
			if (state.forkBackendHandle) {
				const fb = forkBackends.get(state.forkBackendHandle);
				if (fb) {
					fb.resolvedAccounts.clear();
					fb.resolvedCode.clear();
				}
			}
		},

		state_manager_clear_fork_cache: (handle: bigint) => {
			const state = getManager(handle);
			state.clearedForkCacheCount++;
			if (state.forkBackendHandle) {
				const fb = forkBackends.get(state.forkBackendHandle);
				if (fb) {
					fb.resolvedAccounts.clear();
					fb.resolvedCode.clear();
				}
			}
		},
	};

	return {
		ffi,
		managers,
		forkBackends,
		destroyedManagers,
		destroyedForkBackends,
	};
}

describe("StateManager error code constants", () => {
	it("exports exact c_api.zig error codes", () => {
		expect(STATE_MANAGER_SUCCESS).toBe(0);
		expect(STATE_MANAGER_ERROR_INVALID_INPUT).toBe(-1);
		expect(STATE_MANAGER_ERROR_OUT_OF_MEMORY).toBe(-2);
		expect(STATE_MANAGER_ERROR_INVALID_SNAPSHOT).toBe(-3);
		expect(STATE_MANAGER_ERROR_RPC_FAILED).toBe(-4);
		expect(STATE_MANAGER_ERROR_INVALID_HEX).toBe(-5);
		expect(STATE_MANAGER_ERROR_RPC_PENDING).toBe(-6);
		expect(STATE_MANAGER_ERROR_NO_PENDING_REQUEST).toBe(-7);
		expect(STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL).toBe(-8);
		expect(STATE_MANAGER_ERROR_INVALID_REQUEST).toBe(-9);
	});
});

describe("StateManager lifecycle & construction", () => {
	it("creates and destroys in-memory StateManager", () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		expect(sim.managers.size).toBe(1);
		expect(sim.forkBackends.size).toBe(0);

		sm.destroy();
		expect(sim.managers.size).toBe(0);
		expect(sim.destroyedManagers).toHaveLength(1);
		expect(sim.destroyedForkBackends).toHaveLength(0);
	});

	it("creates fork-backed StateManager with default and custom options", () => {
		const sim = createStateManagerFFISimulator();
		const mockRpc = new MockRpcClient();

		const defaultSm = new StateManager({
			ffi: sim.ffi,
			rpcClient: mockRpc,
		});
		const [defaultFb] = Array.from(sim.forkBackends.values());
		expect(defaultFb?.blockTag).toBe("latest");
		expect(defaultFb?.maxCacheSize).toBe(10000);
		defaultSm.destroy();

		const customSm = new StateManager({
			ffi: sim.ffi,
			rpcClient: mockRpc,
			forkBlockTag: "0x112a880",
			maxCacheSize: 2048,
		});
		const [customFb] = Array.from(sim.forkBackends.values());
		expect(customFb?.blockTag).toBe("0x112a880");
		expect(customFb?.maxCacheSize).toBe(2048);

		customSm.destroy();
		expect(sim.managers.size).toBe(0);
		expect(sim.forkBackends.size).toBe(0);
		expect(sim.destroyedForkBackends).toHaveLength(2);
	});

	it("throws when state_manager_create returns null", () => {
		const sim = createStateManagerFFISimulator();
		sim.ffi.state_manager_create = () => null;
		expect(() => new StateManager({ ffi: sim.ffi })).toThrow(
			"Failed to create StateManager",
		);
	});

	it("throws when fork_backend_create returns null", () => {
		const sim = createStateManagerFFISimulator();
		sim.ffi.fork_backend_create = () => null;
		expect(
			() => new StateManager({ ffi: sim.ffi, rpcClient: new MockRpcClient() }),
		).toThrow("Failed to create fork backend");
	});

	it("cleans up fork backend if state_manager_create_with_fork fails", () => {
		const sim = createStateManagerFFISimulator();
		sim.ffi.state_manager_create_with_fork = () => null;

		expect(
			() => new StateManager({ ffi: sim.ffi, rpcClient: new MockRpcClient() }),
		).toThrow("Failed to create StateManager with fork");
		expect(sim.destroyedForkBackends).toHaveLength(1);
		expect(sim.forkBackends.size).toBe(0);
	});
});

describe("StateManager state operations", () => {
	it("gets and sets account balances including 0n and max u256", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		expect(await sm.getBalance(ALICE)).toBe(0n);

		await sm.setBalance(ALICE, 1_000_000_000_000_000_000n);
		expect(await sm.getBalance(ALICE)).toBe(1_000_000_000_000_000_000n);

		const maxU256 = (1n << 256n) - 1n;
		await sm.setBalance(BOB, maxU256);
		expect(await sm.getBalance(BOB)).toBe(maxU256);

		await sm.setBalance(ALICE, 0n);
		expect(await sm.getBalance(ALICE)).toBe(0n);

		sm.destroy();
	});

	it("gets and sets account nonces including max u64", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		expect(await sm.getNonce(ALICE)).toBe(0n);

		await sm.setNonce(ALICE, 42n);
		expect(await sm.getNonce(ALICE)).toBe(42n);

		const maxU64 = (1n << 64n) - 1n;
		await sm.setNonce(BOB, maxU64);
		expect(await sm.getNonce(BOB)).toBe(maxU64);

		sm.destroy();
	});

	it("gets and sets storage slots independently per account and slot", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		expect(await sm.getStorage(CONTRACT, SLOT_0)).toBe(`0x${"0".repeat(64)}`);

		await sm.setStorage(CONTRACT, SLOT_0, VAL_A);
		await sm.setStorage(CONTRACT, SLOT_1, VAL_B);
		await sm.setStorage(ALICE, SLOT_0, VAL_B);

		expect(await sm.getStorage(CONTRACT, SLOT_0)).toBe(VAL_A);
		expect(await sm.getStorage(CONTRACT, SLOT_1)).toBe(VAL_B);
		expect(await sm.getStorage(ALICE, SLOT_0)).toBe(VAL_B);

		sm.destroy();
	});

	it("gets and sets contract bytecode including empty code", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		expect(await sm.getCode(CONTRACT)).toBe("0x");

		const bytecode = "0x6080604052348015600f57600080fd5b50" as Hex;
		await sm.setCode(CONTRACT, bytecode);
		expect(await sm.getCode(CONTRACT)).toBe(bytecode);

		await sm.setCode(CONTRACT, "0x" as Hex);
		expect(await sm.getCode(CONTRACT)).toBe("0x");

		sm.destroy();
	});

	it("propagates FFI errors from state getters and setters", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		sim.ffi.state_manager_get_balance_sync = () =>
			STATE_MANAGER_ERROR_INVALID_HEX;
		await expect(sm.getBalance(ALICE)).rejects.toThrow(
			`Failed to get balance: error ${STATE_MANAGER_ERROR_INVALID_HEX}`,
		);

		sim.ffi.state_manager_set_balance = () => STATE_MANAGER_ERROR_OUT_OF_MEMORY;
		await expect(sm.setBalance(ALICE, 1n)).rejects.toThrow(
			`Failed to set balance: error ${STATE_MANAGER_ERROR_OUT_OF_MEMORY}`,
		);

		sim.ffi.state_manager_get_nonce_sync = () =>
			STATE_MANAGER_ERROR_INVALID_INPUT;
		await expect(sm.getNonce(ALICE)).rejects.toThrow(
			`Failed to get nonce: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
		);

		sim.ffi.state_manager_set_nonce = () => STATE_MANAGER_ERROR_INVALID_INPUT;
		await expect(sm.setNonce(ALICE, 1n)).rejects.toThrow(
			`Failed to set nonce: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
		);

		sim.ffi.state_manager_get_storage_sync = () =>
			STATE_MANAGER_ERROR_RPC_FAILED;
		await expect(sm.getStorage(CONTRACT, SLOT_0)).rejects.toThrow(
			`Failed to get storage: error ${STATE_MANAGER_ERROR_RPC_FAILED}`,
		);

		sim.ffi.state_manager_set_storage = () => STATE_MANAGER_ERROR_INVALID_HEX;
		await expect(sm.setStorage(CONTRACT, SLOT_0, VAL_A)).rejects.toThrow(
			`Failed to set storage: error ${STATE_MANAGER_ERROR_INVALID_HEX}`,
		);

		sim.ffi.state_manager_get_code_len_sync = () =>
			STATE_MANAGER_ERROR_RPC_FAILED;
		await expect(sm.getCode(CONTRACT)).rejects.toThrow(
			`Failed to get code length: error ${STATE_MANAGER_ERROR_RPC_FAILED}`,
		);

		sim.ffi.state_manager_get_code_len_sync = (_h, _a, outLen) => {
			outLen[0] = 4n;
			return STATE_MANAGER_SUCCESS;
		};
		sim.ffi.state_manager_get_code_sync = () =>
			STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL;
		await expect(sm.getCode(CONTRACT)).rejects.toThrow(
			`Failed to get code: error ${STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL}`,
		);

		sim.ffi.state_manager_set_code = () => STATE_MANAGER_ERROR_OUT_OF_MEMORY;
		await expect(sm.setCode(CONTRACT, "0x6000" as Hex)).rejects.toThrow(
			`Failed to set code: error ${STATE_MANAGER_ERROR_OUT_OF_MEMORY}`,
		);

		sm.destroy();
	});
});

describe("StateManager checkpoints, snapshots, and caches", () => {
	it("supports checkpoint, commit, and revert across nested frames", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		await sm.setBalance(ALICE, 100n);
		await sm.setNonce(ALICE, 1n);
		await sm.setStorage(CONTRACT, SLOT_0, VAL_A);

		// Outer checkpoint
		await sm.checkpoint();
		await sm.setBalance(ALICE, 200n);

		// Inner checkpoint -> revert restores outer state
		await sm.checkpoint();
		await sm.setBalance(ALICE, 999n);
		await sm.setNonce(ALICE, 99n);
		await sm.setStorage(CONTRACT, SLOT_0, VAL_B);
		sm.revert();

		expect(await sm.getBalance(ALICE)).toBe(200n);
		expect(await sm.getNonce(ALICE)).toBe(1n);
		expect(await sm.getStorage(CONTRACT, SLOT_0)).toBe(VAL_A);

		// Inner checkpoint -> commit merges into outer frame
		await sm.checkpoint();
		await sm.setNonce(ALICE, 5n);
		sm.commit();
		expect(await sm.getNonce(ALICE)).toBe(5n);

		// Outer commit persists everything
		sm.commit();
		expect(await sm.getBalance(ALICE)).toBe(200n);
		expect(await sm.getNonce(ALICE)).toBe(5n);

		sm.destroy();
	});

	it("throws when checkpoint FFI call fails", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		sim.ffi.state_manager_checkpoint = () => STATE_MANAGER_ERROR_OUT_OF_MEMORY;
		await expect(sm.checkpoint()).rejects.toThrow(
			`Failed to checkpoint: error ${STATE_MANAGER_ERROR_OUT_OF_MEMORY}`,
		);
		sm.destroy();
	});

	it("creates snapshots, reverts to target ID, and invalidates newer snapshots", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		await sm.setBalance(ALICE, 1000n);
		await sm.setCode(CONTRACT, "0x6001" as Hex);

		const snap0 = await sm.snapshot();
		expect(snap0).toBe(0n);

		await sm.setBalance(ALICE, 2000n);
		const snap1 = await sm.snapshot();
		expect(snap1).toBe(1n);

		await sm.setBalance(ALICE, 3000n);
		await sm.setCode(CONTRACT, "0x60026003" as Hex);

		await sm.revertToSnapshot(snap0);
		expect(await sm.getBalance(ALICE)).toBe(1000n);
		expect(await sm.getCode(CONTRACT)).toBe("0x6001");

		// Both snap0 (consumed) and snap1 (newer) are now invalid
		await expect(sm.revertToSnapshot(snap1)).rejects.toThrow(
			"Invalid snapshot ID: 1",
		);
		await expect(sm.revertToSnapshot(snap0)).rejects.toThrow(
			"Invalid snapshot ID: 0",
		);

		sm.destroy();
	});

	it("throws on snapshot and revertToSnapshot FFI errors", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		sim.ffi.state_manager_snapshot = () => STATE_MANAGER_ERROR_OUT_OF_MEMORY;
		await expect(sm.snapshot()).rejects.toThrow(
			`Failed to snapshot: error ${STATE_MANAGER_ERROR_OUT_OF_MEMORY}`,
		);

		sim.ffi.state_manager_revert_to_snapshot = () =>
			STATE_MANAGER_ERROR_INVALID_INPUT;
		await expect(sm.revertToSnapshot(7n)).rejects.toThrow(
			`Failed to revert to snapshot: error ${STATE_MANAGER_ERROR_INVALID_INPUT}`,
		);

		sm.destroy();
	});

	it("invokes cache clearing FFI functions", async () => {
		const sim = createStateManagerFFISimulator();
		const sm = new StateManager({ ffi: sim.ffi });

		await sm.setBalance(ALICE, 500n);
		sm.clearForkCache();
		expect(await sm.getBalance(ALICE)).toBe(500n);

		sm.clearCaches();
		expect(await sm.getBalance(ALICE)).toBe(0n);

		const [state] = Array.from(sim.managers.values());
		expect(state?.clearedForkCacheCount).toBe(1);
		expect(state?.clearedCachesCount).toBe(1);

		sm.destroy();
	});
});

describe("StateManager fork mode async continuation", () => {
	it("fetches balance, nonce, storage, and code through EIP-1193 Provider", async () => {
		const sim = createStateManagerFFISimulator();
		const mockRpc = new MockRpcClient();
		const storage = new Map<bigint, bigint>([[1n, 0x1234n]]);
		mockRpc.setAccount(Address.toHex(CONTRACT), {
			balance: 5_000_000_000n,
			nonce: 7n,
			code: "0x6080604052",
			storage,
		});

		const sm = new StateManager({
			ffi: sim.ffi,
			rpcClient: mockRpc,
			forkBlockTag: "0x10",
		});

		expect(await sm.getBalance(CONTRACT)).toBe(5_000_000_000n);
		expect(await sm.getNonce(CONTRACT)).toBe(7n);
		expect(await sm.getStorage(CONTRACT, SLOT_1)).toBe(
			`0x${0x1234n.toString(16).padStart(64, "0")}`,
		);
		expect(await sm.getCode(CONTRACT)).toBe("0x6080604052");

		sm.destroy();
	});

	it("fetches account proof and code through RpcClient interface", async () => {
		const sim = createStateManagerFFISimulator();
		const getProof = vi.fn(
			async (
				_address: typeof CONTRACT,
				slots: readonly Hex[],
				_blockTag: string,
			): Promise<EthProof> => ({
				nonce: 12n,
				balance: 987654321n,
				codeHash: `0x${"aa".repeat(32)}` as Hex,
				storageRoot: `0x${"bb".repeat(32)}` as Hex,
				storageProof: slots.map((key) => ({
					key,
					value: "0xdead" as Hex,
					proof: [],
				})),
			}),
		);
		const getCode = vi.fn(async () => "0x60006000fd" as Hex);
		const rpcClient: RpcClient = { getProof, getCode };

		const sm = new StateManager({
			ffi: sim.ffi,
			rpcClient,
			forkBlockTag: "0x55",
		});

		expect(await sm.getBalance(CONTRACT)).toBe(987654321n);
		expect(await sm.getNonce(CONTRACT)).toBe(12n);
		expect(await sm.getStorage(CONTRACT, SLOT_0)).toBe(
			`0x${0xdeadn.toString(16).padStart(64, "0")}`,
		);
		expect(await sm.getCode(CONTRACT)).toBe("0x60006000fd");

		expect(getProof).toHaveBeenCalled();
		expect(getCode).toHaveBeenCalledWith(CONTRACT, "0x55");

		sm.destroy();
	});

	it("resizes method and params buffers on OUTPUT_TOO_SMALL", async () => {
		const sim = createStateManagerFFISimulator();
		const longMethod = `eth_${"x".repeat(80)}`;
		const bigParam = "a".repeat(5000);
		let calls = 0;

		const provider = {
			request: vi.fn(async () => ({
				balance: "0x0",
				nonce: "0x0",
				storageProof: [],
			})),
			on: () => provider,
			removeListener: () => provider,
		};

		const sm = new StateManager({
			ffi: sim.ffi,
			rpcClient: provider,
		});
		await sm.setBalance(ALICE, 42n);

		const [fbHandle] = Array.from(sim.forkBackends.keys());
		const fb = fbHandle !== undefined ? sim.forkBackends.get(fbHandle) : null;
		expect(fb).toBeTruthy();

		const origGetBalance = sim.ffi.state_manager_get_balance_sync;
		let pendingOnce = true;
		sim.ffi.state_manager_get_balance_sync = (h, a, out, len) => {
			if (pendingOnce && fb) {
				pendingOnce = false;
				fb.pending.push({
					requestId: 99n,
					method: longMethod,
					params: [bigParam],
					onResponse: () => {},
				});
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			return origGetBalance(h, a, out, len);
		};

		const origNext = sim.ffi.fork_backend_next_request;
		sim.ffi.fork_backend_next_request = (...args) => {
			calls++;
			return origNext(...args);
		};

		expect(await sm.getBalance(ALICE)).toBe(42n);
		// 1st call returns OUTPUT_TOO_SMALL, 2nd succeeds after resize, 3rd returns NO_PENDING_REQUEST
		expect(calls).toBe(3);
		expect(provider.request).toHaveBeenCalledWith({
			method: longMethod,
			params: [bigParam],
		});

		sm.destroy();
	});

	it("retries getCode when get_code_sync returns RPC_PENDING", async () => {
		const sim = createStateManagerFFISimulator();
		const mockRpc = new MockRpcClient();
		mockRpc.setAccount(Address.toHex(CONTRACT), { code: "0x60fe" });

		const sm = new StateManager({ ffi: sim.ffi, rpcClient: mockRpc });
		await sm.setCode(CONTRACT, "0x60fe" as Hex);

		const origGetCodeSync = sim.ffi.state_manager_get_code_sync;
		let pendingOnce = true;
		sim.ffi.state_manager_get_code_sync = (h, a, out, len) => {
			if (pendingOnce) {
				pendingOnce = false;
				return STATE_MANAGER_ERROR_RPC_PENDING;
			}
			return origGetCodeSync(h, a, out, len);
		};

		expect(await sm.getCode(CONTRACT)).toBe("0x60fe");
		sm.destroy();
	});

	it("throws on unsupported fork method, next_request failure, continue failure, and retry exhaustion", async () => {
		const sim = createStateManagerFFISimulator();
		const rpcClient: RpcClient = {
			getProof: vi.fn(),
			getCode: vi.fn(),
		};

		const sm = new StateManager({ ffi: sim.ffi, rpcClient });
		const [fbHandle] = Array.from(sim.forkBackends.keys());
		const fb = fbHandle !== undefined ? sim.forkBackends.get(fbHandle) : null;

		// Unsupported method
		sim.ffi.state_manager_get_balance_sync = () => {
			fb?.pending.push({
				requestId: 1n,
				method: "debug_traceCall",
				params: [],
				onResponse: () => {},
			});
			return STATE_MANAGER_ERROR_RPC_PENDING;
		};
		await expect(sm.getBalance(ALICE)).rejects.toThrow(
			"Unsupported fork method: debug_traceCall",
		);
		if (fb) fb.pending.length = 0;

		// fork_backend_next_request failure
		const origNext = sim.ffi.fork_backend_next_request;
		sim.ffi.fork_backend_next_request = () => STATE_MANAGER_ERROR_RPC_FAILED;
		await expect(sm.getBalance(ALICE)).rejects.toThrow(
			`fork_backend_next_request failed: ${STATE_MANAGER_ERROR_RPC_FAILED}`,
		);
		sim.ffi.fork_backend_next_request = origNext;
		if (fb) fb.pending.length = 0;

		// fork_backend_continue failure
		const origContinue = sim.ffi.fork_backend_continue;
		sim.ffi.state_manager_get_code_len_sync = () => {
			fb?.pending.push({
				requestId: 2n,
				method: "eth_getCode",
				params: [Address.toHex(CONTRACT), "latest"],
				onResponse: () => {},
			});
			return STATE_MANAGER_ERROR_RPC_PENDING;
		};
		(rpcClient.getCode as ReturnType<typeof vi.fn>).mockResolvedValue("0x");
		sim.ffi.fork_backend_continue = () => STATE_MANAGER_ERROR_INVALID_REQUEST;
		await expect(sm.getCode(CONTRACT)).rejects.toThrow(
			`fork_backend_continue failed: ${STATE_MANAGER_ERROR_INVALID_REQUEST}`,
		);
		sim.ffi.fork_backend_continue = origContinue;
		if (fb) fb.pending.length = 0;

		// Exceed retry attempts (10x RPC_PENDING with no pending requests)
		sim.ffi.state_manager_get_balance_sync = () =>
			STATE_MANAGER_ERROR_RPC_PENDING;
		await expect(sm.getBalance(ALICE)).rejects.toThrow(
			"Failed to resolve forked balance",
		);

		sim.ffi.state_manager_get_nonce_sync = () =>
			STATE_MANAGER_ERROR_RPC_PENDING;
		await expect(sm.getNonce(ALICE)).rejects.toThrow(
			"Failed to resolve forked nonce",
		);

		sim.ffi.state_manager_get_storage_sync = () =>
			STATE_MANAGER_ERROR_RPC_PENDING;
		await expect(sm.getStorage(CONTRACT, SLOT_0)).rejects.toThrow(
			"Failed to resolve forked storage",
		);

		sim.ffi.state_manager_get_code_len_sync = () =>
			STATE_MANAGER_ERROR_RPC_PENDING;
		await expect(sm.getCode(CONTRACT)).rejects.toThrow(
			"Failed to resolve forked code",
		);

		// Exceed 1000-request processing limit in a single processForkRequests call
		let reqSeq = 10n;
		sim.ffi.fork_backend_next_request = (
			_h,
			outId,
			outMethod,
			_mLen,
			outMLen,
			outParams,
			_pLen,
			outPLen,
		) => {
			const m = new TextEncoder().encode("eth_getCode");
			const p = new TextEncoder().encode(
				JSON.stringify([Address.toHex(CONTRACT), "latest"]),
			);
			outId[0] = reqSeq++;
			outMethod.set(m, 0);
			outMLen[0] = BigInt(m.length);
			outParams.set(p, 0);
			outPLen[0] = BigInt(p.length);
			return STATE_MANAGER_SUCCESS;
		};
		sim.ffi.fork_backend_continue = () => STATE_MANAGER_SUCCESS;
		await expect(sm.getBalance(ALICE)).rejects.toThrow(
			"Exceeded fork request processing limit",
		);

		sm.destroy();
	});
});
