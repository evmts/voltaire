/**
 * WASM loader for fork StateManager + Blockchain modules
 * Provides JS-friendly wrappers around Zig C-API exports.
 */

import type { BlockchainFFIExports } from "../blockchain/Blockchain/index.js";
import type { StateManagerFFIExports } from "../state-manager/StateManager/index.js";

type WasmModule = {
	exports: Record<string, unknown>;
	memory: WebAssembly.Memory;
	reset: () => void;
	alloc: (size: number) => number;
	writeBytes: (bytes: Uint8Array) => number;
	writeCString: (value: string) => number;
	readBytes: (ptr: number, len: number) => Uint8Array;
	readU32: (ptr: number) => number;
	readU64: (ptr: number) => bigint;
};

type WasmStateManagerExports = {
	state_manager_create: () => number;
	state_manager_create_with_fork: (forkBackend: number) => number;
	state_manager_destroy: (handle: number) => void;
	fork_backend_create: (
		rpcClientPtr: number,
		vtablePtr: number,
		blockTagPtr: number,
		maxCacheSize: number,
	) => number;
	fork_backend_destroy: (handle: number) => void;
	fork_backend_clear_cache: (handle: number) => void;
	fork_backend_next_request: (
		handle: number,
		outRequestId: number,
		outMethod: number,
		methodBufLen: number,
		outMethodLen: number,
		outParams: number,
		paramsBufLen: number,
		outParamsLen: number,
	) => number;
	fork_backend_continue: (
		handle: number,
		requestId: number,
		responsePtr: number,
		responseLen: number,
	) => number;
	state_manager_get_balance_sync: (
		handle: number,
		addressPtr: number,
		outPtr: number,
		bufferLen: number,
	) => number;
	state_manager_set_balance: (
		handle: number,
		addressPtr: number,
		balancePtr: number,
	) => number;
	state_manager_get_nonce_sync: (
		handle: number,
		addressPtr: number,
		outNoncePtr: number,
	) => number;
	state_manager_set_nonce: (
		handle: number,
		addressPtr: number,
		nonce: bigint,
	) => number;
	state_manager_get_storage_sync: (
		handle: number,
		addressPtr: number,
		slotPtr: number,
		outPtr: number,
		bufferLen: number,
	) => number;
	state_manager_set_storage: (
		handle: number,
		addressPtr: number,
		slotPtr: number,
		valuePtr: number,
	) => number;
	state_manager_get_code_len_sync: (
		handle: number,
		addressPtr: number,
		outLenPtr: number,
	) => number;
	state_manager_get_code_sync: (
		handle: number,
		addressPtr: number,
		outPtr: number,
		bufferLen: number,
	) => number;
	state_manager_set_code: (
		handle: number,
		addressPtr: number,
		codePtr: number,
		codeLen: number,
	) => number;
	state_manager_checkpoint: (handle: number) => number;
	state_manager_revert: (handle: number) => void;
	state_manager_commit: (handle: number) => void;
	state_manager_snapshot: (handle: number, outSnapshotId: number) => number;
	state_manager_revert_to_snapshot: (
		handle: number,
		snapshotId: bigint,
	) => number;
	state_manager_clear_caches: (handle: number) => void;
	state_manager_clear_fork_cache: (handle: number) => void;
};

type WasmBlockchainExports = {
	blockchain_create: () => number;
	blockchain_create_with_fork: (forkCache: number) => number;
	blockchain_destroy: (handle: number) => void;
	fork_block_cache_create: (
		rpcContext: number,
		vtableFetchByNumber: number,
		vtableFetchByHash: number,
		forkBlockNumber: bigint,
	) => number;
	fork_block_cache_destroy: (handle: number) => void;
	fork_block_cache_next_request: (
		handle: number,
		outRequestId: number,
		outMethod: number,
		methodBufLen: number,
		outMethodLen: number,
		outParams: number,
		paramsBufLen: number,
		outParamsLen: number,
	) => number;
	fork_block_cache_continue: (
		handle: number,
		requestId: number,
		responsePtr: number,
		responseLen: number,
	) => number;
	blockchain_get_block_by_hash: (
		handle: number,
		hashPtr: number,
		outPtr: number,
	) => number;
	blockchain_get_block_by_number: (
		handle: number,
		blockNumber: number,
		outPtr: number,
	) => number;
	blockchain_get_canonical_hash: (
		handle: number,
		blockNumber: number,
		outPtr: number,
	) => number;
	blockchain_get_head_block_number: (handle: number, outPtr: number) => number;
	blockchain_put_block: (handle: number, blockPtr: number, blockLen: number) => number;
	blockchain_set_canonical_head: (handle: number, hashPtr: number) => number;
	blockchain_has_block: (handle: number, hashPtr: number) => number;
	blockchain_local_block_count: (handle: number) => number;
	blockchain_orphan_count: (handle: number) => number;
	blockchain_canonical_chain_length: (handle: number) => number;
	blockchain_is_fork_block: (handle: number, blockNumber: number) => number;
};

