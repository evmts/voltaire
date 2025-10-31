/**
 * WebAssembly module loader for Ethereum primitives
 * Handles WASM instantiation, memory management, and exports wrapping
 */

import type { WasmExports, WasiImports } from "./types.js";
import { ErrorCode } from "./types.js";

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let wasmExports: WasmExports | null = null;
let memoryOffset = 0; // Simple bump allocator

/**
 * Error messages for error codes
 */
const ErrorMessages: Record<ErrorCode, string> = {
	[ErrorCode.SUCCESS]: "Success",
	[ErrorCode.INVALID_HEX]: "Invalid hex string",
	[ErrorCode.INVALID_LENGTH]: "Invalid length",
	[ErrorCode.INVALID_CHECKSUM]: "Invalid checksum",
	[ErrorCode.OUT_OF_MEMORY]: "Out of memory",
	[ErrorCode.INVALID_INPUT]: "Invalid input",
	[ErrorCode.INVALID_SIGNATURE]: "Invalid signature",
	[ErrorCode.INVALID_SELECTOR]: "Invalid function selector",
	[ErrorCode.UNSUPPORTED_TYPE]: "Unsupported ABI type",
	[ErrorCode.MAX_LENGTH_EXCEEDED]: "Maximum length exceeded",
	[ErrorCode.ACCESS_LIST_INVALID]: "Invalid access list",
	[ErrorCode.AUTHORIZATION_INVALID]: "Invalid authorization",
};

/**
 * Load and instantiate the WASM module
 * @param wasmPath - Path to WASM file or ArrayBuffer
 * @returns Promise that resolves when WASM is loaded
 */
export async function loadWasm(
	wasmPath: string | URL | ArrayBuffer,
): Promise<void> {
	if (wasmInstance) {
		return; // Already loaded
	}

	// Minimal WASI shim for wasm32-wasi modules
	const wasi: WasiImports = {
		// args
		args_get: (_argv: number, _argv_buf: number): number => 0,
		args_sizes_get: (argc_ptr: number, argv_buf_size_ptr: number): number => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(argc_ptr, 0, true);
			mem.setUint32(argv_buf_size_ptr, 0, true);
			return 0;
		},
		// environment
		environ_get: (_environ: number, _environ_buf: number): number => 0,
		environ_sizes_get: (
			environ_count_ptr: number,
			environ_buf_size_ptr: number,
		): number => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(environ_count_ptr, 0, true);
			mem.setUint32(environ_buf_size_ptr, 0, true);
			return 0;
		},
		// fds
		fd_write: (
			_fd: number,
			iovs: number,
			iovs_len: number,
			nwritten: number,
		): number => {
			try {
				if (!wasmMemory) return -1;
				const memU32 = new Uint32Array(wasmMemory.buffer);
				let bytes = 0;
				for (let i = 0; i < iovs_len; i++) {
					void (memU32[(iovs >> 2) + i * 2] ?? 0);
					const len = memU32[(iovs >> 2) + i * 2 + 1] ?? 0;
					bytes += len;
				}
				const mem = new DataView(wasmMemory.buffer);
				mem.setUint32(nwritten, bytes, true);
				return 0;
			} catch {
				return 0;
			}
		},
		fd_fdstat_get: (): number => 0,
		fd_filestat_get: (): number => 0,
		fd_seek: (): number => 0,
		fd_close: (): number => 0,
		fd_read: (
			_fd: number,
			_iovs: number,
			_iovs_len: number,
			nread: number,
		): number => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(nread, 0, true);
			return 0;
		},
		fd_pread: (
			_fd: number,
			_iovs: number,
			_iovs_len: number,
			_offset: number,
			nread: number,
		): number => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(nread, 0, true);
			return 0;
		},
		fd_pwrite: (
			_fd: number,
			_iovs: number,
			_iovs_len: number,
			_offset: number,
			nwritten: number,
		): number => {
			if (!wasmMemory) return -1;
			const mem = new DataView(wasmMemory.buffer);
			mem.setUint32(nwritten, 0, true);
			return 0;
		},
		// time
		clock_time_get: (): number => 0,
		// random
		random_get: (buf: number, len: number): number => {
			if (!wasmMemory) return -1;
			const view = new Uint8Array(wasmMemory.buffer, buf, len);
			for (let i = 0; i < view.length; i++) view[i] = 0;
			return 0;
		},
		// process
		proc_exit: (code: number): never => {
			throw new Error(`WASI proc_exit(${code})`);
		},
		sched_yield: (): number => 0,
		poll_oneoff: (): number => 0,
		// path/stat
		path_filestat_get: (): number => 0,
		path_open: (): number => 0,
		path_readlink: (): number => 0,
		fd_prestat_get: (): number => 0,
		fd_prestat_dir_name: (): number => 0,
		fd_datasync: (): number => 0,
		fd_sync: (): number => 0,
	};

	const importObject = {
		env: {},
		wasi_snapshot_preview1: wasi,
	};

	let wasmModule: WebAssembly.WebAssemblyInstantiatedSource;
	if (wasmPath instanceof ArrayBuffer) {
		wasmModule = await WebAssembly.instantiate(wasmPath, importObject);
		wasmInstance = wasmModule.instance;
	} else {
		const response = await fetch(wasmPath);
		const buffer = await response.arrayBuffer();
		wasmModule = await WebAssembly.instantiate(buffer, importObject);
		wasmInstance = wasmModule.instance;
	}

	wasmExports = wasmInstance.exports as unknown as WasmExports;

	// Get memory from WASM exports (WASM creates its own memory)
	wasmMemory = wasmExports.memory as WebAssembly.Memory;
	if (!wasmMemory) {
		throw new Error("WASM module does not export memory");
	}

	// Initialize memory offset for JS allocations
	// WASM static data is at 16MB+ (seen in objdump: segment starts at i32=16777216)
	// WASM stack typically starts high and grows down
	// Start JS allocations at 64KB to be safe, leaving low memory for WASM stack
	memoryOffset = 64 * 1024;
}

