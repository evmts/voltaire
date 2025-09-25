import { dlopen, FFIType, suffix, ptr, CString, read } from "bun:ffi";
import { join } from "path";

// Library path - assumes shared library is built in zig-out/lib
const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);

// FFI type definitions matching the C ABI
const EvmResultType = {
  success: FFIType.bool,
  gas_left: FFIType.u64,
  output: FFIType.ptr,
  output_len: FFIType.usize,
  error_message: FFIType.cstring,
} as const;

const CallParamsType = {
  caller: FFIType.ptr, // [20]u8
  to: FFIType.ptr,     // [20]u8
  value: FFIType.ptr,  // [32]u8
  input: FFIType.ptr,
  input_len: FFIType.usize,
  gas: FFIType.u64,
  call_type: FFIType.u8,
  salt: FFIType.ptr,   // [32]u8
} as const;

const BlockInfoFFIType = {
  number: FFIType.u64,
  timestamp: FFIType.u64,
  gas_limit: FFIType.u64,
  coinbase: FFIType.ptr,    // [20]u8
  base_fee: FFIType.u64,
  chain_id: FFIType.u64,
  difficulty: FFIType.u64,
  prev_randao: FFIType.ptr, // [32]u8
} as const;

// Load the shared library
const lib = dlopen(libPath, {
  guillotine_init: {
    args: [],
    returns: FFIType.void,
  },
  guillotine_cleanup: {
    args: [],
    returns: FFIType.void,
  },
  guillotine_evm_create: {
    args: [FFIType.ptr], // BlockInfoFFI*
    returns: FFIType.ptr, // EvmHandle*
  },
  guillotine_evm_destroy: {
    args: [FFIType.ptr], // EvmHandle*
    returns: FFIType.void,
  },
  guillotine_set_balance: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], // EvmHandle*, [20]u8*, [32]u8*
    returns: FFIType.bool,
  },
  guillotine_set_code: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize], // EvmHandle*, [20]u8*, u8*, usize
    returns: FFIType.bool,
  },
  guillotine_call: {
    args: [FFIType.ptr, FFIType.ptr], // EvmHandle*, CallParams*
    returns: FFIType.ptr, // Returns pointer to EvmResult
  },
  guillotine_simulate: {
    args: [FFIType.ptr, FFIType.ptr], // EvmHandle*, CallParams*
    returns: FFIType.ptr, // Returns pointer to EvmResult
  },
  guillotine_free_output: {
    args: [FFIType.ptr, FFIType.usize], // u8*, usize
    returns: FFIType.void,
  },
  guillotine_free_result: {
    args: [FFIType.ptr], // EvmResult*
    returns: FFIType.void,
  },
  guillotine_get_last_error: {
    args: [],
    returns: FFIType.cstring,
  },
});

// Initialize the FFI
lib.symbols.guillotine_init();

// Cleanup on process exit
process.on("exit", () => {
  lib.symbols.guillotine_cleanup();
});