const DEFAULT_STATE_MANAGER_WASM = new URL(
	"../../wasm/state-manager.wasm",
	import.meta.url,
);
const DEFAULT_BLOCKCHAIN_WASM = new URL(
	"../../wasm/blockchain.wasm",
	import.meta.url,
);

let cachedStateManager: WasmModule | null = null;
let cachedBlockchain: WasmModule | null = null;

async function loadWasmBytes(
	wasmPath: string | URL | ArrayBuffer,
): Promise<ArrayBuffer> {
	if (wasmPath instanceof ArrayBuffer) {
		return wasmPath;
	}

	const path =
		wasmPath instanceof URL
			? wasmPath
			: new URL(wasmPath, import.meta.url);

	if (path.protocol === "file:") {
		try {
			const { readFile } = await import("node:fs/promises");
			const fileBuffer = await readFile(path);
			return fileBuffer.buffer.slice(
				fileBuffer.byteOffset,
				fileBuffer.byteOffset + fileBuffer.byteLength,
			);
		} catch {
			// Fall through to fetch for non-node environments.
		}
	}

	const response = await fetch(path);
	return await response.arrayBuffer();
}

function createWasmModule(
	instance: WebAssembly.Instance,
): WasmModule {
	const exports = instance.exports as Record<string, unknown>;
	const memory = exports.memory as WebAssembly.Memory;
	let offset = 0x10000;

	const ensure = (size: number) => {
		const needed = offset + size;
		if (needed <= memory.buffer.byteLength) return;
		const pages = Math.ceil((needed - memory.buffer.byteLength) / 65536);
		memory.grow(pages);
	};

	const alloc = (size: number) => {
		ensure(size);
		const ptr = offset;
		offset += size;
		return ptr;
	};

	const writeBytes = (bytes: Uint8Array) => {
		const ptr = alloc(bytes.length);
		new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
		return ptr;
	};

	const writeCString = (value: string) => {
		const encoded = new TextEncoder().encode(`${value}\0`);
		return writeBytes(encoded);
	};

	const readBytes = (ptr: number, len: number) =>
		new Uint8Array(memory.buffer.slice(ptr, ptr + len));

	const readU32 = (ptr: number) => {
		const view = new DataView(memory.buffer);
		return view.getUint32(ptr, true);
	};

	const readU64 = (ptr: number) => {
		const view = new DataView(memory.buffer);
		return view.getBigUint64(ptr, true);
	};

	return {
		exports,
		memory,
		reset: () => {
			offset = 0x10000;
		},
		alloc,
		writeBytes,
		writeCString,
		readBytes,
		readU32,
		readU64,
	};
}

