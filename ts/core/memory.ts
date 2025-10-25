/**
 * Memory management utilities for WASM and FFI
 *
 * Provides helpers for:
 * - Allocating/deallocating WASM memory
 * - Converting between JavaScript and C memory representations
 * - Buffer management and cleanup patterns
 */

/**
 * WASM memory allocation helper
 */
export interface WasmAllocator {
	/**
	 * Allocate memory in WASM heap
	 * @param size Number of bytes to allocate
	 * @returns Pointer to allocated memory
	 */
	malloc(size: number): number;

	/**
	 * Free allocated memory
	 * @param ptr Pointer to memory to free
	 */
	free(ptr: number): void;

	/**
	 * Get WASM memory buffer
	 * @returns Uint8Array view of WASM memory
	 */
	getMemory(): Uint8Array;
}

/**
 * Managed memory allocation that ensures cleanup
 */
export class ManagedBuffer {
	private readonly allocator: WasmAllocator;
	private readonly ptr: number;
	private readonly size: number;
	private freed = false;

	constructor(allocator: WasmAllocator, size: number) {
		this.allocator = allocator;
		this.size = size;
		this.ptr = allocator.malloc(size);

		if (this.ptr === 0) {
			throw new Error("Failed to allocate WASM memory");
		}
	}

	/**
	 * Get pointer to allocated memory
	 */
	getPointer(): number {
		if (this.freed) {
			throw new Error("Buffer has been freed");
		}
		return this.ptr;
	}

	/**
	 * Get size of allocated buffer
	 */
	getSize(): number {
		return this.size;
	}

	/**
	 * Get view into WASM memory at this buffer location
	 */
	getView(): Uint8Array {
		if (this.freed) {
			throw new Error("Buffer has been freed");
		}
		const memory = this.allocator.getMemory();
		return new Uint8Array(memory.buffer, this.ptr, this.size);
	}

	/**
	 * Write data to buffer
	 * @param data Data to write
	 */
	write(data: Uint8Array): void {
		if (this.freed) {
			throw new Error("Buffer has been freed");
		}
		if (data.length > this.size) {
			throw new Error(
				`Data size ${data.length} exceeds buffer size ${this.size}`,
			);
		}
		const view = this.getView();
		view.set(data);
	}

	/**
	 * Read data from buffer
	 * @returns Copy of buffer contents
	 */
	read(): Uint8Array {
		if (this.freed) {
			throw new Error("Buffer has been freed");
		}
		const view = this.getView();
		return new Uint8Array(view);
	}

	/**
	 * Free allocated memory
	 */
	free(): void {
		if (!this.freed) {
			this.allocator.free(this.ptr);
			this.freed = true;
		}
	}

	/**
	 * Ensure buffer is freed (for use with try/finally)
	 */
	dispose(): void {
		this.free();
	}
}

/**
 * Execute function with automatically managed WASM buffer
 *
 * @param allocator WASM allocator
 * @param size Buffer size in bytes
 * @param fn Function to execute with buffer
 * @returns Result from function
 *
 * @example
 * ```ts
 * const result = await withBuffer(allocator, 32, (buffer) => {
 *   buffer.write(myData);
 *   return wasmFunction(buffer.getPointer());
 * });
 * ```
 */
export async function withBuffer<T>(
	allocator: WasmAllocator,
	size: number,
	fn: (buffer: ManagedBuffer) => Promise<T> | T,
): Promise<T> {
	const buffer = new ManagedBuffer(allocator, size);
	try {
		return await fn(buffer);
	} finally {
		buffer.free();
	}
}

/**
 * Execute function with multiple automatically managed WASM buffers
 *
 * @param allocator WASM allocator
 * @param sizes Array of buffer sizes
 * @param fn Function to execute with buffers
 * @returns Result from function
 */
export async function withBuffers<T>(
	allocator: WasmAllocator,
	sizes: number[],
	fn: (buffers: ManagedBuffer[]) => Promise<T> | T,
): Promise<T> {
	const buffers = sizes.map((size) => new ManagedBuffer(allocator, size));
	try {
		return await fn(buffers);
	} finally {
		for (const buffer of buffers) {
			buffer.free();
		}
	}
}

/**
 * Convert JavaScript string to null-terminated C string in WASM memory
 *
 * @param allocator WASM allocator
 * @param str JavaScript string
 * @returns Managed buffer containing null-terminated string
 */
export function stringToBuffer(
	allocator: WasmAllocator,
	str: string,
): ManagedBuffer {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(str);
	// Allocate size + 1 for null terminator
	const buffer = new ManagedBuffer(allocator, encoded.length + 1);
	const view = buffer.getView();
	view.set(encoded);
	view[encoded.length] = 0; // Null terminator
	return buffer;
}

/**
 * Read null-terminated C string from WASM memory
 *
 * @param memory WASM memory view
 * @param ptr Pointer to string in WASM memory
 * @param maxLength Maximum length to read (safety limit)
 * @returns JavaScript string
 */
export function readCString(
	memory: Uint8Array,
	ptr: number,
	maxLength = 1024,
): string {
	const view = new Uint8Array(memory.buffer, ptr, maxLength);
	let length = 0;
	while (length < maxLength && view[length] !== 0) {
		length++;
	}
	const decoder = new TextDecoder();
	return decoder.decode(new Uint8Array(memory.buffer, ptr, length));
}

/**
 * Copy bytes from JavaScript Uint8Array to WASM memory
 *
 * @param memory WASM memory view
 * @param ptr Pointer to destination in WASM memory
 * @param data Source data
 */
export function writeBytes(
	memory: Uint8Array,
	ptr: number,
	data: Uint8Array,
): void {
	const view = new Uint8Array(memory.buffer, ptr, data.length);
	view.set(data);
}

/**
 * Read bytes from WASM memory to JavaScript Uint8Array
 *
 * @param memory WASM memory view
 * @param ptr Pointer to source in WASM memory
 * @param length Number of bytes to read
 * @returns Copy of data
 */
export function readBytes(
	memory: Uint8Array,
	ptr: number,
	length: number,
): Uint8Array {
	const view = new Uint8Array(memory.buffer, ptr, length);
	return new Uint8Array(view);
}

/**
 * Fixed-size buffer for common Ethereum primitives
 */
export class FixedBuffer {
	private readonly data: Uint8Array;

	constructor(size: number, initialData?: Uint8Array) {
		this.data = new Uint8Array(size);
		if (initialData) {
			if (initialData.length !== size) {
				throw new Error(
					`Initial data length ${initialData.length} does not match buffer size ${size}`,
				);
			}
			this.data.set(initialData);
		}
	}

	/**
	 * Get underlying Uint8Array
	 */
	getBytes(): Uint8Array {
		return this.data;
	}

	/**
	 * Get buffer size
	 */
	getSize(): number {
		return this.data.length;
	}

	/**
	 * Write to WASM buffer
	 */
	writeTo(buffer: ManagedBuffer): void {
		buffer.write(this.data);
	}

	/**
	 * Create from WASM buffer
	 */
	static fromBuffer(buffer: ManagedBuffer): FixedBuffer {
		const data = buffer.read();
		return new FixedBuffer(data.length, data);
	}

	/**
	 * Create 20-byte buffer (Address)
	 */
	static address(data?: Uint8Array): FixedBuffer {
		return new FixedBuffer(20, data);
	}

	/**
	 * Create 32-byte buffer (Hash or U256)
	 */
	static hash32(data?: Uint8Array): FixedBuffer {
		return new FixedBuffer(32, data);
	}
}
