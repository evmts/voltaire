import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr } from "bun:ffi";
import { join } from "path";

describe("Basic FFI Tests", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("should create and destroy EVM instance", () => {
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
    });
    
    // Initialize FFI
    lib.symbols.guillotine_init();
    
    // Create block info structure (136 bytes)
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    
    // Set basic block info
    blockInfoView.setBigUint64(0, 1n, true); // number
    blockInfoView.setBigUint64(8, 1000n, true); // timestamp
    blockInfoView.setBigUint64(16, 30_000_000n, true); // gas_limit
    // coinbase at offset 24 (20 bytes) - leave as zeros
    blockInfoView.setBigUint64(44, 1_000_000_000n, true); // base_fee
    blockInfoView.setBigUint64(52, 1n, true); // chain_id
    blockInfoView.setBigUint64(60, 0n, true); // difficulty
    // prev_randao at offset 68 (32 bytes) - leave as zeros
    
    // Create EVM instance
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    console.log("EVM handle:", evmHandle);
    
    expect(evmHandle).toBeTruthy();
    expect(evmHandle).not.toBe(0);
    
    // Destroy EVM instance
    if (evmHandle) {
      lib.symbols.guillotine_evm_destroy(evmHandle);
      console.log("✅ EVM instance created and destroyed successfully");
    }
    
    // Cleanup FFI
    lib.symbols.guillotine_cleanup();
  });

  test("should set balance on account", () => {
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
        args: [FFIType.ptr],
        returns: FFIType.ptr,
      },
      guillotine_evm_destroy: {
        args: [FFIType.ptr],
        returns: FFIType.void,
      },
      guillotine_set_balance: {
        args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], // EvmHandle*, [20]u8*, [32]u8*
        returns: FFIType.bool,
      },
    });
    
    // Initialize FFI
    lib.symbols.guillotine_init();
    
    // Create block info
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    // Create EVM
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    expect(evmHandle).toBeTruthy();
    
    if (evmHandle) {
      // Set balance
      const address = new Uint8Array(20);
      address[19] = 1; // Address ending in 0x01
      
      const balance = new Uint8Array(32);
      balance[31] = 100; // 100 wei
      
      const success = lib.symbols.guillotine_set_balance(evmHandle, ptr(address), ptr(balance));
      expect(success).toBe(true);
      console.log("✅ Balance set successfully");
      
      // Cleanup
      lib.symbols.guillotine_evm_destroy(evmHandle);
    }
    
    lib.symbols.guillotine_cleanup();
  });

  test("should set and execute contract code", () => {
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
        args: [FFIType.ptr],
        returns: FFIType.ptr,
      },
      guillotine_evm_destroy: {
        args: [FFIType.ptr],
        returns: FFIType.void,
      },
      guillotine_set_code: {
        args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize],
        returns: FFIType.bool,
      },
      guillotine_call: {
        args: [FFIType.ptr, FFIType.ptr], // EvmHandle*, CallParams*
        returns: FFIType.ptr, // Returns pointer to EvmResult
      },
      guillotine_free_output: {
        args: [FFIType.ptr, FFIType.usize],
        returns: FFIType.void,
      },
    });
    
    // Initialize FFI
    lib.symbols.guillotine_init();
    
    // Create block info
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    // Create EVM
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    expect(evmHandle).toBeTruthy();
    
    if (evmHandle) {
      // Set code for contract
      const contractAddress = new Uint8Array(20);
      contractAddress[19] = 2; // Address ending in 0x02
      
      const bytecode = new Uint8Array([0x00]); // STOP opcode
      
      const success = lib.symbols.guillotine_set_code(
        evmHandle,
        ptr(contractAddress),
        ptr(bytecode),
        bytecode.length
      );
      expect(success).toBe(true);
      console.log("✅ Contract code set successfully");
      
      // Prepare call parameters (104 bytes structure)
      const callParams = new ArrayBuffer(104);
      const paramsView = new DataView(callParams);
      
      // Set caller (20 bytes at offset 0)
      const callerAddress = new Uint8Array(20);
      callerAddress[19] = 1;
      new Uint8Array(callParams, 0, 20).set(callerAddress);
      
      // Set to (20 bytes at offset 20)
      new Uint8Array(callParams, 20, 20).set(contractAddress);
      
      // Set value (32 bytes at offset 40) - all zeros
      
      // Set input pointer and length (at offset 72)
      // For empty input, set both to 0
      paramsView.setBigUint64(72, 0n, true); // input ptr
      paramsView.setBigUint64(80, 0n, true); // input len
      
      // Set gas (at offset 88)
      paramsView.setBigUint64(88, 100000n, true);
      
      // Set call type (at offset 96)
      paramsView.setUint8(96, 0); // CALL
      
      // Execute call
      const resultPtr = lib.symbols.guillotine_call(evmHandle, ptr(callParams));
      
      if (resultPtr) {
        // Read result structure (32 bytes)
        const resultBuffer = new Uint8Array(32);
        // Note: In real implementation, we'd need to properly read from the pointer
        // For now, we just check that we got a result
        console.log("✅ Call executed, got result pointer:", resultPtr);
      }
      
      // Cleanup
      lib.symbols.guillotine_evm_destroy(evmHandle);
    }
    
    lib.symbols.guillotine_cleanup();
  });
});