async function instantiateWasm(
	wasmPath: string | URL | ArrayBuffer,
): Promise<WasmModule> {
	const wasmBytes = await loadWasmBytes(wasmPath);
	let wasmMemory: WebAssembly.Memory | null = null;

	const wasi = {
		args_get: (_argv: number, _argv_buf: number) => 0,
		args_sizes_get: (argcPtr: number, argvBufSizePtr: number) => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(argcPtr, 0, true);
			mem.setUint32(argvBufSizePtr, 0, true);
			return 0;
		},
		environ_get: (_environ: number, _environ_buf: number) => 0,
		environ_sizes_get: (countPtr: number, bufSizePtr: number) => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(countPtr, 0, true);
			mem.setUint32(bufSizePtr, 0, true);
			return 0;
		},
		fd_write: (_fd: number, iovs: number, iovsLen: number, nwritten: number) => {
			if (!wasmMemory) return -1;
			const memU32 = new Uint32Array(wasmMemory.buffer);
			let bytes = 0;
			for (let i = 0; i < iovsLen; i++) {
				const len = memU32[(iovs >> 2) + i * 2 + 1] ?? 0;
				bytes += len;
			}
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(nwritten, bytes, true);
			return 0;
		},
		fd_read: (_fd: number, _iovs: number, _iovsLen: number, nread: number) => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(nread, 0, true);
			return 0;
		},
		fd_close: () => 0,
		fd_seek: () => 0,
		fd_fdstat_get: () => 0,
		fd_filestat_get: () => 0,
		fd_prestat_get: () => 0,
		fd_prestat_dir_name: () => 0,
		fd_datasync: () => 0,
		fd_sync: () => 0,
		clock_time_get: () => 0,
		random_get: (buf: number, len: number) => {
			if (!wasmMemory) return -1;
			const view = new Uint8Array(wasmMemory.buffer, buf, len);
			if (globalThis.crypto?.getRandomValues) {
				globalThis.crypto.getRandomValues(view);
			}
			return 0;
		},
		proc_exit: (code: number): never => {
			throw new Error(`WASI proc_exit(${code})`);
		},
		sched_yield: () => 0,
		poll_oneoff: () => 0,
		path_open: () => 0,
		path_filestat_get: () => 0,
		path_readlink: () => 0,
	};

	const importObject = {
		wasi_snapshot_preview1: wasi,
		env: {},
	};

	const wasmModule = await WebAssembly.instantiate(wasmBytes, importObject);
	const module = createWasmModule(wasmModule.instance);
	wasmMemory = module.memory;
	return module;
}