/**
 * Get the WASM exports (for direct access if needed)
 * @returns WASM exports
 */
export function getExports(): WasmExports {
	if (!wasmExports) {
		throw new Error("WASM module not loaded. Call loadWasm() first.");
	}
	return wasmExports;
}

/**
 * Allocate memory in WASM linear memory (simple bump allocator)
 * @param size - Number of bytes to allocate
 * @returns Pointer to allocated memory
 */
function malloc(size: number): number {
	// Check if WASM is initialized
	if (!wasmMemory || !wasmMemory.buffer) {
		throw new Error(
			"WASM memory not initialized. Ensure loadWasm() is called before using primitives.",
		);
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
		} catch (e) {
			throw new Error(
				`Out of memory: failed to grow WASM memory from ${currentPages} to ${pagesNeeded} pages (tried to grow by ${pagesToGrow} pages). Current offset: ${memoryOffset}, requested size: ${size}`,
			);
		}
	}

	return ptr;
}

/**
 * Reset memory allocator (call after operations to free memory)
 * @returns void
 */
export function resetMemory(): void {
	memoryOffset = 64 * 1024;
}

/**
 * Write bytes to WASM memory
 * @param data - Data to write
 * @param ptr - Pointer to write to
 */
function writeBytes(data: Uint8Array, ptr: number): void {
	if (!wasmMemory) {
		throw new Error("WASM memory not initialized");
	}
	// CRITICAL: Get fresh buffer reference - wasmMemory.buffer may change after grow()
	const memory = new Uint8Array(wasmMemory.buffer);

	// Validate bounds
	if (ptr < 0 || ptr + data.length > memory.length) {
		throw new Error(
			`Write out of bounds: ptr=${ptr}, data.length=${data.length}, memory.length=${memory.length}`,
		);
	}

	memory.set(data, ptr);
}

/**
 * Read bytes from WASM memory
 * @param ptr - Pointer to read from
 * @param length - Number of bytes to read
 * @returns Data read from memory
 */
function readBytes(ptr: number, length: number): Uint8Array {
	if (!wasmMemory) {
		throw new Error("WASM memory not initialized");
	}
	// CRITICAL: Get fresh buffer reference - wasmMemory.buffer may change after grow()
	const memory = new Uint8Array(wasmMemory.buffer);

	// Validate bounds
	if (ptr < 0 || ptr + length > memory.length) {
		throw new Error(
			`Read out of bounds: ptr=${ptr}, length=${length}, memory.length=${memory.length}`,
		);
	}

	return memory.slice(ptr, ptr + length);
}

/**
 * Write null-terminated string to WASM memory
 * @param str - String to write
 * @returns Pointer to string in WASM memory
 */
function writeString(str: string): number {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(`${str}\0`); // Null-terminated
	const ptr = malloc(bytes.length);
	writeBytes(bytes, ptr);
	return ptr;
}

/**
 * Read fixed-length string from WASM memory (no null terminator required)
 * @param ptr - Pointer to string
 * @param length - Length of string
 * @returns String read from memory
 */
function readFixedString(ptr: number, length: number): string {
	if (!wasmMemory) {
		throw new Error("WASM memory not initialized");
	}
	// CRITICAL: Get fresh buffer reference - wasmMemory.buffer may change after grow()
	const memory = new Uint8Array(wasmMemory.buffer);

	// Validate bounds
	if (ptr < 0 || ptr + length > memory.length) {
		throw new Error(
			`Read string out of bounds: ptr=${ptr}, length=${length}, memory.length=${memory.length}`,
		);
	}

	const decoder = new TextDecoder();
	return decoder.decode(memory.slice(ptr, ptr + length));
}

/**
 * Check result code and throw error if not success
 * @param code - Result code
 * @throws Error if code is not SUCCESS
 */
function checkResult(code: number): void {
	if (code !== ErrorCode.SUCCESS) {
		const message =
			ErrorMessages[code as ErrorCode] || `Unknown error (code: ${code})`;
		throw new Error(message);
	}
}

// ============================================================================
// Address API
// ============================================================================

/**
 * Create address from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 20-byte address
 */
