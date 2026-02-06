/**
 * RIPEMD160 Hash Function (WASM Implementation)
 *
 * WebAssembly-based implementation using Zig ripemd160 module.
 * Provides the same interface as the Noble-based implementation.
 *
 * @example
 * ```typescript
 * import { Ripemd160Wasm } from './ripemd160.wasm.js';
 *
 * // Load WASM first
 * await Ripemd160Wasm.load();
 *
 * // Hash bytes
 * const hash = Ripemd160Wasm.hash(data);
 *
 * // Hash string
 * const hash2 = Ripemd160Wasm.hashString("hello");
 * ```
 */
// WASM instance and memory
let wasmInstance = null;
let wasmMemory = null;
let memoryOffset = 0;
/**
 * Load WASM module
 */
async function loadWasm() {
    if (wasmInstance)
        return; // Already loaded
    // Minimal WASI shim
    const wasi = {
        args_get: () => 0,
        args_sizes_get: (argcPtr, argvBufSizePtr) => {
            if (!wasmMemory)
                return -1;
            const view = new DataView(wasmMemory.buffer);
            view.setUint32(argcPtr, 0, true);
            view.setUint32(argvBufSizePtr, 0, true);
            return 0;
        },
        environ_get: () => 0,
        environ_sizes_get: (environCountPtr, environBufSizePtr) => {
            if (!wasmMemory)
                return -1;
            const view = new DataView(wasmMemory.buffer);
            view.setUint32(environCountPtr, 0, true);
            view.setUint32(environBufSizePtr, 0, true);
            return 0;
        },
        fd_write: () => 0,
        fd_fdstat_get: () => 0,
        fd_filestat_get: () => 0,
        fd_seek: () => 0,
        fd_close: () => 0,
        fd_read: () => 0,
        fd_pread: () => 0,
        fd_pwrite: () => 0,
        clock_time_get: () => 0,
        random_get: () => 0,
        proc_exit: (code) => {
            throw new Error(`WASI proc_exit(${code})`);
        },
        sched_yield: () => 0,
        poll_oneoff: () => 0,
        path_filestat_get: () => 0,
        path_open: () => 0,
        path_readlink: () => 0,
        fd_prestat_get: () => 0,
        fd_prestat_dir_name: () => 0,
        fd_datasync: () => 0,
        fd_sync: () => 0,
    };
    const importObject = {
        env: {},
        wasi_snapshot_preview1: wasi,
    };
    // Load WASM file (support both Node.js and browser)
    let buffer;
    if (typeof process !== "undefined" && process.versions?.node) {
        // Node.js/Bun environment
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const url = await import("node:url");
        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        const wasmPath = path.resolve(__dirname, "../../wasm/crypto/ripemd160.wasm");
        const fileBuffer = await fs.readFile(wasmPath);
        buffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
    }
    else {
        // Browser environment
        const wasmPath = new URL("../../wasm/crypto/ripemd160.wasm", import.meta.url);
        const response = await fetch(wasmPath);
        buffer = await response.arrayBuffer();
    }
    const wasmModule = await WebAssembly.instantiate(buffer, importObject);
    wasmInstance = wasmModule.instance;
    const exports = wasmInstance.exports;
    wasmMemory = exports.memory;
    if (!wasmMemory) {
        throw new Error("WASM module does not export memory");
    }
    // Initialize memory offset (start at 64KB to be safe)
    memoryOffset = 64 * 1024;
}
/**
 * Allocate memory in WASM
 */
function malloc(size) {
    if (!wasmMemory) {
        throw new Error("WASM not initialized");
    }
    // Align to 8 bytes
    const aligned = (size + 7) & ~7;
    const ptr = memoryOffset;
    memoryOffset += aligned;
    // Grow memory if needed
    const pagesNeeded = Math.ceil(memoryOffset / 65536);
    const currentPages = wasmMemory.buffer.byteLength / 65536;
    if (pagesNeeded > currentPages) {
        const pagesToGrow = pagesNeeded - currentPages;
        try {
            wasmMemory.grow(pagesToGrow);
        }
        catch (_e) {
            throw new Error(`Out of memory: failed to grow WASM memory from ${currentPages} to ${pagesNeeded} pages`);
        }
    }
    return ptr;
}
/**
 * Write bytes to WASM memory
 */
function writeBytes(data, ptr) {
    if (!wasmMemory) {
        throw new Error("WASM not initialized");
    }
    const memory = new Uint8Array(wasmMemory.buffer);
    memory.set(data, ptr);
}
/**
 * Read bytes from WASM memory
 */
function readBytes(ptr, length) {
    if (!wasmMemory) {
        throw new Error("WASM not initialized");
    }
    const memory = new Uint8Array(wasmMemory.buffer);
    return memory.slice(ptr, ptr + length);
}
/**
 * Reset memory allocator (currently unused)
 */
// function _resetMemory(): void {
//   memoryOffset = 64 * 1024;
// }
// ============================================================================
// Ripemd160Wasm Namespace
// ============================================================================
export var Ripemd160Wasm;
(function (Ripemd160Wasm) {
    /**
     * Load WASM module (must be called before using other functions)
     */
    async function load() {
        await loadWasm();
    }
    Ripemd160Wasm.load = load;
    /**
     * Compute RIPEMD160 hash (20 bytes)
     *
     * @param data - Input data (Uint8Array or string)
     * @returns 20-byte hash
     *
     * @example
     * ```typescript
     * const hash = Ripemd160Wasm.hash(data);
     * // Uint8Array(20)
     * ```
     */
    function hash(data) {
        if (typeof data === "string") {
            return hashString(data);
        }
        const savedOffset = memoryOffset;
        try {
            if (!wasmInstance) {
                throw new Error("WASM not loaded. Call Ripemd160Wasm.load() first.");
            }
            const exports = wasmInstance.exports;
            const inputPtr = malloc(data.length);
            const outputPtr = malloc(20);
            writeBytes(data, inputPtr);
            const result = exports.ripemd160Hash(inputPtr, data.length, outputPtr);
            if (result !== 0) {
                throw new Error("RIPEMD160 hash computation failed");
            }
            return readBytes(outputPtr, 20);
        }
        finally {
            memoryOffset = savedOffset;
        }
    }
    Ripemd160Wasm.hash = hash;
    /**
     * Compute RIPEMD160 hash of UTF-8 string
     *
     * @param str - Input string
     * @returns 20-byte hash
     *
     * @example
     * ```typescript
     * const hash = Ripemd160Wasm.hashString("hello");
     * // Uint8Array(20)
     * ```
     */
    function hashString(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        return hash(bytes);
    }
    Ripemd160Wasm.hashString = hashString;
})(Ripemd160Wasm || (Ripemd160Wasm = {}));
// Re-export namespace as default
export default Ripemd160Wasm;
