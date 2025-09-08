import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr, read } from "bun:ffi";
import { join } from "path";

describe("FFI Pointer Handling", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("should handle result pointer correctly", () => {
    const lib = dlopen(libPath, {
      guillotine_init: { args: [], returns: FFIType.void },
      guillotine_cleanup: { args: [], returns: FFIType.void },
      guillotine_evm_create: { args: [FFIType.ptr], returns: FFIType.ptr },
      guillotine_evm_destroy: { args: [FFIType.ptr], returns: FFIType.void },
      guillotine_set_balance: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.bool },
      guillotine_set_code: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize], returns: FFIType.bool },
      guillotine_call: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
      guillotine_free_result: { args: [FFIType.ptr], returns: FFIType.void },
      guillotine_get_last_error: { args: [], returns: FFIType.cstring },
    });
    
    lib.symbols.guillotine_init();
    
    // Create EVM
    const blockInfo = new ArrayBuffer(136);
    const view = new DataView(blockInfo);
    view.setBigUint64(0, 1n, true);
    view.setBigUint64(8, 1000n, true);
    view.setBigUint64(16, 30_000_000n, true);
    view.setBigUint64(44, 1_000_000_000n, true);
    view.setBigUint64(52, 1n, true);
    
    const evm = lib.symbols.guillotine_evm_create(ptr(blockInfo));
    expect(evm).toBeTruthy();
    
    if (evm) {
      // Set code for a simple contract (STOP)
      const addr = new Uint8Array(20);
      addr[19] = 1;
      
      const code = new Uint8Array([0x00]); // STOP
      
      const success = lib.symbols.guillotine_set_code(evm, ptr(addr), ptr(code), code.length);
      expect(success).toBe(true);
      
      // Create call params
      const callParams = new ArrayBuffer(104);
      const paramsView = new DataView(callParams);
      
      // caller
      const caller = new Uint8Array(20);
      caller[19] = 2;
      new Uint8Array(callParams, 0, 20).set(caller);
      
      // to
      new Uint8Array(callParams, 20, 20).set(addr);
      
      // value (32 bytes) - all zeros
      // input pointer and length - zeros
      // gas
      paramsView.setBigUint64(88, 100000n, true);
      // call type
      paramsView.setUint8(96, 0); // CALL
      
      // Execute call
      const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
      
      if (resultPtr) {
        console.log("Got result pointer:", resultPtr);
        
        // The result is a pointer to an EvmResult struct
        // EvmResult layout:
        // - success: bool (1 byte, but aligned to 8)
        // - gas_left: u64 (8 bytes)
        // - output: [*]const u8 (8 bytes pointer)
        // - output_len: usize (8 bytes)
        // - error_message: [*:0]const u8 (8 bytes pointer)
        // Total: 40 bytes
        
        // Read the struct fields using Bun's read API
        const success = read.u8(resultPtr, 0) !== 0;
        const gasLeft = read.u64(resultPtr, 8);
        const outputPtr = read.ptr(resultPtr, 16);
        const outputLen = Number(read.u64(resultPtr, 24));
        
        console.log("Result - Success:", success);
        console.log("Result - Gas left:", gasLeft);
        console.log("Result - Output len:", outputLen);
        
        expect(success).toBe(true);
        expect(gasLeft).toBeGreaterThan(0n);
        
        // Free the result
        lib.symbols.guillotine_free_result(resultPtr);
        console.log("✅ Result freed successfully");
      } else {
        const error = lib.symbols.guillotine_get_last_error();
        console.error("Call failed:", error);
      }
      
      lib.symbols.guillotine_evm_destroy(evm);
    }
    
    lib.symbols.guillotine_cleanup();
  });
});