// Helper functions
function addressToBytes(address: string): Uint8Array {
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }
  if (address.length !== 40) {
    throw new Error("Invalid address length");
  }
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(address.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function u256ToBytes(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let temp = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(temp & 0xffn);
    temp = temp >> 8n;
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Type definitions
export enum CallType {
  CALL = 0,
  DELEGATECALL = 1,
  STATICCALL = 2,
  CREATE = 3,
  CREATE2 = 4,
}

export interface BlockInfo {
  number: bigint;
  timestamp: bigint;
  gasLimit: bigint;
  coinbase: string;
  baseFee: bigint;
  chainId: bigint;
  difficulty?: bigint;
  prevRandao?: Uint8Array;
}

export interface CallParams {
  caller: string;
  to: string;
  value: bigint;
  input: Uint8Array;
  gas: bigint;
  callType: CallType;
  salt?: bigint; // For CREATE2
}

export interface EvmResult {
  success: boolean;
  gasLeft: bigint;
  output: Uint8Array;
  error?: string;
}

export class GuillotineEVM {
  private handle: any;
  private blockInfoBuffer: ArrayBuffer;
  private blockInfoView: DataView;

  constructor(blockInfo: BlockInfo) {
    // Create block info structure matching BlockInfoFFI in evm_c_api.zig
    // Total size: 104 bytes (with padding for alignment)
    // Actual offsets (from Zig @offsetOf):
    // number: 0, timestamp: 8, gas_limit: 16, coinbase: 24,
    // base_fee: 48, chain_id: 56, difficulty: 64, prev_randao: 72
    this.blockInfoBuffer = new ArrayBuffer(104);
    this.blockInfoView = new DataView(this.blockInfoBuffer);
    
    // Initialize buffer to zeros
    new Uint8Array(this.blockInfoBuffer).fill(0);
    
    // Set block info fields with correct offsets
    this.blockInfoView.setBigUint64(0, blockInfo.number, true);
    this.blockInfoView.setBigUint64(8, blockInfo.timestamp, true);
    this.blockInfoView.setBigUint64(16, blockInfo.gasLimit, true);
    
    // Set coinbase address (20 bytes at offset 24)
    const coinbaseBytes = addressToBytes(blockInfo.coinbase);
    new Uint8Array(this.blockInfoBuffer, 24, 20).set(coinbaseBytes);
    
    // Note: 4 bytes of padding after coinbase (44-47)
    this.blockInfoView.setBigUint64(48, blockInfo.baseFee, true);
    this.blockInfoView.setBigUint64(56, blockInfo.chainId, true);
    this.blockInfoView.setBigUint64(64, blockInfo.difficulty || 0n, true);
    
    // Set prevRandao (32 bytes at offset 72)
    const prevRandao = blockInfo.prevRandao || new Uint8Array(32);
    new Uint8Array(this.blockInfoBuffer, 72, 32).set(prevRandao);
    
    // Initialize the FFI library if not already done
    lib.symbols.guillotine_init();
    
    // Create EVM instance
    this.handle = lib.symbols.guillotine_evm_create(ptr(this.blockInfoBuffer));
    if (!this.handle) {
      const error = lib.symbols.guillotine_get_last_error();
      throw new Error(`Failed to create EVM: ${error}`);
    }
  }

  destroy() {
    if (this.handle) {
      lib.symbols.guillotine_evm_destroy(this.handle);
      this.handle = null;
    }
  }

  setBalance(address: string, balance: bigint): void {
    const addrBytes = addressToBytes(address);
    const balanceBytes = u256ToBytes(balance);
    
    const success = lib.symbols.guillotine_set_balance(
      this.handle,
      ptr(addrBytes),
      ptr(balanceBytes)
    );
    
    if (!success) {
      const error = lib.symbols.guillotine_get_last_error();
      throw new Error(`Failed to set balance: ${error}`);
    }
  }

  setCode(address: string, code: Uint8Array): void {
    const addrBytes = addressToBytes(address);
    
    const success = lib.symbols.guillotine_set_code(
      this.handle,
      ptr(addrBytes),
      ptr(code),
      code.length
    );
    
    if (!success) {
      const error = lib.symbols.guillotine_get_last_error();
      throw new Error(`Failed to set code: ${error}`);
    }
  }

  call(params: CallParams): EvmResult {
    // Create call params structure
    const paramsBuffer = new ArrayBuffer(104); // Size of CallParams struct
    const paramsView = new DataView(paramsBuffer);
    
    // Set caller (20 bytes at offset 0)
    const callerBytes = addressToBytes(params.caller);
    new Uint8Array(paramsBuffer, 0, 20).set(callerBytes);
    
    // Set to (20 bytes at offset 20)
    const toBytes = addressToBytes(params.to);
    new Uint8Array(paramsBuffer, 20, 20).set(toBytes);
    
    // Set value (32 bytes at offset 40)
    const valueBytes = u256ToBytes(params.value);
    new Uint8Array(paramsBuffer, 40, 32).set(valueBytes);
    
    // Set input pointer and length (at offset 72)
    // For simplicity, we'll need to handle this differently
    // We'll create a modified structure
    const inputPtr = params.input.length > 0 ? ptr(params.input) : 0;
    paramsView.setBigUint64(72, BigInt(inputPtr), true);
    paramsView.setBigUint64(80, BigInt(params.input.length), true);
    
    // Set gas (at offset 88)
    paramsView.setBigUint64(88, params.gas, true);
    
    // Set call type (at offset 96)
    paramsView.setUint8(96, params.callType);
    
    // Set salt for CREATE2 (32 bytes at offset 97, padded)
    if (params.salt !== undefined) {
      const saltBytes = u256ToBytes(params.salt);
      // Note: This is a simplified layout, actual struct might differ
    }
    
    // Call the EVM
    const resultPtr = lib.symbols.guillotine_call(this.handle, ptr(paramsBuffer));
    if (!resultPtr) {
      const error = lib.symbols.guillotine_get_last_error();
      throw new Error(`Call failed: ${error}`);
    }
    
    // Read result structure using Bun's read API
    // EvmResult layout:
    // - success: bool (1 byte, aligned to 8)
    // - gas_left: u64 (8 bytes)
    // - output: [*]const u8 (8 bytes pointer)
    // - output_len: usize (8 bytes)
    // - error_message: [*:0]const u8 (8 bytes pointer)
    const success = read.u8(resultPtr, 0) !== 0;
    const gasLeft = read.u64(resultPtr, 8);
    const outputPtr = read.ptr(resultPtr, 16);
    const outputLen = Number(read.u64(resultPtr, 24));
    
    // Copy output data
    let output = new Uint8Array(0);
    if (outputLen > 0 && outputPtr) {
      output = new Uint8Array(outputLen);
      // Read bytes from the output pointer
      for (let i = 0; i < outputLen; i++) {
        output[i] = read.u8(outputPtr, i);
      }
    }
    
    // Get error message if failed
    let error: string | undefined;
    if (!success) {
      const errorPtr = read.ptr(resultPtr, 32);
      if (errorPtr) {
        error = new CString(errorPtr).toString();
      }
    }
    
    // Free the result structure (which also frees the output buffer)
    lib.symbols.guillotine_free_result(resultPtr);
    
    return {
      success,
      gasLeft,
      output,
      error,
    };
  }

  simulate(params: CallParams): EvmResult {
    // Create call params structure
    const paramsBuffer = new ArrayBuffer(104);
    const paramsView = new DataView(paramsBuffer);
    
    // Set caller (20 bytes at offset 0)
    const callerBytes = addressToBytes(params.caller);
    new Uint8Array(paramsBuffer, 0, 20).set(callerBytes);
    
    // Set to (20 bytes at offset 20)
    const toBytes = addressToBytes(params.to);
    new Uint8Array(paramsBuffer, 20, 20).set(toBytes);
    
    // Set value (32 bytes at offset 40)
    const valueBytes = u256ToBytes(params.value);
    new Uint8Array(paramsBuffer, 40, 32).set(valueBytes);
    
    // Set input pointer and length (at offset 72)
    const inputPtr = params.input.length > 0 ? ptr(params.input) : 0;
    paramsView.setBigUint64(72, BigInt(inputPtr), true);
    paramsView.setBigUint64(80, BigInt(params.input.length), true);
    
    // Set gas (at offset 88)
    paramsView.setBigUint64(88, params.gas, true);
    
    // Set call type (at offset 96)
    paramsView.setUint8(96, params.callType);
    
    // Call the EVM simulate function
    const resultPtr = lib.symbols.guillotine_simulate(this.handle, ptr(paramsBuffer));
    if (!resultPtr) {
      const error = lib.symbols.guillotine_get_last_error();
      throw new Error(`Simulate failed: ${error}`);
    }
    
    // Read result structure
    const success = read.u8(resultPtr, 0) !== 0;
    const gasLeft = read.u64(resultPtr, 8);
    const outputPtr = read.ptr(resultPtr, 16);
    const outputLen = Number(read.u64(resultPtr, 24));
    
    // Copy output data
    let output = new Uint8Array(0);
    if (outputLen > 0 && outputPtr) {
      output = new Uint8Array(outputLen);
      for (let i = 0; i < outputLen; i++) {
        output[i] = read.u8(outputPtr, i);
      }
    }
    
    // Get error message if failed
    let error: string | undefined;
    if (!success) {
      const errorPtr = read.ptr(resultPtr, 32);
      if (errorPtr) {
        error = new CString(errorPtr).toString();
      }
    }
    
    // Free the result structure
    lib.symbols.guillotine_free_result(resultPtr);
    
    return {
      success,
      gasLeft,
      output,
      error,
    };
  }
}

// Export convenience functions
export function createEVM(blockInfo: BlockInfo): GuillotineEVM {
  return new GuillotineEVM(blockInfo);
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export { bytesToHex };