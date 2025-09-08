import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr, read } from "bun:ffi";
import { join } from "path";

describe("Simple Execution Test", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("should execute STOP opcode", () => {
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
      // Set balance for caller
      const caller = new Uint8Array(20);
      caller[19] = 2;
      
      const balance = new Uint8Array(32);
      balance[31] = 100; // 100 wei
      
      let success = lib.symbols.guillotine_set_balance(evm, ptr(caller), ptr(balance));
      expect(success).toBe(true);
      console.log("✅ Caller balance set");
      
      // Deploy a contract with just STOP opcode
      const addr = new Uint8Array(20);
      addr[19] = 1;
      
      const code = new Uint8Array([0x00]); // STOP
      
      success = lib.symbols.guillotine_set_code(evm, ptr(addr), ptr(code), code.length);
      expect(success).toBe(true);
      console.log("✅ Contract code set");
      
      // Create call params
      const callParams = new ArrayBuffer(104);
      const paramsView = new DataView(callParams);
      
      // caller
      new Uint8Array(callParams, 0, 20).set(caller);
      
      // to
      new Uint8Array(callParams, 20, 20).set(addr);
      
      // value (32 bytes) - all zeros
      // input pointer and length - zeros (already zeroed)
      
      // gas
      paramsView.setBigUint64(88, 100000n, true);
      
      // call type
      paramsView.setUint8(96, 0); // CALL
      
      console.log("📞 Executing call...");
      
      // Execute call
      const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
      
      if (resultPtr) {
        const success = read.u8(resultPtr, 0) !== 0;
        const gasLeft = read.u64(resultPtr, 8);
        const outputPtr = read.ptr(resultPtr, 16);
        const outputLen = Number(read.u64(resultPtr, 24));
        
        console.log("Result - Success:", success);
        console.log("Result - Gas left:", gasLeft);
        console.log("Result - Output length:", outputLen);
        
        expect(success).toBe(true);
        expect(gasLeft).toBeGreaterThan(0n);
        expect(outputLen).toBe(0); // STOP returns no output
        
        lib.symbols.guillotine_free_result(resultPtr);
        console.log("✅ STOP opcode executed successfully");
      } else {
        const error = lib.symbols.guillotine_get_last_error();
        console.error("Call failed:", error);
        expect(resultPtr).toBeTruthy();
      }
      
      lib.symbols.guillotine_evm_destroy(evm);
    }
    
    lib.symbols.guillotine_cleanup();
  });
  
  test("should return data with RETURN opcode", () => {
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
    
    if (evm) {
      // Set balance for caller
      const caller = new Uint8Array(20);
      caller[19] = 2;
      
      const balance = new Uint8Array(32);
      // Set 1 ETH (in wei)
      balance[24] = 0x0d;
      balance[25] = 0xe0;
      balance[26] = 0xb6;
      balance[27] = 0xb3;
      balance[28] = 0xa7;
      balance[29] = 0x64;
      balance[30] = 0x00;
      balance[31] = 0x00;
      
      lib.symbols.guillotine_set_balance(evm, ptr(caller), ptr(balance));
      
      // Deploy a contract that returns 42
      const addr = new Uint8Array(20);
      addr[19] = 3;
      
      // PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      const code = new Uint8Array([
        0x60, 0x2a,  // PUSH1 42
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      ]);
      
      lib.symbols.guillotine_set_code(evm, ptr(addr), ptr(code), code.length);
      console.log("✅ Contract that returns 42 deployed");
      
      // Create call params
      const callParams = new ArrayBuffer(104);
      const paramsView = new DataView(callParams);
      
      // caller
      new Uint8Array(callParams, 0, 20).set(caller);
      
      // to
      new Uint8Array(callParams, 20, 20).set(addr);
      
      // gas
      paramsView.setBigUint64(88, 100000n, true);
      
      // call type
      paramsView.setUint8(96, 0); // CALL
      
      // Execute call
      const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
      
      if (resultPtr) {
        const success = read.u8(resultPtr, 0) !== 0;
        const gasLeft = read.u64(resultPtr, 8);
        const outputPtr = read.ptr(resultPtr, 16);
        const outputLen = Number(read.u64(resultPtr, 24));
        
        console.log("Success:", success);
        console.log("Gas left:", gasLeft);
        console.log("Output length:", outputLen);
        
        if (outputPtr && outputLen > 0) {
          const output = new Uint8Array(outputLen);
          for (let i = 0; i < outputLen; i++) {
            output[i] = read.u8(outputPtr, i);
          }
          
          console.log("Output bytes:", Array.from(output));
          console.log("Output as hex:", Array.from(output).map(b => b.toString(16).padStart(2, '0')).join(' '));
          
          // Should have 32 bytes with 42 in the last byte
          expect(outputLen).toBe(32);
          expect(output[31]).toBe(42);
          console.log("✅ Correct value returned: 42");
        } else {
          console.log("❌ No output returned");
        }
        
        lib.symbols.guillotine_free_result(resultPtr);
      }
      
      lib.symbols.guillotine_evm_destroy(evm);
    }
    
    lib.symbols.guillotine_cleanup();
  });
});