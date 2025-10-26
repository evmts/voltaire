/**
 * WebAssembly module loader for Ethereum primitives
 * Handles WASM instantiation, memory management, and exports wrapping
 */

/** @type {WebAssembly.Instance | null} */
let wasmInstance = null;
/** @type {WebAssembly.Memory | null} */
let wasmMemory = null;
/** @type {Record<string, Function> | null} */
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

  // Minimal WASI shim for wasm32-wasi modules
  const wasi = {
    // args
    args_get: (argv, argv_buf) => 0,
    args_sizes_get: (argc_ptr, argv_buf_size_ptr) => {
      const mem = new DataView(wasmMemory.buffer);
      mem.setUint32(argc_ptr, 0, true);
      mem.setUint32(argv_buf_size_ptr, 0, true);
      return 0;
    },
    // environment
    environ_get: (environ, environ_buf) => 0,
    environ_sizes_get: (environ_count_ptr, environ_buf_size_ptr) => {
      const mem = new DataView(wasmMemory.buffer);
      mem.setUint32(environ_count_ptr, 0, true);
      mem.setUint32(environ_buf_size_ptr, 0, true);
      return 0;
    },
    // fds
    fd_write: (fd, iovs, iovs_len, nwritten) => {
      try {
        const memU32 = new Uint32Array(wasmMemory.buffer);
        let bytes = 0;
        for (let i = 0; i < iovs_len; i++) {
          const ptr = memU32[(iovs >> 2) + i * 2];
          const len = memU32[(iovs >> 2) + i * 2 + 1];
          bytes += len;
        }
        const mem = new DataView(wasmMemory.buffer);
        mem.setUint32(nwritten, bytes, true);
        return 0;
      } catch {
        return 0;
      }
    },
    fd_fdstat_get: () => 0,
    fd_filestat_get: () => 0,
    fd_seek: () => 0,
    fd_close: () => 0,
    fd_read: (fd, iovs, iovs_len, nread) => {
      const mem = new DataView(wasmMemory.buffer);
      mem.setUint32(nread, 0, true);
      return 0;
    },
    // time
    clock_time_get: () => 0,
    // random
    random_get: (buf, len) => {
      const view = new Uint8Array(wasmMemory.buffer, buf, len);
      for (let i = 0; i < view.length; i++) view[i] = 0;
      return 0;
    },
    // process
    proc_exit: (code) => { throw new Error(`WASI proc_exit(${code})`); },
    sched_yield: () => 0,
    poll_oneoff: () => 0,
    // path/stat
    path_filestat_get: () => 0,
    path_open: () => 0,
    path_readlink: () => 0,
    fd_prestat_get: () => 0,
    fd_prestat_dir_name: () => 0,
    fd_datasync: () => 0,
    fd_sync: () => 0,
  };

  const importObject = {
    env: {
      memory: wasmMemory,
    },
    wasi_snapshot_preview1: wasi,
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
 * @returns {void}
 */
export function resetMemory() {
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
// Hash Algorithms API
// ============================================================================

/**
 * Compute SHA-256 hash
 * @param {Uint8Array} data - Input data
 * @returns {Uint8Array} 32-byte hash
 */
export function sha256(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(32);

    writeBytes(data, dataPtr);
    const result = wasmExports.primitives_sha256(dataPtr, data.length, outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compute RIPEMD-160 hash
 * @param {Uint8Array} data - Input data
 * @returns {Uint8Array} 20-byte hash
 */
export function ripemd160(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(20);

    writeBytes(data, dataPtr);
    const result = wasmExports.primitives_ripemd160(dataPtr, data.length, outPtr);
    checkResult(result);
    return readBytes(outPtr, 20);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compute BLAKE2b hash
 * @param {Uint8Array} data - Input data
 * @returns {Uint8Array} 64-byte hash
 */
export function blake2b(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(64);

    writeBytes(data, dataPtr);
    const result = wasmExports.primitives_blake2b(dataPtr, data.length, outPtr);
    checkResult(result);
    return readBytes(outPtr, 64);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compute Solidity-style Keccak-256 hash of tightly packed data
 * @param {Uint8Array} packedData - Pre-packed data bytes
 * @returns {Uint8Array} 32-byte hash
 */
export function solidityKeccak256(packedData) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(packedData.length);
    const outPtr = malloc(32);

    writeBytes(packedData, dataPtr);
    const result = wasmExports.primitives_solidity_keccak256(dataPtr, packedData.length, outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compute Solidity-style SHA-256 hash of tightly packed data
 * @param {Uint8Array} packedData - Pre-packed data bytes
 * @returns {Uint8Array} 32-byte hash
 */
export function soliditySha256(packedData) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(packedData.length);
    const outPtr = malloc(32);

    writeBytes(packedData, dataPtr);
    const result = wasmExports.primitives_solidity_sha256(dataPtr, packedData.length, outPtr);
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
    /** @type {number[]} */
    const results = [];
    for (let i = 0; i < count; i++) {
      const value = memory[(outPtr / 4) + i];
      if (value !== undefined) {
        results.push(value);
      }
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

// ============================================================================
// U256 API
// ============================================================================

/**
 * Convert hex string to U256 (32-byte big-endian)
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} 32-byte U256 value
 */
export function u256FromHex(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    const outPtr = malloc(32);

    const result = wasmExports.primitives_u256_from_hex(hexPtr, outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Convert U256 to hex string
 * @param {Uint8Array} value - 32-byte U256 value (big-endian)
 * @returns {string} Hex string with 0x prefix (66 chars)
 */
export function u256ToHex(value) {
  const savedOffset = memoryOffset;
  try {
    const valuePtr = malloc(32);
    const outPtr = malloc(66);

    writeBytes(value, valuePtr);
    const result = wasmExports.primitives_u256_to_hex(valuePtr, outPtr, 66);
    checkResult(result);
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

// ============================================================================
// Hex API
// ============================================================================

/**
 * Convert hex string to bytes
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {Uint8Array} Raw bytes
 */
export function hexToBytes(hex) {
  const savedOffset = memoryOffset;
  try {
    const hexPtr = writeString(hex);
    const outPtr = malloc(hex.length); // Worst case: all hex chars become bytes

    const resultLen = wasmExports.primitives_hex_to_bytes(hexPtr, outPtr, hex.length);
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
 * @param {Uint8Array} data - Raw bytes
 * @returns {string} Hex string with 0x prefix
 */
export function bytesToHex(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    const outPtr = malloc(data.length * 2 + 3); // "0x" + 2 chars per byte + null terminator

    writeBytes(data, dataPtr);
    const resultLen = wasmExports.primitives_bytes_to_hex(
      dataPtr,
      data.length,
      outPtr,
      data.length * 2 + 3
    );
    if (resultLen < 0) {
      checkResult(resultLen);
    }
    return readString(outPtr);
  } finally {
    memoryOffset = savedOffset;
  }
}

// ============================================================================
// Transaction API
// ============================================================================

/**
 * Detect transaction type from serialized data
 * @param {Uint8Array} data - RLP-encoded transaction data
 * @returns {number} Transaction type (0=Legacy, 1=EIP2930, 2=EIP1559, 3=EIP4844, 4=EIP7702)
 */
export function txDetectType(data) {
  const savedOffset = memoryOffset;
  try {
    const dataPtr = malloc(data.length);
    writeBytes(data, dataPtr);
    const txType = wasmExports.primitives_tx_detect_type(dataPtr, data.length);
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
 * @returns {Uint8Array} 32-byte private key
 */
export function generatePrivateKey() {
  const savedOffset = memoryOffset;
  try {
    const outPtr = malloc(32);
    const result = wasmExports.primitives_generate_private_key(outPtr);
    checkResult(result);
    return readBytes(outPtr, 32);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Compress uncompressed secp256k1 public key
 * @param {Uint8Array} uncompressed - 64-byte uncompressed public key (x, y coordinates)
 * @returns {Uint8Array} 33-byte compressed public key (0x02/0x03 prefix + x coordinate)
 */
export function compressPublicKey(uncompressed) {
  if (uncompressed.length !== 64) {
    throw new Error('Uncompressed public key must be 64 bytes');
  }

  const savedOffset = memoryOffset;
  try {
    const uncompressedPtr = malloc(64);
    const outPtr = malloc(33);

    writeBytes(uncompressed, uncompressedPtr);
    const result = wasmExports.primitives_compress_public_key(uncompressedPtr, outPtr);
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
 * Recover public key from ECDSA signature
 * @param {Uint8Array} messageHash - 32-byte message hash
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @param {number} v - Recovery parameter (0-3)
 * @returns {Uint8Array} Uncompressed public key (64 bytes)
 */
export function secp256k1RecoverPubkey(messageHash, r, s, v) {
  const savedOffset = memoryOffset;
  try {
    const hashPtr = malloc(32);
    const rPtr = malloc(32);
    const sPtr = malloc(32);
    const outPtr = malloc(64);

    writeBytes(messageHash, hashPtr);
    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    const result = wasmExports.primitives_secp256k1_recover_pubkey(
      hashPtr,
      rPtr,
      sPtr,
      v,
      outPtr
    );
    checkResult(result);
    return readBytes(outPtr, 64);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Recover Ethereum address from ECDSA signature
 * @param {Uint8Array} messageHash - 32-byte message hash
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @param {number} v - Recovery parameter (0-3)
 * @returns {Uint8Array} Ethereum address (20 bytes)
 */
export function secp256k1RecoverAddress(messageHash, r, s, v) {
  const savedOffset = memoryOffset;
  try {
    const hashPtr = malloc(32);
    const rPtr = malloc(32);
    const sPtr = malloc(32);
    const outPtr = malloc(20);

    writeBytes(messageHash, hashPtr);
    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    const result = wasmExports.primitives_secp256k1_recover_address(
      hashPtr,
      rPtr,
      sPtr,
      v,
      outPtr
    );
    checkResult(result);
    return readBytes(outPtr, 20);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Derive public key from private key
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {Uint8Array} Uncompressed public key (64 bytes)
 */
export function secp256k1PubkeyFromPrivate(privateKey) {
  const savedOffset = memoryOffset;
  try {
    const keyPtr = malloc(32);
    const outPtr = malloc(64);

    writeBytes(privateKey, keyPtr);

    const result = wasmExports.primitives_secp256k1_pubkey_from_private(keyPtr, outPtr);
    checkResult(result);
    return readBytes(outPtr, 64);
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Validate ECDSA signature components
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @returns {boolean} True if signature is valid
 */
export function secp256k1ValidateSignature(r, s) {
  const savedOffset = memoryOffset;
  try {
    const rPtr = malloc(32);
    const sPtr = malloc(32);

    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    return wasmExports.primitives_secp256k1_validate_signature(rPtr, sPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Normalize signature to canonical form (low-s)
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @returns {[Uint8Array, Uint8Array]} Normalized [r, s] components
 */
export function signatureNormalize(r, s) {
  const savedOffset = memoryOffset;
  try {
    const rPtr = malloc(32);
    const sPtr = malloc(32);

    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    // This modifies s in-place if needed
    wasmExports.primitives_signature_normalize(rPtr, sPtr);

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
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @returns {boolean} True if signature is canonical
 */
export function signatureIsCanonical(r, s) {
  const savedOffset = memoryOffset;
  try {
    const rPtr = malloc(32);
    const sPtr = malloc(32);

    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    return wasmExports.primitives_signature_is_canonical(rPtr, sPtr) !== 0;
  } finally {
    memoryOffset = savedOffset;
  }
}

/**
 * Parse signature from compact format
 * @param {Uint8Array} sigData - Signature bytes (64 or 65 bytes)
 * @returns {[Uint8Array, Uint8Array, Uint8Array]} [r, s, v] components
 */
export function signatureParse(sigData) {
  const savedOffset = memoryOffset;
  try {
    const sigPtr = malloc(sigData.length);
    const rPtr = malloc(32);
    const sPtr = malloc(32);
    const vPtr = malloc(1);

    writeBytes(sigData, sigPtr);

    const result = wasmExports.primitives_signature_parse(
      sigPtr,
      sigData.length,
      rPtr,
      sPtr,
      vPtr
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
 * @param {Uint8Array} r - R component (32 bytes)
 * @param {Uint8Array} s - S component (32 bytes)
 * @param {number} v - Recovery parameter
 * @param {boolean} includeV - Whether to include v byte
 * @returns {Uint8Array} Serialized signature
 */
export function signatureSerialize(r, s, v, includeV) {
  const savedOffset = memoryOffset;
  try {
    const rPtr = malloc(32);
    const sPtr = malloc(32);
    const outPtr = malloc(65);

    writeBytes(r, rPtr);
    writeBytes(s, sPtr);

    const resultLen = wasmExports.primitives_signature_serialize(
      rPtr,
      sPtr,
      v,
      includeV ? 1 : 0,
      outPtr
    );

    return readBytes(outPtr, resultLen);
  } finally {
    memoryOffset = savedOffset;
  }
}
