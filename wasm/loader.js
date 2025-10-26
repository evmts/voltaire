/**
 * WebAssembly module loader for Ethereum primitives
 * Handles WASM instantiation, memory management, and exports wrapping
 */

let wasmInstance = null;
let wasmMemory = null;
let wasmExports = null;
let memoryOffset = 0; // Simple bump allocator

/**
 * Error codes from C API
 */
const ErrorCodes = {
  SUCCESS: 0,
  INVALID_HEX: -1,
  INVALID_LENGTH: -2,
  INVALID_CHECKSUM: -3,
  OUT_OF_MEMORY: -4,
  INVALID_INPUT: -5,
  INVALID_SIGNATURE: -6,
};

/**
 * Error messages for error codes
 */
const ErrorMessages = {
  [ErrorCodes.INVALID_HEX]: 'Invalid hex string',
  [ErrorCodes.INVALID_LENGTH]: 'Invalid length',
  [ErrorCodes.INVALID_CHECKSUM]: 'Invalid checksum',
  [ErrorCodes.OUT_OF_MEMORY]: 'Out of memory',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input',
  [ErrorCodes.INVALID_SIGNATURE]: 'Invalid signature',
};

/**
 * Load and instantiate the WASM module
 * @param {string|URL|ArrayBuffer} wasmPath - Path to WASM file or ArrayBuffer
 * @returns {Promise<void>}
 */
export async function loadWasm(wasmPath) {
  if (wasmInstance) {
    return; // Already loaded
  }

  // Create linear memory for WASM
  wasmMemory = new WebAssembly.Memory({
    initial: 256, // 256 pages = 16MB
    maximum: 512, // 512 pages = 32MB
  });

  const importObject = {
    env: {
      memory: wasmMemory,
    },
  };

  let wasmModule;
  if (wasmPath instanceof ArrayBuffer) {
    wasmModule = await WebAssembly.instantiate(wasmPath, importObject);
    wasmInstance = wasmModule.instance;
  } else {
    const response = await fetch(wasmPath);
    const buffer = await response.arrayBuffer();
    wasmModule = await WebAssembly.instantiate(buffer, importObject);
    wasmInstance = wasmModule.instance;
  }

  wasmExports = wasmInstance.exports;

  // Initialize memory offset after WASM's own data
  // Start at 64KB to leave room for WASM's stack and globals
  memoryOffset = 65536;
}

/**
 * Get the WASM exports (for direct access if needed)
 * @returns {Object} WASM exports
 */
export function getExports() {
  if (!wasmExports) {
    throw new Error('WASM module not loaded. Call loadWasm() first.');
  }
  return wasmExports;
}

/**
 * Allocate memory in WASM linear memory (simple bump allocator)
 * @param {number} size - Number of bytes to allocate
 * @returns {number} Pointer to allocated memory
 */
function malloc(size) {
  // Align to 8 bytes
  const aligned = (size + 7) & ~7;
  const ptr = memoryOffset;
  memoryOffset += aligned;

  // Grow memory if needed
  const pagesNeeded = Math.ceil(memoryOffset / 65536);
  const currentPages = wasmMemory.buffer.byteLength / 65536;

  if (pagesNeeded > currentPages) {
    wasmMemory.grow(pagesNeeded - currentPages);
  }

  return ptr;
}

/**
 * Reset memory allocator (call after operations to free memory)
 */
function resetMemory() {
  memoryOffset = 65536;
}

/**
 * Write bytes to WASM memory
 * @param {Uint8Array} data - Data to write
 * @param {number} ptr - Pointer to write to
 */
function writeBytes(data, ptr) {
  const memory = new Uint8Array(wasmMemory.buffer);
  memory.set(data, ptr);
}

/**
 * Read bytes from WASM memory
 * @param {number} ptr - Pointer to read from
 * @param {number} length - Number of bytes to read
 * @returns {Uint8Array} Data read from memory
 */
function readBytes(ptr, length) {
  const memory = new Uint8Array(wasmMemory.buffer);
  return memory.slice(ptr, ptr + length);
}

/**
 * Write null-terminated string to WASM memory
 * @param {string} str - String to write
 * @returns {number} Pointer to string in WASM memory
 */
function writeString(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str + '\0'); // Null-terminated
  const ptr = malloc(bytes.length);
  writeBytes(bytes, ptr);
  return ptr;
}

/**
 * Read null-terminated string from WASM memory
 * @param {number} ptr - Pointer to string
 * @returns {string} String read from memory
 */
function readString(ptr) {
  const memory = new Uint8Array(wasmMemory.buffer);
  let length = 0;
  while (memory[ptr + length] !== 0) {
    length++;
  }
  const decoder = new TextDecoder();
  return decoder.decode(memory.slice(ptr, ptr + length));
}

