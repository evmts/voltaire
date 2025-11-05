/**
 * Minimal WASM Address implementation for bundle size testing
 */

let wasmInstance: WebAssembly.Instance | null = null;
let memory: WebAssembly.Memory | null = null;
let memoryOffset = 0;

async function init(): Promise<void> {
	if (wasmInstance) return;

	const wasmBytes = await fetch(
		new URL("../wasm/crypto/address.wasm", import.meta.url),
	).then((r) => r.arrayBuffer());

	memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const wasmModule = await WebAssembly.instantiate(wasmBytes, {
		env: { memory },
	});

	wasmInstance = wasmModule.instance;
}

function alloc(size: number): number {
	if (!memory) throw new Error("WASM not initialized");
	const ptr = memoryOffset;
	memoryOffset += size;
	if (memoryOffset > memory.buffer.byteLength) {
		throw new Error("Out of WASM memory");
	}
	return ptr;
}

export async function fromHex(hex: string): Promise<Uint8Array> {
	await init();

	const exports = wasmInstance!.exports as {
		addressFromHex: (
			hexPtr: number,
			hexLen: number,
			outputPtr: number,
		) => number;
		memory: WebAssembly.Memory;
	};

	const hexBytes = new TextEncoder().encode(hex);
	const hexPtr = alloc(hexBytes.length);
	const outputPtr = alloc(20);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(hexBytes, hexPtr);

	const result = exports.addressFromHex(hexPtr, hexBytes.length, outputPtr);
	if (result !== 0) {
		memoryOffset = 0;
		throw new Error("Invalid hex format");
	}

	const address = new Uint8Array(20);
	address.set(wasmMemory.subarray(outputPtr, outputPtr + 20));

	memoryOffset = 0;
	return address;
}

export async function toHex(address: Uint8Array): Promise<string> {
	await init();

	const exports = wasmInstance!.exports as {
		addressToHex: (addrPtr: number, outputPtr: number) => void;
		memory: WebAssembly.Memory;
	};

	const addrPtr = alloc(20);
	const outputPtr = alloc(42);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(address, addrPtr);

	exports.addressToHex(addrPtr, outputPtr);

	const hexBytes = wasmMemory.subarray(outputPtr, outputPtr + 42);
	const hex = new TextDecoder().decode(hexBytes);

	memoryOffset = 0;
	return hex;
}

export async function isValid(hex: string): Promise<boolean> {
	await init();

	const exports = wasmInstance!.exports as {
		addressIsValid: (hexPtr: number, hexLen: number) => number;
		memory: WebAssembly.Memory;
	};

	const hexBytes = new TextEncoder().encode(hex);
	const hexPtr = alloc(hexBytes.length);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(hexBytes, hexPtr);

	const result = exports.addressIsValid(hexPtr, hexBytes.length);

	memoryOffset = 0;
	return result === 1;
}

export async function equals(
	addr1: Uint8Array,
	addr2: Uint8Array,
): Promise<boolean> {
	await init();

	const exports = wasmInstance!.exports as {
		addressEquals: (addr1Ptr: number, addr2Ptr: number) => number;
		memory: WebAssembly.Memory;
	};

	const addr1Ptr = alloc(20);
	const addr2Ptr = alloc(20);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(addr1, addr1Ptr);
	wasmMemory.set(addr2, addr2Ptr);

	const result = exports.addressEquals(addr1Ptr, addr2Ptr);

	memoryOffset = 0;
	return result === 1;
}

export async function isZero(address: Uint8Array): Promise<boolean> {
	await init();

	const exports = wasmInstance!.exports as {
		addressIsZero: (addrPtr: number) => number;
		memory: WebAssembly.Memory;
	};

	const addrPtr = alloc(20);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(address, addrPtr);

	const result = exports.addressIsZero(addrPtr);

	memoryOffset = 0;
	return result === 1;
}

export const ZERO = new Uint8Array(20);