function createStateManagerExports(module: WasmModule): StateManagerFFIExports {
	const exp = module.exports as unknown as WasmStateManagerExports;
	const writeCStringArg = (value: string | Uint8Array) =>
		value instanceof Uint8Array ? module.writeBytes(value) : module.writeCString(value);

	return {
		state_manager_create: () => {
			module.reset();
			const handle = exp.state_manager_create();
			return handle ? BigInt(handle) : null;
		},
		state_manager_create_with_fork: (forkBackend: bigint) => {
			module.reset();
			const handle = exp.state_manager_create_with_fork(Number(forkBackend));
			return handle ? BigInt(handle) : null;
		},
		state_manager_destroy: (handle: bigint) => {
			module.reset();
			exp.state_manager_destroy(Number(handle));
		},
		fork_backend_create: (
			rpcClientPtr: bigint,
			vtablePtr: bigint,
			blockTag: string | Uint8Array,
			maxCacheSize: number,
		) => {
			module.reset();
			const blockTagPtr = writeCStringArg(blockTag);
			const handle = exp.fork_backend_create(
				Number(rpcClientPtr),
				Number(vtablePtr),
				blockTagPtr,
				maxCacheSize,
			);
			return handle ? BigInt(handle) : null;
		},
		fork_backend_destroy: (handle: bigint) => {
			module.reset();
			exp.fork_backend_destroy(Number(handle));
		},
		fork_backend_clear_cache: (handle: bigint) => {
			module.reset();
			exp.fork_backend_clear_cache(Number(handle));
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
			module.reset();
			const methodPtr = module.alloc(methodBufLen);
			const paramsPtr = module.alloc(paramsBufLen);
			const methodLenPtr = module.alloc(4);
			const paramsLenPtr = module.alloc(4);
			const requestIdPtr = module.alloc(8);

			const result = exp.fork_backend_next_request(
				Number(handle),
				requestIdPtr,
				methodPtr,
				methodBufLen,
				methodLenPtr,
				paramsPtr,
				paramsBufLen,
				paramsLenPtr,
			);

			const methodLen = module.readU32(methodLenPtr);
			const paramsLen = module.readU32(paramsLenPtr);
			const requestId = module.readU64(requestIdPtr);

			outMethodLen[0] = BigInt(methodLen);
			outParamsLen[0] = BigInt(paramsLen);
			outRequestId[0] = requestId;

			if (methodLen > 0) {
				outMethod.set(module.readBytes(methodPtr, methodLen).subarray(0, methodBufLen));
			}
			if (paramsLen > 0) {
				outParams.set(module.readBytes(paramsPtr, paramsLen).subarray(0, paramsBufLen));
			}

			return result;
		},
		fork_backend_continue: (
			handle: bigint,
			requestId: bigint,
			responsePtr: Uint8Array,
			responseLen: number,
		) => {
			module.reset();
			const respPtr = module.writeBytes(responsePtr);
			return exp.fork_backend_continue(
				Number(handle),
				BigInt(requestId),
				respPtr,
				responseLen,
			);
		},
		state_manager_get_balance_sync: (
			handle: bigint,
			addressHex: string | Uint8Array,
			outBuffer: Uint8Array,
			bufferLen: number,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const outPtr = module.alloc(bufferLen);
			const result = exp.state_manager_get_balance_sync(
				Number(handle),
				addrPtr,
				outPtr,
				bufferLen,
			);
			outBuffer.set(module.readBytes(outPtr, bufferLen));
			return result;
		},
		state_manager_set_balance: (
			handle: bigint,
			addressHex: string | Uint8Array,
			balanceHex: string | Uint8Array,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const balPtr = writeCStringArg(balanceHex);
			return exp.state_manager_set_balance(Number(handle), addrPtr, balPtr);
		},
		state_manager_get_nonce_sync: (
			handle: bigint,
			addressHex: string | Uint8Array,
			outNonce: BigUint64Array,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const outPtr = module.alloc(8);
			const result = exp.state_manager_get_nonce_sync(
				Number(handle),
				addrPtr,
				outPtr,
			);
			outNonce[0] = module.readU64(outPtr);
			return result;
		},
		state_manager_set_nonce: (
			handle: bigint,
			addressHex: string | Uint8Array,
			nonce: bigint,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			return exp.state_manager_set_nonce(Number(handle), addrPtr, BigInt(nonce));
		},
		state_manager_get_storage_sync: (
			handle: bigint,
			addressHex: string | Uint8Array,
			slotHex: string | Uint8Array,
			outBuffer: Uint8Array,
			bufferLen: number,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const slotPtr = writeCStringArg(slotHex);
			const outPtr = module.alloc(bufferLen);
			const result = exp.state_manager_get_storage_sync(
				Number(handle),
				addrPtr,
				slotPtr,
				outPtr,
				bufferLen,
			);
			outBuffer.set(module.readBytes(outPtr, bufferLen));
			return result;
		},
		state_manager_set_storage: (
			handle: bigint,
			addressHex: string | Uint8Array,
			slotHex: string | Uint8Array,
			valueHex: string | Uint8Array,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const slotPtr = writeCStringArg(slotHex);
			const valuePtr = writeCStringArg(valueHex);
			return exp.state_manager_set_storage(
				Number(handle),
				addrPtr,
				slotPtr,
				valuePtr,
			);
		},
		state_manager_get_code_len_sync: (
			handle: bigint,
			addressHex: string | Uint8Array,
			outLen: BigUint64Array,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const outPtr = module.alloc(8);
			const result = exp.state_manager_get_code_len_sync(
				Number(handle),
				addrPtr,
				outPtr,
			);
			outLen[0] = module.readU64(outPtr);
			return result;
		},
		state_manager_get_code_sync: (
			handle: bigint,
			addressHex: string | Uint8Array,
			outBuffer: Uint8Array,
			bufferLen: number,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const outPtr = module.alloc(bufferLen);
			const result = exp.state_manager_get_code_sync(
				Number(handle),
				addrPtr,
				outPtr,
				bufferLen,
			);
			outBuffer.set(module.readBytes(outPtr, bufferLen));
			return result;
		},
		state_manager_set_code: (
			handle: bigint,
			addressHex: string | Uint8Array,
			codePtr: Uint8Array,
			codeLen: number,
		) => {
			module.reset();
			const addrPtr = writeCStringArg(addressHex);
			const codePtrWasm = module.writeBytes(codePtr.subarray(0, codeLen));
			return exp.state_manager_set_code(
				Number(handle),
				addrPtr,
				codePtrWasm,
				codeLen,
			);
		},
		state_manager_checkpoint: (handle: bigint) => {
			module.reset();
			return exp.state_manager_checkpoint(Number(handle));
		},
		state_manager_revert: (handle: bigint) => {
			module.reset();
			exp.state_manager_revert(Number(handle));
		},
		state_manager_commit: (handle: bigint) => {
			module.reset();
			exp.state_manager_commit(Number(handle));
		},
		state_manager_snapshot: (handle: bigint, outSnapshotId: BigUint64Array) => {
			module.reset();
			const outPtr = module.alloc(8);
			const result = exp.state_manager_snapshot(Number(handle), outPtr);
			outSnapshotId[0] = module.readU64(outPtr);
			return result;
		},
		state_manager_revert_to_snapshot: (handle: bigint, snapshotId: bigint) => {
			module.reset();
			return exp.state_manager_revert_to_snapshot(Number(handle), BigInt(snapshotId));
		},
		state_manager_clear_caches: (handle: bigint) => {
			module.reset();
			exp.state_manager_clear_caches(Number(handle));
		},
		state_manager_clear_fork_cache: (handle: bigint) => {
			module.reset();
			exp.state_manager_clear_fork_cache(Number(handle));
		},
	};
}