/**
 * Check result code and throw error if not success
 * @param {number} code - Result code
 * @throws {Error} If code is not SUCCESS
 */
function checkResult(code) {
  if (code !== ErrorCodes.SUCCESS) {
    const message = ErrorMessages[code] || `Unknown error (code: ${code})`;
    throw new Error(message);
  }
}

// ============================================================================
// Address API
// ============================================================================

/**
 * Create address from hex string
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} 20-byte address
 */
export function addressFromHex(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    const outPtr = malloc(20);

    const result = wasmExports.primitives_address_from_hex(hexPtr, outPtr);
    checkResult(result);
    return readBytes(outPtr, 20);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Convert address to hex string
 * @param {Uint8Array} address - 20-byte address
 * @returns {string} Hex string with 0x prefix
 */
export function addressToHex(address) {
  const savedOffset = memoryOffset;
  try {
    const addrPtr = malloc(20);
    const outPtr = malloc(42);

    writeBytes(address, addrPtr);
    const result = wasmExports.primitives_address_to_hex(addrPtr, outPtr);
    checkResult(result);
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Convert address to checksummed hex (EIP-55)
 * @param {Uint8Array} address - 20-byte address
 * @returns {string} Checksummed hex string
 */
export function addressToChecksumHex(address) {
  const savedOffset = memoryOffset;
  try {
    const addrPtr = malloc(20);
    const outPtr = malloc(42);

    writeBytes(address, addrPtr);
    const result = wasmExports.primitives_address_to_checksum_hex(addrPtr, outPtr);
    checkResult(result);
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Check if address is zero address
 * @param {Uint8Array} address - 20-byte address
 * @returns {boolean} True if zero address
 */
export function addressIsZero(address) {
  const savedOffset = memoryOffset;
  try {
    const addrPtr = malloc(20);
    writeBytes(address, addrPtr);
    return wasmExports.primitives_address_is_zero(addrPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compare two addresses for equality
 * @param {Uint8Array} a - First address
 * @param {Uint8Array} b - Second address
 * @returns {boolean} True if equal
 */
export function addressEquals(a, b) {
  const savedOffset = memoryOffset;
  try {
    const aPtr = malloc(20);
    const bPtr = malloc(20);

    writeBytes(a, aPtr);
    writeBytes(b, bPtr);
    return wasmExports.primitives_address_equals(aPtr, bPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Validate EIP-55 checksum
 * @param {string} hex - Hex string to validate
 * @returns {boolean} True if checksum is valid
 */
export function addressValidateChecksum(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    return wasmExports.primitives_address_validate_checksum(hexPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Calculate CREATE contract address
 * @param {Uint8Array} sender - Sender address (20 bytes)
 * @param {number} nonce - Nonce
 * @returns {Uint8Array} Contract address (20 bytes)
 */
export function calculateCreateAddress(sender, nonce) {
  const savedOffset = memoryOffset;
  try {
    const senderPtr = malloc(20);
    const outPtr = malloc(20);

    writeBytes(sender, senderPtr);
    const result = wasmExports.primitives_calculate_create_address(senderPtr, nonce, outPtr);
    checkResult(result);
    return readBytes(outPtr, 20);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Calculate CREATE2 contract address
 * @param {Uint8Array} sender - Sender address (20 bytes)
 * @param {Uint8Array} salt - Salt (32 bytes)
 * @param {Uint8Array} initCode - Init code
 * @returns {Uint8Array} Contract address (20 bytes)
 */
export function calculateCreate2Address(sender, salt, initCode) {
  const savedOffset = memoryOffset;
  try {
    const senderPtr = malloc(20);
    const saltPtr = malloc(32);
    const codePtr = malloc(initCode.length);
    const outPtr = malloc(20);

    writeBytes(sender, senderPtr);
    writeBytes(salt, saltPtr);
    writeBytes(initCode, codePtr);
    const result = wasmExports.primitives_calculate_create2_address(
      senderPtr,
      saltPtr,
      codePtr,
      initCode.length,
      outPtr
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
 * @param {Uint8Array} data - Input data
 * @returns {Uint8Array} 32-byte hash
 */
export function keccak256(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(32);

    writeBytes(data, dataPtr);
    const result = wasmExports.primitives_keccak256(dataPtr, data.length, outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Convert hash to hex string
 * @param {Uint8Array} hash - 32-byte hash
 * @returns {string} Hex string with 0x prefix
 */
export function hashToHex(hash) {
  const savedOffset = memoryOffset;
  try {
    const hashPtr = malloc(32);
    const outPtr = malloc(66);

    writeBytes(hash, hashPtr);
    const result = wasmExports.primitives_hash_to_hex(hashPtr, outPtr);
    checkResult(result);
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Create hash from hex string
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} 32-byte hash
 */
export function hashFromHex(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    const outPtr = malloc(32);

    const result = wasmExports.primitives_hash_from_hex(hexPtr, outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compare two hashes for equality (constant-time)
 * @param {Uint8Array} a - First hash
 * @param {Uint8Array} b - Second hash
 * @returns {boolean} True if equal
 */
export function hashEquals(a, b) {
  const savedOffset = memoryOffset;
  try {
    const aPtr = malloc(32);
    const bPtr = malloc(32);

    writeBytes(a, aPtr);
    writeBytes(b, bPtr);
    return wasmExports.primitives_hash_equals(aPtr, bPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Hash message using EIP-191 format
 * @param {Uint8Array} message - Message to hash
 * @returns {Uint8Array} 32-byte hash
 */
export function eip191HashMessage(message) {
  const savedOffset = memoryOffset;
  try {
    const msgPtr = malloc(message.length);
    const outPtr = malloc(32);

    writeBytes(message, msgPtr);
    const result = wasmExports.primitives_eip191_hash_message(msgPtr, message.length, outPtr);
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
 * @param {Uint8Array} data - Data to encode
 * @returns {Uint8Array} RLP-encoded data
 */
export function rlpEncodeBytes(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(data.length + 10); // RLP adds small overhead

    writeBytes(data, dataPtr);
    const resultLen = wasmExports.primitives_rlp_encode_bytes(
      dataPtr,
      data.length,
      outPtr,
      data.length + 10
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
 * @param {Uint8Array} value - 32-byte big-endian u256
 * @returns {Uint8Array} RLP-encoded data
 */
export function rlpEncodeUint(value) {
  const savedOffset = memoryOffset;
  try {
    const valuePtr = malloc(32);
    const outPtr = malloc(40); // u256 RLP max size

    writeBytes(value, valuePtr);
    const resultLen = wasmExports.primitives_rlp_encode_uint(valuePtr, outPtr, 40);
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
 * @param {Uint8Array} rlpData - RLP-encoded data
 * @returns {string} Hex string with 0x prefix
 */
export function rlpToHex(rlpData) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(rlpData.length);
    const outPtr = malloc(rlpData.length * 2 + 2);

    writeBytes(rlpData, dataPtr);
    const resultLen = wasmExports.primitives_rlp_to_hex(
      dataPtr,
      rlpData.length,
      outPtr,
      rlpData.length * 2 + 2
    );
    if (resultLen < 0) {
      checkResult(resultLen);
    }
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Convert hex string to RLP bytes
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} RLP bytes
 */
export function rlpFromHex(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    const outPtr = malloc(hex.length); // Worst case: all hex chars

    const resultLen = wasmExports.primitives_rlp_from_hex(hexPtr, outPtr, hex.length);
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
 * @param {Uint8Array} code - EVM bytecode
 * @returns {number[]} Array of JUMPDEST positions
 */
export function bytecodeAnalyzeJumpdests(code) {
  const savedOffset = memoryOffset;
  try {
    const codePtr = malloc(code.length);
    const outPtr = malloc(code.length * 4); // u32 per potential JUMPDEST

    writeBytes(code, codePtr);
    const count = wasmExports.primitives_bytecode_analyze_jumpdests(
      codePtr,
      code.length,
      outPtr,
      code.length
    );
    if (count < 0) {
      checkResult(count);
    }

    // Read u32 array
    const memory = new Uint32Array(wasmMemory.buffer);
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(memory[(outPtr / 4) + i]);
    }
    return results;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Check if position is at bytecode boundary
 * @param {Uint8Array} code - EVM bytecode
 * @param {number} position - Position to check
 * @returns {boolean} True if at boundary
 */
export function bytecodeIsBoundary(code, position) {
  const savedOffset = memoryOffset;
  try {
    const codePtr = malloc(code.length);
    writeBytes(code, codePtr);
    return wasmExports.primitives_bytecode_is_boundary(codePtr, code.length, position) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Check if position is a valid JUMPDEST
 * @param {Uint8Array} code - EVM bytecode
 * @param {number} position - Position to check
 * @returns {boolean} True if valid JUMPDEST
 */
export function bytecodeIsValidJumpdest(code, position) {
  const savedOffset = memoryOffset;
  try {
    const codePtr = malloc(code.length);
    writeBytes(code, codePtr);
    return wasmExports.primitives_bytecode_is_valid_jumpdest(codePtr, code.length, position) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Validate bytecode for basic correctness
 * @param {Uint8Array} code - EVM bytecode
 * @throws {Error} If bytecode is invalid
 */
export function bytecodeValidate(code) {
  const savedOffset = memoryOffset;
  try {
    const codePtr = malloc(code.length);
    writeBytes(code, codePtr);
    const result = wasmExports.primitives_bytecode_validate(codePtr, code.length);
    checkResult(result);
  } finally {
    memoryOffset = savedOffset;
  }
}