export function addressFromHex(hex: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		const outPtr = malloc(20);

		const result = exports.primitives_address_from_hex(hexPtr, outPtr);
		checkResult(result);
		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert address to hex string
 * @param address - 20-byte address
 * @returns Hex string with 0x prefix
 */
export function addressToHex(address: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const addrPtr = malloc(20);
		const outPtr = malloc(42);

		writeBytes(address, addrPtr);
		const result = exports.primitives_address_to_hex(addrPtr, outPtr);
		checkResult(result);
		return readFixedString(outPtr, 42);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert address to checksummed hex (EIP-55)
 * @param address - 20-byte address
 * @returns Checksummed hex string
 */
export function addressToChecksumHex(address: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const addrPtr = malloc(20);
		const outPtr = malloc(42);

		writeBytes(address, addrPtr);
		const result = exports.primitives_address_to_checksum_hex(addrPtr, outPtr);
		checkResult(result);
		return readFixedString(outPtr, 42);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if address is zero address
 * @param address - 20-byte address
 * @returns True if zero address
 */
export function addressIsZero(address: Uint8Array): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const addrPtr = malloc(20);
		writeBytes(address, addrPtr);
		return exports.primitives_address_is_zero(addrPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compare two addresses for equality
 * @param a - First address
 * @param b - Second address
 * @returns True if equal
 */
export function addressEquals(a: Uint8Array, b: Uint8Array): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const aPtr = malloc(20);
		const bPtr = malloc(20);

		writeBytes(a, aPtr);
		writeBytes(b, bPtr);
		return exports.primitives_address_equals(aPtr, bPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Validate EIP-55 checksum
 * @param hex - Hex string to validate
 * @returns True if checksum is valid
 */
export function addressValidateChecksum(hex: string): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		return exports.primitives_address_validate_checksum(hexPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Calculate CREATE contract address
 * @param sender - Sender address (20 bytes)
 * @param nonce - Nonce
 * @returns Contract address (20 bytes)
 */
export function calculateCreateAddress(
	sender: Uint8Array,
	nonce: number,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const senderPtr = malloc(20);
		const outPtr = malloc(20);

		writeBytes(sender, senderPtr);
		const result = exports.primitives_calculate_create_address(
			senderPtr,
			BigInt(nonce),
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Calculate CREATE2 contract address
 * @param sender - Sender address (20 bytes)
 * @param salt - Salt (32 bytes)
 * @param initCode - Init code
 * @returns Contract address (20 bytes)
 */
export function calculateCreate2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCode: Uint8Array,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const senderPtr = malloc(20);
		const saltPtr = malloc(32);
		const codePtr = malloc(initCode.length);
		const outPtr = malloc(20);

		writeBytes(sender, senderPtr);
		writeBytes(salt, saltPtr);
		writeBytes(initCode, codePtr);
		const result = exports.primitives_calculate_create2_address(
			senderPtr,
			saltPtr,
			codePtr,
			initCode.length,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Keccak-256 API
// ============================================================================

/**
 * Compute Keccak-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export function keccak256(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(32);

		writeBytes(data, dataPtr);
		const result = exports.primitives_keccak256(dataPtr, data.length, outPtr);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert hash to hex string
 * @param hash - 32-byte hash
 * @returns Hex string with 0x prefix
 */
export function hashToHex(hash: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hashPtr = malloc(32);
		const outPtr = malloc(66);

		writeBytes(hash, hashPtr);
		const result = exports.primitives_hash_to_hex(hashPtr, outPtr);
		checkResult(result);
		return readFixedString(outPtr, 66);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Create hash from hex string
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte hash
 */
export function hashFromHex(hex: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		const outPtr = malloc(32);

		const result = exports.primitives_hash_from_hex(hexPtr, outPtr);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compare two hashes for equality (constant-time)
 * @param a - First hash
 * @param b - Second hash
 * @returns True if equal
 */
export function hashEquals(a: Uint8Array, b: Uint8Array): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const aPtr = malloc(32);
		const bPtr = malloc(32);

		writeBytes(a, aPtr);
		writeBytes(b, bPtr);
		return exports.primitives_hash_equals(aPtr, bPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Hash message using EIP-191 format
 * @param message - Message to hash
 * @returns 32-byte hash
 */
export function eip191HashMessage(message: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const msgPtr = malloc(message.length);
		const outPtr = malloc(32);

		writeBytes(message, msgPtr);
		const result = exports.primitives_eip191_hash_message(
			msgPtr,
			message.length,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Hash Algorithms API
// ============================================================================

/**
 * Compute SHA-256 hash
 * @param data - Input data
 * @returns 32-byte hash
 */
export function sha256(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(32);

		writeBytes(data, dataPtr);
		const result = exports.primitives_sha256(dataPtr, data.length, outPtr);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compute RIPEMD-160 hash
 * @param data - Input data
 * @returns 20-byte hash
 */
export function ripemd160(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(20);

		writeBytes(data, dataPtr);
		const result = exports.primitives_ripemd160(dataPtr, data.length, outPtr);
		checkResult(result);
		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compute BLAKE2b hash
 * @param data - Input data
 * @returns 64-byte hash
 */
export function blake2b(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(64);

		writeBytes(data, dataPtr);
		const result = exports.primitives_blake2b(dataPtr, data.length, outPtr);
		checkResult(result);
		return readBytes(outPtr, 64);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compute BLAKE2b hash with variable output length
 * @param data - Input data
 * @param outputLength - Output length in bytes (1-64)
 * @returns BLAKE2b hash of specified length
 */
export function blake2Hash(data: Uint8Array, outputLength: number): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(outputLength);

		writeBytes(data, dataPtr);
		const result = exports.blake2Hash(dataPtr, data.length, outPtr, outputLength);
		checkResult(result);
		return readBytes(outPtr, outputLength);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export function solidityKeccak256(packedData: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(packedData.length);
		const outPtr = malloc(32);

		writeBytes(packedData, dataPtr);
		const result = exports.primitives_solidity_keccak256(
			dataPtr,
			packedData.length,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param packedData - Pre-packed data bytes
 * @returns 32-byte hash
 */
export function soliditySha256(packedData: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(packedData.length);
		const outPtr = malloc(32);

		writeBytes(packedData, dataPtr);
		const result = exports.primitives_solidity_sha256(
			dataPtr,
			packedData.length,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// RLP API
// ============================================================================

/**
 * Encode bytes as RLP
 * @param data - Data to encode
 * @returns RLP-encoded data
 */
export function rlpEncodeBytes(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(data.length + 10); // RLP adds small overhead

		writeBytes(data, dataPtr);
		const resultLen = exports.primitives_rlp_encode_bytes(
			dataPtr,
			data.length,
			outPtr,
			data.length + 10,
		);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Encode unsigned integer as RLP
 * @param value - 32-byte big-endian u256
 * @returns RLP-encoded data
 */
export function rlpEncodeUint(value: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const valuePtr = malloc(32);
		const outPtr = malloc(40); // u256 RLP max size

		writeBytes(value, valuePtr);
		const resultLen = exports.primitives_rlp_encode_uint(valuePtr, outPtr, 40);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert RLP bytes to hex string
 * @param rlpData - RLP-encoded data
 * @returns Hex string with 0x prefix
 */
export function rlpToHex(rlpData: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(rlpData.length);
		const outPtr = malloc(rlpData.length * 2 + 2);

		writeBytes(rlpData, dataPtr);
		const resultLen = exports.primitives_rlp_to_hex(
			dataPtr,
			rlpData.length,
			outPtr,
			rlpData.length * 2 + 2,
		);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readFixedString(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert hex string to RLP bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns RLP bytes
 */
export function rlpFromHex(hex: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		const outPtr = malloc(hex.length); // Worst case: all hex chars

		const resultLen = exports.primitives_rlp_from_hex(
			hexPtr,
			outPtr,
			hex.length,
		);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Bytecode API
// ============================================================================

/**
 * Analyze bytecode to find JUMPDEST locations
 * @param code - EVM bytecode
 * @returns Array of JUMPDEST positions
 */
export function bytecodeAnalyzeJumpdests(code: Uint8Array): number[] {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const codePtr = malloc(code.length);
		const outPtr = malloc(code.length * 4); // u32 per potential JUMPDEST

		writeBytes(code, codePtr);
		const count = exports.primitives_bytecode_analyze_jumpdests(
			codePtr,
			code.length,
			outPtr,
			code.length,
		);
		if (count < 0) {
			checkResult(count);
		}

		// Read u32 array
		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}
		// CRITICAL: Get fresh buffer reference - wasmMemory.buffer may change after grow()
		const memory = new Uint32Array(wasmMemory.buffer);

		// Validate bounds
		if (outPtr < 0 || outPtr + count * 4 > wasmMemory.buffer.byteLength) {
			throw new Error(
				`Read u32 array out of bounds: outPtr=${outPtr}, count=${count}, memory.length=${wasmMemory.buffer.byteLength}`,
			);
		}

		const results: number[] = [];
		for (let i = 0; i < count; i++) {
			const value = memory[outPtr / 4 + i] ?? 0;
			results.push(value);
		}
		return results;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if position is at bytecode boundary
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if at boundary
 */
export function bytecodeIsBoundary(
	code: Uint8Array,
	position: number,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const codePtr = malloc(code.length);
		writeBytes(code, codePtr);
		return (
			exports.primitives_bytecode_is_boundary(
				codePtr,
				code.length,
				position,
			) !== 0
		);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if position is a valid JUMPDEST
 * @param code - EVM bytecode
 * @param position - Position to check
 * @returns True if valid JUMPDEST
 */
export function bytecodeIsValidJumpdest(
	code: Uint8Array,
	position: number,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const codePtr = malloc(code.length);
		writeBytes(code, codePtr);
		return (
			exports.primitives_bytecode_is_valid_jumpdest(
				codePtr,
				code.length,
				position,
			) !== 0
		);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Validate bytecode for basic correctness
 * @param code - EVM bytecode
 * @throws Error if bytecode is invalid
 */
export function bytecodeValidate(code: Uint8Array): void {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const codePtr = malloc(code.length);
		writeBytes(code, codePtr);
		const result = exports.primitives_bytecode_validate(codePtr, code.length);
		checkResult(result);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// U256 API
// ============================================================================

/**
 * Convert hex string to U256 (32-byte big-endian)
 * @param hex - Hex string (with or without 0x prefix)
 * @returns 32-byte U256 value
 */
export function u256FromHex(hex: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		const outPtr = malloc(32);

		const result = exports.primitives_u256_from_hex(hexPtr, outPtr);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert U256 to hex string
 * @param value - 32-byte U256 value (big-endian)
 * @returns Hex string with 0x prefix (66 chars)
 */
export function u256ToHex(value: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const valuePtr = malloc(32);
		const outPtr = malloc(66);

		writeBytes(value, valuePtr);
		const result = exports.primitives_u256_to_hex(valuePtr, outPtr, 66);
		checkResult(result);
		return readFixedString(outPtr, 66);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Hex API
// ============================================================================

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Raw bytes
 */
export function hexToBytes(hex: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hexPtr = writeString(hex);
		const outPtr = malloc(hex.length); // Worst case: all hex chars become bytes

		const resultLen = exports.primitives_hex_to_bytes(
			hexPtr,
			outPtr,
			hex.length,
		);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Convert bytes to hex string
 * @param data - Raw bytes
 * @returns Hex string with 0x prefix
 */
export function bytesToHex(data: Uint8Array): string {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const outPtr = malloc(data.length * 2 + 3); // "0x" + 2 chars per byte + null terminator

		writeBytes(data, dataPtr);
		const resultLen = exports.primitives_bytes_to_hex(
			dataPtr,
			data.length,
			outPtr,
			data.length * 2 + 3,
		);
		if (resultLen < 0) {
			checkResult(resultLen);
		}
		return readFixedString(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Transaction API
// ============================================================================

/**
 * Detect transaction type from serialized data
 * @param data - RLP-encoded transaction data
 * @returns Transaction type (0=Legacy, 1=EIP2930, 2=EIP1559, 3=EIP4844, 4=EIP7702)
 */
export function txDetectType(data: Uint8Array): number {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		writeBytes(data, dataPtr);
		const txType = exports.primitives_tx_detect_type(dataPtr, data.length);
		if (txType < 0) {
			checkResult(txType);
		}
		return txType;
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Wallet API
// ============================================================================

/**
 * Generate a cryptographically secure random private key
 * @returns 32-byte private key
 */
export function generatePrivateKey(): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const outPtr = malloc(32);
		const result = exports.primitives_generate_private_key(outPtr);
		checkResult(result);
		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Compress uncompressed secp256k1 public key
 * @param uncompressed - 64-byte uncompressed public key (x, y coordinates)
 * @returns 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export function compressPublicKey(uncompressed: Uint8Array): Uint8Array {
	if (uncompressed.length !== 64) {
		throw new Error("Uncompressed public key must be 64 bytes");
	}

	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const uncompressedPtr = malloc(64);
		const outPtr = malloc(33);

		writeBytes(uncompressed, uncompressedPtr);
		const result = exports.primitives_compress_public_key(
			uncompressedPtr,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 33);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Signature API (secp256k1)
// ============================================================================

/**
 * Sign message hash with private key
 * @param messageHash - 32-byte message hash
 * @param privateKey - 32-byte private key
 * @returns Object with r (32 bytes), s (32 bytes), and v (recovery ID 0-1)
 */
export function secp256k1Sign(
	messageHash: Uint8Array,
	privateKey: Uint8Array,
): { r: Uint8Array; s: Uint8Array; v: number } {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hashPtr = malloc(32);
		const keyPtr = malloc(32);
		const sigPtr = malloc(64);
		const recidPtr = malloc(1);

		writeBytes(messageHash, hashPtr);
		writeBytes(privateKey, keyPtr);

		const result = exports.secp256k1Sign(hashPtr, keyPtr, sigPtr, recidPtr);
		if (result !== 0) {
			throw new Error("secp256k1 signing failed");
		}

		const sig = readBytes(sigPtr, 64);
		const recid = readBytes(recidPtr, 1);

		return {
			r: sig.slice(0, 32),
			s: sig.slice(32, 64),
			v: recid[0] ?? 0,
		};
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Verify ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param publicKey - Uncompressed public key (64 bytes)
 * @returns True if signature is valid
 */
export function secp256k1Verify(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	publicKey: Uint8Array,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hashPtr = malloc(32);
		const sigPtr = malloc(64);
		const pubKeyPtr = malloc(64);

		writeBytes(messageHash, hashPtr);
		const sig = new Uint8Array(64);
		sig.set(r, 0);
		sig.set(s, 32);
		writeBytes(sig, sigPtr);
		writeBytes(publicKey, pubKeyPtr);

		const result = exports.secp256k1Verify(hashPtr, sigPtr, pubKeyPtr);
		return result !== 0; // Returns 1 for valid, 0 for invalid
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Recover public key from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Uncompressed public key (64 bytes)
 */
export function secp256k1RecoverPubkey(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	v: number,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hashPtr = malloc(32);
		const rPtr = malloc(32);
		const sPtr = malloc(32);
		const outPtr = malloc(64);

		writeBytes(messageHash, hashPtr);
		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		const result = exports.primitives_secp256k1_recover_pubkey(
			hashPtr,
			rPtr,
			sPtr,
			v,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 64);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Recover Ethereum address from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Ethereum address (20 bytes)
 */
export function secp256k1RecoverAddress(
	messageHash: Uint8Array,
	r: Uint8Array,
	s: Uint8Array,
	v: number,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const hashPtr = malloc(32);
		const rPtr = malloc(32);
		const sPtr = malloc(32);
		const outPtr = malloc(20);

		writeBytes(messageHash, hashPtr);
		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		const result = exports.primitives_secp256k1_recover_address(
			hashPtr,
			rPtr,
			sPtr,
			v,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Derive public key from private key
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export function secp256k1PubkeyFromPrivate(privateKey: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const keyPtr = malloc(32);
		const outPtr = malloc(64);

		writeBytes(privateKey, keyPtr);

		const result = exports.primitives_secp256k1_pubkey_from_private(
			keyPtr,
			outPtr,
		);
		checkResult(result);
		return readBytes(outPtr, 64);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Validate ECDSA signature components
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is valid
 */
export function secp256k1ValidateSignature(
	r: Uint8Array,
	s: Uint8Array,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const rPtr = malloc(32);
		const sPtr = malloc(32);

		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		return exports.primitives_secp256k1_validate_signature(rPtr, sPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Normalize signature to canonical form (low-s)
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns Normalized [r, s] components
 */
export function signatureNormalize(
	r: Uint8Array,
	s: Uint8Array,
): [Uint8Array, Uint8Array] {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const rPtr = malloc(32);
		const sPtr = malloc(32);

		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		// This modifies s in-place if needed
		exports.primitives_signature_normalize(rPtr, sPtr);

		// Read back the (potentially modified) values
		const normalizedR = readBytes(rPtr, 32);
		const normalizedS = readBytes(sPtr, 32);
		return [normalizedR, normalizedS];
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if signature is in canonical form
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @returns True if signature is canonical
 */
export function signatureIsCanonical(r: Uint8Array, s: Uint8Array): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const rPtr = malloc(32);
		const sPtr = malloc(32);

		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		return exports.primitives_signature_is_canonical(rPtr, sPtr) !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Parse signature from compact format
 * @param sigData - Signature bytes (64 or 65 bytes)
 * @returns [r, s, v] components
 */
export function signatureParse(
	sigData: Uint8Array,
): [Uint8Array, Uint8Array, Uint8Array] {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const sigPtr = malloc(sigData.length);
		const rPtr = malloc(32);
		const sPtr = malloc(32);
		const vPtr = malloc(1);

		writeBytes(sigData, sigPtr);

		const result = exports.primitives_signature_parse(
			sigPtr,
			sigData.length,
			rPtr,
			sPtr,
			vPtr,
		);
		checkResult(result);

		const r = readBytes(rPtr, 32);
		const s = readBytes(sPtr, 32);
		const v = readBytes(vPtr, 1);
		return [r, s, v];
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Serialize signature to compact format
 * @param r - R component (32 bytes)
 * @param s - S component (32 bytes)
 * @param v - Recovery parameter
 * @param includeV - Whether to include v byte
 * @returns Serialized signature
 */
export function signatureSerialize(
	r: Uint8Array,
	s: Uint8Array,
	v: number,
	includeV: boolean,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const rPtr = malloc(32);
		const sPtr = malloc(32);
		const outPtr = malloc(65);

		writeBytes(r, rPtr);
		writeBytes(s, sPtr);

		const resultLen = exports.primitives_signature_serialize(
			rPtr,
			sPtr,
			v,
			includeV ? 1 : 0,
			outPtr,
		);

		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// ABI API
// ============================================================================

/**
 * Compute function selector from signature
 * @param signature - Function signature string (e.g., "transfer(address,uint256)")
 * @returns 4-byte selector
 */
export function abiComputeSelector(signature: string): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const sigPtr = writeString(signature);
		const outPtr = malloc(4);

		const result = exports.primitives_abi_compute_selector(sigPtr, outPtr);
		checkResult(result);
		return readBytes(outPtr, 4);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Encode ABI parameters
 * @param types - Array of type strings (e.g., ["address", "uint256", "bool"])
 * @param values - Array of value strings (e.g., ["0x...", "42", "true"])
 * @returns Encoded ABI data
 */
export function abiEncodeParameters(
	types: string[],
	values: string[],
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();

		// Convert arrays to JSON strings
		const typesJson = JSON.stringify(types);
		const valuesJson = JSON.stringify(values);

		const typesPtr = writeString(typesJson);
		const valuesPtr = writeString(valuesJson);

		// Allocate output buffer (estimate: 32 bytes per parameter + overhead)
		const estimatedSize = types.length * 64 + 1024;
		const outPtr = malloc(estimatedSize);

		const resultLen = exports.primitives_abi_encode_parameters(
			typesPtr,
			valuesPtr,
			outPtr,
			estimatedSize,
		);

		if (resultLen < 0) {
			checkResult(resultLen);
		}

		return readBytes(outPtr, resultLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Decode ABI parameters
 * @param data - Encoded ABI data
 * @param types - Array of type strings (e.g., ["address", "uint256", "bool"])
 * @returns Array of decoded value strings
 */
export function abiDecodeParameters(
	data: Uint8Array,
	types: string[],
): string[] {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();

		// Convert types array to JSON string
		const typesJson = JSON.stringify(types);

		const dataPtr = malloc(data.length);
		writeBytes(data, dataPtr);

		const typesPtr = writeString(typesJson);

		// Allocate output buffer for JSON result (estimate: 66 bytes per value + overhead)
		const estimatedSize = types.length * 128 + 1024;
		const outPtr = malloc(estimatedSize);

		const resultLen = exports.primitives_abi_decode_parameters(
			dataPtr,
			data.length,
			typesPtr,
			outPtr,
			estimatedSize,
		);

		if (resultLen < 0) {
			checkResult(resultLen);
		}

		// Read JSON string result
		const jsonStr = readFixedString(outPtr, resultLen);

		// Parse JSON array
		return JSON.parse(jsonStr) as string[];
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Access List API (EIP-2930)
// ============================================================================

/**
 * Calculate gas cost for access list
 * @param accessList - Access list items
 * @returns Gas cost
 */
export function accessListGasCost(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
): bigint {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const jsonStr = JSON.stringify(
			accessList.map((item) => ({
				address: Array.from(item.address),
				storageKeys: item.storageKeys.map((k) => Array.from(k)),
			})),
		);

		const jsonPtr = writeString(jsonStr);
		const outPtr = malloc(8);

		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}

		const result = exports.primitives_access_list_gas_cost(jsonPtr, outPtr);
		checkResult(result);

		const view = new DataView(wasmMemory.buffer);
		return view.getBigUint64(outPtr, true);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Calculate gas savings from using access list
 * @param accessList - Access list items
 * @returns Gas savings
 */
export function accessListGasSavings(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
): bigint {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const jsonStr = JSON.stringify(
			accessList.map((item) => ({
				address: Array.from(item.address),
				storageKeys: item.storageKeys.map((k) => Array.from(k)),
			})),
		);

		const jsonPtr = writeString(jsonStr);
		const outPtr = malloc(8);

		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}

		const result = exports.primitives_access_list_gas_savings(jsonPtr, outPtr);
		checkResult(result);

		const view = new DataView(wasmMemory.buffer);
		return view.getBigUint64(outPtr, true);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if address is in access list
 * @param accessList - Access list items
 * @param address - Address to check
 * @returns True if address is in list
 */
export function accessListIncludesAddress(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
	address: Uint8Array,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const jsonStr = JSON.stringify(
			accessList.map((item) => ({
				address: Array.from(item.address),
				storageKeys: item.storageKeys.map((k) => Array.from(k)),
			})),
		);

		const jsonPtr = writeString(jsonStr);
		const addrPtr = malloc(20);
		writeBytes(address, addrPtr);

		const result = exports.primitives_access_list_includes_address(
			jsonPtr,
			addrPtr,
		);
		return result !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if storage key is in access list for address
 * @param accessList - Access list items
 * @param address - Address to check
 * @param storageKey - Storage key to check
 * @returns True if storage key is in list
 */
export function accessListIncludesStorageKey(
	accessList: Array<{ address: Uint8Array; storageKeys: Uint8Array[] }>,
	address: Uint8Array,
	storageKey: Uint8Array,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const jsonStr = JSON.stringify(
			accessList.map((item) => ({
				address: Array.from(item.address),
				storageKeys: item.storageKeys.map((k) => Array.from(k)),
			})),
		);

		const jsonPtr = writeString(jsonStr);
		const addrPtr = malloc(20);
		const keyPtr = malloc(32);
		writeBytes(address, addrPtr);
		writeBytes(storageKey, keyPtr);

		const result = exports.primitives_access_list_includes_storage_key(
			jsonPtr,
			addrPtr,
			keyPtr,
		);
		return result !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Authorization API (EIP-7702)
// ============================================================================

/**
 * Validate authorization structure
 * @param auth - Authorization to validate
 * @throws Error if invalid
 */
export function authorizationValidate(auth: {
	chainId: bigint;
	address: Uint8Array;
	nonce: bigint;
	yParity: number;
	r: bigint;
	s: bigint;
}): void {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const authPtr = malloc(20 + 8 + 8 + 8 + 32 + 32); // Full struct size

		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}

		// Write authorization structure
		const view = new DataView(wasmMemory.buffer);
		const memory = new Uint8Array(wasmMemory.buffer);

		view.setBigUint64(authPtr, auth.chainId, true);
		memory.set(auth.address, authPtr + 8);
		view.setBigUint64(authPtr + 28, auth.nonce, true);
		view.setBigUint64(authPtr + 36, BigInt(auth.yParity), true);

		// Write r and s as big-endian
		const rBytes = new Uint8Array(32);
		const sBytes = new Uint8Array(32);
		const rView = new DataView(rBytes.buffer);
		const sView = new DataView(sBytes.buffer);
		rView.setBigUint64(0, auth.r >> 192n, false);
		rView.setBigUint64(8, (auth.r >> 128n) & 0xffffffffffffffffn, false);
		rView.setBigUint64(16, (auth.r >> 64n) & 0xffffffffffffffffn, false);
		rView.setBigUint64(24, auth.r & 0xffffffffffffffffn, false);
		sView.setBigUint64(0, auth.s >> 192n, false);
		sView.setBigUint64(8, (auth.s >> 128n) & 0xffffffffffffffffn, false);
		sView.setBigUint64(16, (auth.s >> 64n) & 0xffffffffffffffffn, false);
		sView.setBigUint64(24, auth.s & 0xffffffffffffffffn, false);

		memory.set(rBytes, authPtr + 44);
		memory.set(sBytes, authPtr + 76);

		const result = exports.primitives_authorization_validate(authPtr);
		checkResult(result);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Calculate signing hash for authorization
 * @param chainId - Chain ID
 * @param address - Target address
 * @param nonce - Nonce
 * @returns Signing hash
 */
export function authorizationSigningHash(
	chainId: bigint,
	address: Uint8Array,
	nonce: bigint,
): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const addrPtr = malloc(20);
		const outPtr = malloc(32);

		writeBytes(address, addrPtr);

		const result = exports.primitives_authorization_signing_hash(
			chainId,
			addrPtr,
			nonce,
			outPtr,
		);
		checkResult(result);

		return readBytes(outPtr, 32);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Recover authority (signer) from authorization
 * @param auth - Authorization to recover from
 * @returns Recovered authority address
 */
export function authorizationAuthority(auth: {
	chainId: bigint;
	address: Uint8Array;
	nonce: bigint;
	yParity: number;
	r: bigint;
	s: bigint;
}): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const authPtr = malloc(108);
		const outPtr = malloc(20);

		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}

		// Write authorization structure (same as validate)
		const view = new DataView(wasmMemory.buffer);
		const memory = new Uint8Array(wasmMemory.buffer);

		view.setBigUint64(authPtr, auth.chainId, true);
		memory.set(auth.address, authPtr + 8);
		view.setBigUint64(authPtr + 28, auth.nonce, true);
		view.setBigUint64(authPtr + 36, BigInt(auth.yParity), true);

		const rBytes = new Uint8Array(32);
		const sBytes = new Uint8Array(32);
		const rView = new DataView(rBytes.buffer);
		const sView = new DataView(sBytes.buffer);
		rView.setBigUint64(0, auth.r >> 192n, false);
		rView.setBigUint64(8, (auth.r >> 128n) & 0xffffffffffffffffn, false);
		rView.setBigUint64(16, (auth.r >> 64n) & 0xffffffffffffffffn, false);
		rView.setBigUint64(24, auth.r & 0xffffffffffffffffn, false);
		sView.setBigUint64(0, auth.s >> 192n, false);
		sView.setBigUint64(8, (auth.s >> 128n) & 0xffffffffffffffffn, false);
		sView.setBigUint64(16, (auth.s >> 64n) & 0xffffffffffffffffn, false);
		sView.setBigUint64(24, auth.s & 0xffffffffffffffffn, false);

		memory.set(rBytes, authPtr + 44);
		memory.set(sBytes, authPtr + 76);

		const result = exports.primitives_authorization_authority(authPtr, outPtr);
		checkResult(result);

		return readBytes(outPtr, 20);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Calculate gas cost for authorization list
 * @param authCount - Number of authorizations
 * @param emptyAccounts - Number of empty accounts
 * @returns Gas cost
 */
export function authorizationGasCost(
	authCount: number,
	emptyAccounts: number,
): bigint {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		return exports.primitives_authorization_gas_cost(authCount, emptyAccounts);
	} finally {
		memoryOffset = savedOffset;
	}
}

// ============================================================================
// Blob API (EIP-4844)
// ============================================================================

/**
 * Blob size constant (131072 bytes = 128 KB)
 */
export const BLOB_SIZE = 131072;

/**
 * Encode data as blob (with length prefix)
 * @param data - Data to encode
 * @returns Blob (131072 bytes)
 */
export function blobFromData(data: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const dataPtr = malloc(data.length);
		const blobPtr = malloc(BLOB_SIZE);

		writeBytes(data, dataPtr);
		const result = exports.primitives_blob_from_data(
			dataPtr,
			data.length,
			blobPtr,
		);
		checkResult(result);
		return readBytes(blobPtr, BLOB_SIZE);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Decode blob to extract original data
 * @param blob - Blob data (131072 bytes)
 * @returns Original data
 */
export function blobToData(blob: Uint8Array): Uint8Array {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();
		const blobPtr = malloc(BLOB_SIZE);
		const outPtr = malloc(BLOB_SIZE); // Max size
		const outLenPtr = malloc(8); // usize pointer

		writeBytes(blob, blobPtr);
		const result = exports.primitives_blob_to_data(blobPtr, outPtr, outLenPtr);
		checkResult(result);

		// Read length
		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}
		const memory = new DataView(wasmMemory.buffer);
		const dataLen = Number(memory.getBigUint64(outLenPtr, true));

		return readBytes(outPtr, dataLen);
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Validate blob size
 * @param blobLen - Length to validate
 * @returns true if valid blob size
 */
export function blobIsValid(blobLen: number): boolean {
	const exports = getExports();
	return exports.primitives_blob_is_valid(blobLen) !== 0;
}

/**
 * Calculate total blob gas for number of blobs
 * @param blobCount - Number of blobs
 * @returns Total blob gas
 */
export function blobCalculateGas(blobCount: number): bigint {
	const exports = getExports();
	return exports.primitives_blob_calculate_gas(blobCount);
}

/**
 * Estimate number of blobs needed for data size
 * @param dataSize - Size of data in bytes
 * @returns Number of blobs required
 */
export function blobEstimateCount(dataSize: number): number {
	const exports = getExports();
	return exports.primitives_blob_estimate_count(dataSize);
}

/**
 * Calculate blob gas price from excess blob gas
 * @param excessBlobGas - Excess blob gas
 * @returns Blob gas price
 */
export function blobCalculateGasPrice(excessBlobGas: bigint): bigint {
	const exports = getExports();
	return exports.primitives_blob_calculate_gas_price(excessBlobGas);
}

/**
 * Calculate excess blob gas for next block
 * @param parentExcess - Parent block excess blob gas
 * @param parentUsed - Parent block blob gas used
 * @returns Excess blob gas for next block
 */
export function blobCalculateExcessGas(
	parentExcess: bigint,
	parentUsed: bigint,
): bigint {
	const exports = getExports();
	return exports.primitives_blob_calculate_excess_gas(
		parentExcess,
		parentUsed,
	);
}

// ============================================================================
// Event Log API
// ============================================================================

/**
 * Check if event log matches address filter
 * @param logAddress - Log address (20 bytes)
 * @param filterAddresses - Array of filter addresses
 * @returns true if matches
 */
export function eventLogMatchesAddress(
	logAddress: Uint8Array,
	filterAddresses: Uint8Array[],
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();

		// Write log address
		const logAddrPtr = malloc(20);
		writeBytes(logAddress, logAddrPtr);

		// Write filter addresses as contiguous array
		const filterPtr = malloc(filterAddresses.length * 20);
		for (let i = 0; i < filterAddresses.length; i++) {
			writeBytes(filterAddresses[i]!, filterPtr + i * 20);
		}

		const result = exports.primitives_eventlog_matches_address(
			logAddrPtr,
			filterPtr,
			filterAddresses.length,
		);

		return result !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if event log matches single topic filter
 * @param logTopic - Log topic (32 bytes)
 * @param filterTopic - Filter topic (32 bytes) or null
 * @returns true if matches
 */
export function eventLogMatchesTopic(
	logTopic: Uint8Array,
	filterTopic: Uint8Array | null,
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();

		const logTopicPtr = malloc(32);
		writeBytes(logTopic, logTopicPtr);

		const filterTopicPtr = malloc(32);
		const nullTopic = filterTopic === null ? 1 : 0;

		if (filterTopic !== null) {
			writeBytes(filterTopic, filterTopicPtr);
		}

		const result = exports.primitives_eventlog_matches_topic(
			logTopicPtr,
			filterTopicPtr,
			nullTopic,
		);

		return result !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}

/**
 * Check if event log matches topic array filter
 * @param logTopics - Array of log topics
 * @param filterTopics - Array of filter topics (null entries match any)
 * @returns true if matches
 */
export function eventLogMatchesTopics(
	logTopics: Uint8Array[],
	filterTopics: (Uint8Array | null)[],
): boolean {
	const savedOffset = memoryOffset;
	try {
		const exports = getExports();

		// Write log topics as contiguous array
		const logTopicsPtr = malloc(logTopics.length * 32);
		for (let i = 0; i < logTopics.length; i++) {
			writeBytes(logTopics[i]!, logTopicsPtr + i * 32);
		}

		// Write filter topics
		const filterTopicsPtr = malloc(filterTopics.length * 32);
		const filterNullsPtr = malloc(filterTopics.length * 4); // c_int array

		if (!wasmMemory) {
			throw new Error("WASM memory not initialized");
		}
		const memory = new Int32Array(wasmMemory.buffer);

		for (let i = 0; i < filterTopics.length; i++) {
			const filterTopic = filterTopics[i];
			const idx = filterNullsPtr / 4 + i;
			if (filterTopic === null) {
				memory[idx] = 1;
			} else {
				memory[idx] = 0;
				writeBytes(filterTopic!, filterTopicsPtr + i * 32);
			}
		}

		const result = exports.primitives_eventlog_matches_topics(
			logTopicsPtr,
			logTopics.length,
			filterTopicsPtr,
			filterNullsPtr,
			filterTopics.length,
		);

		return result !== 0;
	} finally {
		memoryOffset = savedOffset;
	}
}