function createBlockchainExports(module: WasmModule): BlockchainFFIExports {
	const exp = module.exports as unknown as WasmBlockchainExports;

	return {
		blockchain_create: () => {
			module.reset();
			const handle = exp.blockchain_create();
			return handle ? BigInt(handle) : null;
		},
		blockchain_create_with_fork: (forkCache: bigint) => {
			module.reset();
			const handle = exp.blockchain_create_with_fork(Number(forkCache));
			return handle ? BigInt(handle) : null;
		},
		blockchain_destroy: (handle: bigint) => {
			module.reset();
			exp.blockchain_destroy(Number(handle));
		},
		fork_block_cache_create: (
			rpcContext: bigint,
			vtableFetchByNumber: bigint,
			vtableFetchByHash: bigint,
			forkBlockNumber: bigint,
		) => {
			module.reset();
			const handle = exp.fork_block_cache_create(
				Number(rpcContext),
				Number(vtableFetchByNumber),
				Number(vtableFetchByHash),
				BigInt(forkBlockNumber),
			);
			return handle ? BigInt(handle) : null;
		},
		fork_block_cache_destroy: (handle: bigint) => {
			module.reset();
			exp.fork_block_cache_destroy(Number(handle));
		},
		fork_block_cache_next_request: (
			handle: bigint,
			outRequestId: BigUint64Array,
			outMethod: Uint8Array,
			methodBufLen: number,
			outMethodLen: BigUint64Array,
			outParams: Uint8Array,
			paramsBufLen: number,
			outParamsLen: BigUint64Array,
		) => {
			module.reset();
			const methodPtr = module.alloc(methodBufLen);
			const paramsPtr = module.alloc(paramsBufLen);
			const methodLenPtr = module.alloc(4);
			const paramsLenPtr = module.alloc(4);
			const requestIdPtr = module.alloc(8);

			const result = exp.fork_block_cache_next_request(
				Number(handle),
				requestIdPtr,
				methodPtr,
				methodBufLen,
				methodLenPtr,
				paramsPtr,
				paramsBufLen,
				paramsLenPtr,
			);

			const methodLen = module.readU32(methodLenPtr);
			const paramsLen = module.readU32(paramsLenPtr);
			const requestId = module.readU64(requestIdPtr);

			outMethodLen[0] = BigInt(methodLen);
			outParamsLen[0] = BigInt(paramsLen);
			outRequestId[0] = requestId;

			if (methodLen > 0) {
				outMethod.set(module.readBytes(methodPtr, methodLen).subarray(0, methodBufLen));
			}
			if (paramsLen > 0) {
				outParams.set(module.readBytes(paramsPtr, paramsLen).subarray(0, paramsBufLen));
			}

			return result;
		},
		fork_block_cache_continue: (
			handle: bigint,
			requestId: bigint,
			responsePtr: Uint8Array,
			responseLen: number,
		) => {
			module.reset();
			const respPtr = module.writeBytes(responsePtr);
			return exp.fork_block_cache_continue(
				Number(handle),
				BigInt(requestId),
				respPtr,
				responseLen,
			);
		},
		blockchain_get_block_by_hash: (
			handle: bigint,
			blockHashPtr: Uint8Array,
			outBlockData: Uint8Array,
		) => {
			module.reset();
			const hashPtr = module.writeBytes(blockHashPtr);
			const outPtr = module.alloc(outBlockData.length);
			const result = exp.blockchain_get_block_by_hash(
				Number(handle),
				hashPtr,
				outPtr,
			);
			outBlockData.set(module.readBytes(outPtr, outBlockData.length));
			return result;
		},
		blockchain_get_block_by_number: (
			handle: bigint,
			number: bigint,
			outBlockData: Uint8Array,
		) => {
			module.reset();
			const outPtr = module.alloc(outBlockData.length);
			const result = exp.blockchain_get_block_by_number(
				Number(handle),
				BigInt(number),
				outPtr,
			);
			outBlockData.set(module.readBytes(outPtr, outBlockData.length));
			return result;
		},
		blockchain_get_canonical_hash: (
			handle: bigint,
			number: bigint,
			outHash: Uint8Array,
		) => {
			module.reset();
			const outPtr = module.alloc(outHash.length);
			const result = exp.blockchain_get_canonical_hash(
				Number(handle),
				BigInt(number),
				outPtr,
			);
			outHash.set(module.readBytes(outPtr, outHash.length));
			return result;
		},
		blockchain_get_head_block_number: (
			handle: bigint,
			outNumber: BigUint64Array,
		) => {
			module.reset();
			const outPtr = module.alloc(8);
			const result = exp.blockchain_get_head_block_number(Number(handle), outPtr);
			outNumber[0] = module.readU64(outPtr);
			return result;
		},
		blockchain_put_block: (handle: bigint, blockData: Uint8Array) => {
			module.reset();
			const dataPtr = module.writeBytes(blockData);
			return exp.blockchain_put_block(Number(handle), dataPtr);
		},
		blockchain_set_canonical_head: (handle: bigint, blockHashPtr: Uint8Array) => {
			module.reset();
			const hashPtr = module.writeBytes(blockHashPtr);
			return exp.blockchain_set_canonical_head(Number(handle), hashPtr);
		},
		blockchain_has_block: (handle: bigint, blockHashPtr: Uint8Array) => {
			module.reset();
			const hashPtr = module.writeBytes(blockHashPtr);
			return exp.blockchain_has_block(Number(handle), hashPtr);
		},
		blockchain_local_block_count: (handle: bigint) => {
			module.reset();
			return exp.blockchain_local_block_count(Number(handle));
		},
		blockchain_orphan_count: (handle: bigint) => {
			module.reset();
			return exp.blockchain_orphan_count(Number(handle));
		},
		blockchain_canonical_chain_length: (handle: bigint) => {
			module.reset();
			return exp.blockchain_canonical_chain_length(Number(handle));
		},
		blockchain_is_fork_block: (handle: bigint, number: bigint) => {
			module.reset();
			return exp.blockchain_is_fork_block(Number(handle), BigInt(number));
		},
	};
}

export async function loadForkWasm(options?: {
	stateManagerWasm?: string | URL | ArrayBuffer;
	blockchainWasm?: string | URL | ArrayBuffer;
}): Promise<{
	stateManager: StateManagerFFIExports;
	blockchain: BlockchainFFIExports;
}> {
	if (!cachedStateManager) {
		const path = options?.stateManagerWasm ?? DEFAULT_STATE_MANAGER_WASM;
		cachedStateManager = await instantiateWasm(path);
	}
	if (!cachedBlockchain) {
		const path = options?.blockchainWasm ?? DEFAULT_BLOCKCHAIN_WASM;
		cachedBlockchain = await instantiateWasm(path);
	}

	return {
		stateManager: createStateManagerExports(cachedStateManager),
		blockchain: createBlockchainExports(cachedBlockchain),
	};
}
