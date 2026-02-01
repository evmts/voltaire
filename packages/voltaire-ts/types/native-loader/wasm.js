/**
 * WASM loader for fork StateManager + Blockchain modules
 * Provides JS-friendly wrappers around Zig C-API exports.
 */
const DEFAULT_STATE_MANAGER_WASM = new URL("../../wasm/state-manager.wasm", import.meta.url);
const DEFAULT_BLOCKCHAIN_WASM = new URL("../../wasm/blockchain.wasm", import.meta.url);
let cachedStateManager = null;
let cachedBlockchain = null;
async function loadWasmBytes(wasmPath) {
    if (wasmPath instanceof ArrayBuffer) {
        return wasmPath;
    }
    const path = wasmPath instanceof URL ? wasmPath : new URL(wasmPath, import.meta.url);
    if (path.protocol === "file:") {
        try {
            const { readFile } = await import("node:fs/promises");
            const fileBuffer = await readFile(path);
            return fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        }
        catch {
            // Fall through to fetch for non-node environments.
        }
    }
    const response = await fetch(path);
    return await response.arrayBuffer();
}
function createWasmModule(instance) {
    const exports = instance.exports;
    const memory = exports.memory;
    let offset = 0x10000;
    const ensure = (size) => {
        const needed = offset + size;
        if (needed <= memory.buffer.byteLength)
            return;
        const pages = Math.ceil((needed - memory.buffer.byteLength) / 65536);
        memory.grow(pages);
    };
    const alloc = (size) => {
        ensure(size);
        const ptr = offset;
        offset += size;
        return ptr;
    };
    const writeBytes = (bytes) => {
        const ptr = alloc(bytes.length);
        new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
        return ptr;
    };
    const writeCString = (value) => {
        const encoded = new TextEncoder().encode(`${value}\0`);
        return writeBytes(encoded);
    };
    const readBytes = (ptr, len) => new Uint8Array(memory.buffer.slice(ptr, ptr + len));
    const readU32 = (ptr) => {
        const view = new DataView(memory.buffer);
        return view.getUint32(ptr, true);
    };
    const readU64 = (ptr) => {
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
async function instantiateWasm(wasmPath) {
    const wasmBytes = await loadWasmBytes(wasmPath);
    let wasmMemory = null;
    const wasi = {
        args_get: (_argv, _argv_buf) => 0,
        args_sizes_get: (argcPtr, argvBufSizePtr) => {
            if (!wasmMemory)
                return -1;
            const mem = new DataView(wasmMemory.buffer);
            mem.setUint32(argcPtr, 0, true);
            mem.setUint32(argvBufSizePtr, 0, true);
            return 0;
        },
        environ_get: (_environ, _environ_buf) => 0,
        environ_sizes_get: (countPtr, bufSizePtr) => {
            if (!wasmMemory)
                return -1;
            const mem = new DataView(wasmMemory.buffer);
            mem.setUint32(countPtr, 0, true);
            mem.setUint32(bufSizePtr, 0, true);
            return 0;
        },
        fd_write: (_fd, iovs, iovsLen, nwritten) => {
            if (!wasmMemory)
                return -1;
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
        fd_pwrite: (_fd, iovs, iovsLen, _offset, nwritten) => {
            if (!wasmMemory)
                return -1;
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
        fd_read: (_fd, _iovs, _iovsLen, nread) => {
            if (!wasmMemory)
                return -1;
            const mem = new DataView(wasmMemory.buffer);
            mem.setUint32(nread, 0, true);
            return 0;
        },
        fd_pread: (_fd, _iovs, _iovsLen, _offset, nread) => {
            if (!wasmMemory)
                return -1;
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
        random_get: (buf, len) => {
            if (!wasmMemory)
                return -1;
            const view = new Uint8Array(wasmMemory.buffer, buf, len);
            if (globalThis.crypto?.getRandomValues) {
                globalThis.crypto.getRandomValues(view);
            }
            return 0;
        },
        proc_exit: (code) => {
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
function createStateManagerExports(module) {
    const exp = module.exports;
    const writeCStringArg = (value) => value instanceof Uint8Array
        ? module.writeBytes(value)
        : module.writeCString(value);
    return {
        state_manager_create: () => {
            module.reset();
            const handle = exp.state_manager_create();
            return handle ? BigInt(handle) : null;
        },
        state_manager_create_with_fork: (forkBackend) => {
            module.reset();
            const handle = exp.state_manager_create_with_fork(Number(forkBackend));
            return handle ? BigInt(handle) : null;
        },
        state_manager_destroy: (handle) => {
            module.reset();
            exp.state_manager_destroy(Number(handle));
        },
        fork_backend_create: (rpcClientPtr, vtablePtr, blockTag, maxCacheSize) => {
            module.reset();
            const blockTagPtr = writeCStringArg(blockTag);
            const handle = exp.fork_backend_create(Number(rpcClientPtr), Number(vtablePtr), blockTagPtr, maxCacheSize);
            return handle ? BigInt(handle) : null;
        },
        fork_backend_destroy: (handle) => {
            module.reset();
            exp.fork_backend_destroy(Number(handle));
        },
        fork_backend_clear_cache: (handle) => {
            module.reset();
            exp.fork_backend_clear_cache(Number(handle));
        },
        fork_backend_next_request: (handle, outRequestId, outMethod, methodBufLen, outMethodLen, outParams, paramsBufLen, outParamsLen) => {
            module.reset();
            const methodPtr = module.alloc(methodBufLen);
            const paramsPtr = module.alloc(paramsBufLen);
            const methodLenPtr = module.alloc(4);
            const paramsLenPtr = module.alloc(4);
            const requestIdPtr = module.alloc(8);
            const result = exp.fork_backend_next_request(Number(handle), requestIdPtr, methodPtr, methodBufLen, methodLenPtr, paramsPtr, paramsBufLen, paramsLenPtr);
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
        fork_backend_continue: (handle, requestId, responsePtr, responseLen) => {
            module.reset();
            const respPtr = module.writeBytes(responsePtr);
            return exp.fork_backend_continue(Number(handle), BigInt(requestId), respPtr, responseLen);
        },
        state_manager_get_balance_sync: (handle, addressHex, outBuffer, bufferLen) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const outPtr = module.alloc(bufferLen);
            const result = exp.state_manager_get_balance_sync(Number(handle), addrPtr, outPtr, bufferLen);
            outBuffer.set(module.readBytes(outPtr, bufferLen));
            return result;
        },
        state_manager_set_balance: (handle, addressHex, balanceHex) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const balPtr = writeCStringArg(balanceHex);
            return exp.state_manager_set_balance(Number(handle), addrPtr, balPtr);
        },
        state_manager_get_nonce_sync: (handle, addressHex, outNonce) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const outPtr = module.alloc(8);
            const result = exp.state_manager_get_nonce_sync(Number(handle), addrPtr, outPtr);
            outNonce[0] = module.readU64(outPtr);
            return result;
        },
        state_manager_set_nonce: (handle, addressHex, nonce) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            return exp.state_manager_set_nonce(Number(handle), addrPtr, BigInt(nonce));
        },
        state_manager_get_storage_sync: (handle, addressHex, slotHex, outBuffer, bufferLen) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const slotPtr = writeCStringArg(slotHex);
            const outPtr = module.alloc(bufferLen);
            const result = exp.state_manager_get_storage_sync(Number(handle), addrPtr, slotPtr, outPtr, bufferLen);
            outBuffer.set(module.readBytes(outPtr, bufferLen));
            return result;
        },
        state_manager_set_storage: (handle, addressHex, slotHex, valueHex) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const slotPtr = writeCStringArg(slotHex);
            const valuePtr = writeCStringArg(valueHex);
            return exp.state_manager_set_storage(Number(handle), addrPtr, slotPtr, valuePtr);
        },
        state_manager_get_code_len_sync: (handle, addressHex, outLen) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const outPtr = module.alloc(4);
            const result = exp.state_manager_get_code_len_sync(Number(handle), addrPtr, outPtr);
            outLen[0] = BigInt(module.readU32(outPtr));
            return result;
        },
        state_manager_get_code_sync: (handle, addressHex, outBuffer, bufferLen) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const outPtr = module.alloc(bufferLen);
            const result = exp.state_manager_get_code_sync(Number(handle), addrPtr, outPtr, bufferLen);
            outBuffer.set(module.readBytes(outPtr, bufferLen));
            return result;
        },
        state_manager_set_code: (handle, addressHex, codePtr, codeLen) => {
            module.reset();
            const addrPtr = writeCStringArg(addressHex);
            const codePtrWasm = module.writeBytes(codePtr.subarray(0, codeLen));
            return exp.state_manager_set_code(Number(handle), addrPtr, codePtrWasm, codeLen);
        },
        state_manager_checkpoint: (handle) => {
            module.reset();
            return exp.state_manager_checkpoint(Number(handle));
        },
        state_manager_revert: (handle) => {
            module.reset();
            exp.state_manager_revert(Number(handle));
        },
        state_manager_commit: (handle) => {
            module.reset();
            exp.state_manager_commit(Number(handle));
        },
        state_manager_snapshot: (handle, outSnapshotId) => {
            module.reset();
            const outPtr = module.alloc(8);
            const result = exp.state_manager_snapshot(Number(handle), outPtr);
            outSnapshotId[0] = module.readU64(outPtr);
            return result;
        },
        state_manager_revert_to_snapshot: (handle, snapshotId) => {
            module.reset();
            return exp.state_manager_revert_to_snapshot(Number(handle), BigInt(snapshotId));
        },
        state_manager_clear_caches: (handle) => {
            module.reset();
            exp.state_manager_clear_caches(Number(handle));
        },
        state_manager_clear_fork_cache: (handle) => {
            module.reset();
            exp.state_manager_clear_fork_cache(Number(handle));
        },
    };
}
function createBlockchainExports(module) {
    const exp = module.exports;
    return {
        blockchain_create: () => {
            module.reset();
            const handle = exp.blockchain_create();
            return handle ? BigInt(handle) : null;
        },
        blockchain_create_with_fork: (forkCache) => {
            module.reset();
            const handle = exp.blockchain_create_with_fork(Number(forkCache));
            return handle ? BigInt(handle) : null;
        },
        blockchain_destroy: (handle) => {
            module.reset();
            exp.blockchain_destroy(Number(handle));
        },
        fork_block_cache_create: (rpcContext, vtableFetchByNumber, vtableFetchByHash, forkBlockNumber) => {
            module.reset();
            const handle = exp.fork_block_cache_create(Number(rpcContext), Number(vtableFetchByNumber), Number(vtableFetchByHash), BigInt(forkBlockNumber));
            return handle ? BigInt(handle) : null;
        },
        fork_block_cache_destroy: (handle) => {
            module.reset();
            exp.fork_block_cache_destroy(Number(handle));
        },
        fork_block_cache_next_request: (handle, outRequestId, outMethod, methodBufLen, outMethodLen, outParams, paramsBufLen, outParamsLen) => {
            module.reset();
            const methodPtr = module.alloc(methodBufLen);
            const paramsPtr = module.alloc(paramsBufLen);
            const methodLenPtr = module.alloc(4);
            const paramsLenPtr = module.alloc(4);
            const requestIdPtr = module.alloc(8);
            const result = exp.fork_block_cache_next_request(Number(handle), requestIdPtr, methodPtr, methodBufLen, methodLenPtr, paramsPtr, paramsBufLen, paramsLenPtr);
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
        fork_block_cache_continue: (handle, requestId, responsePtr, responseLen) => {
            module.reset();
            const respPtr = module.writeBytes(responsePtr);
            return exp.fork_block_cache_continue(Number(handle), BigInt(requestId), respPtr, responseLen);
        },
        blockchain_get_block_by_hash: (handle, blockHashPtr, outBlockData) => {
            module.reset();
            const hashPtr = module.writeBytes(blockHashPtr);
            const outPtr = module.alloc(outBlockData.length);
            const result = exp.blockchain_get_block_by_hash(Number(handle), hashPtr, outPtr);
            outBlockData.set(module.readBytes(outPtr, outBlockData.length));
            return result;
        },
        blockchain_get_block_by_number: (handle, number, outBlockData) => {
            module.reset();
            const outPtr = module.alloc(outBlockData.length);
            const result = exp.blockchain_get_block_by_number(Number(handle), BigInt(number), outPtr);
            outBlockData.set(module.readBytes(outPtr, outBlockData.length));
            return result;
        },
        blockchain_get_canonical_hash: (handle, number, outHash) => {
            module.reset();
            const outPtr = module.alloc(outHash.length);
            const result = exp.blockchain_get_canonical_hash(Number(handle), BigInt(number), outPtr);
            outHash.set(module.readBytes(outPtr, outHash.length));
            return result;
        },
        blockchain_get_head_block_number: (handle, outNumber) => {
            module.reset();
            const outPtr = module.alloc(8);
            const result = exp.blockchain_get_head_block_number(Number(handle), outPtr);
            outNumber[0] = module.readU64(outPtr);
            return result;
        },
        blockchain_put_block: (handle, blockData) => {
            module.reset();
            const dataPtr = module.writeBytes(blockData);
            return exp.blockchain_put_block(Number(handle), dataPtr);
        },
        blockchain_set_canonical_head: (handle, blockHashPtr) => {
            module.reset();
            const hashPtr = module.writeBytes(blockHashPtr);
            return exp.blockchain_set_canonical_head(Number(handle), hashPtr);
        },
        blockchain_has_block: (handle, blockHashPtr) => {
            module.reset();
            const hashPtr = module.writeBytes(blockHashPtr);
            return exp.blockchain_has_block(Number(handle), hashPtr) !== 0;
        },
        blockchain_local_block_count: (handle) => {
            module.reset();
            return exp.blockchain_local_block_count(Number(handle));
        },
        blockchain_orphan_count: (handle) => {
            module.reset();
            return exp.blockchain_orphan_count(Number(handle));
        },
        blockchain_canonical_chain_length: (handle) => {
            module.reset();
            return exp.blockchain_canonical_chain_length(Number(handle));
        },
        blockchain_is_fork_block: (handle, number) => {
            module.reset();
            return exp.blockchain_is_fork_block(Number(handle), BigInt(number)) !== 0;
        },
    };
}
export async function loadForkWasm(options) {
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
