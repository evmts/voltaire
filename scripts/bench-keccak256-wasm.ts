/**
 * Minimal WASM Keccak256 implementation for bundle size testing
 */

let wasmInstance: WebAssembly.Instance | null = null;
let memory: WebAssembly.Memory | null = null;
let memoryOffset = 0;

async function init(): Promise<void> {
	if (wasmInstance) return;

	// Load the 3KB standalone WASM module
	const wasmBytes = await fetch(
		new URL("../wasm/crypto/keccak256.wasm", import.meta.url),
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

export async function hash(data: Uint8Array): Promise<Uint8Array> {
	await init();

	const exports = wasmInstance?.exports as {
		keccak256Hash: (
			inputPtr: number,
			inputLen: number,
			outputPtr: number,
		) => void;
		memory: WebAssembly.Memory;
	};

	const inputPtr = alloc(data.length);
	const outputPtr = alloc(32);

	const wasmMemory = new Uint8Array(exports.memory.buffer);
	wasmMemory.set(data, inputPtr);

	exports.keccak256Hash(inputPtr, data.length, outputPtr);

	const result = new Uint8Array(32);
	result.set(wasmMemory.subarray(outputPtr, outputPtr + 32));

	memoryOffset = 0;
	return result;
}

export async function hashString(str: string): Promise<Uint8Array> {
	const bytes = new TextEncoder().encode(str);
	return hash(bytes);
}

export async function hashHex(hex: string): Promise<Uint8Array> {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	}
	return hash(bytes);
}
