import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr, read } from "bun:ffi";
import { join } from "path";

describe("Debug Output Reading", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("should correctly read output bytes", () => {
    const lib = dlopen(libPath, {
      guillotine_init: { args: [], returns: FFIType.void },
      guillotine_cleanup: { args: [], returns: FFIType.void },
      guillotine_evm_create: { args: [FFIType.ptr], returns: FFIType.ptr },
      guillotine_evm_destroy: { args: [FFIType.ptr], returns: FFIType.void },
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
      // Deploy a contract that returns the value 8
      // Bytecode: PUSH1 8, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      const addr = new Uint8Array(20);
      addr[19] = 1;
      
      const code = new Uint8Array([
        0x60, 0x08,  // PUSH1 8
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xf3         // RETURN
      ]);
      
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
      
      // gas
      paramsView.setBigUint64(88, 100000n, true);
      // call type
      paramsView.setUint8(96, 0); // CALL
      
      // Execute call
      const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
      expect(resultPtr).toBeTruthy();
      
      if (resultPtr) {
        const success = read.u8(resultPtr, 0) !== 0;
        const gasLeft = read.u64(resultPtr, 8);
        const outputPtr = read.ptr(resultPtr, 16);
        const outputLen = Number(read.u64(resultPtr, 24));
        
        console.log("Success:", success);
        console.log("Gas left:", gasLeft);
        console.log("Output length:", outputLen);
        console.log("Output pointer:", outputPtr);
        
        expect(success).toBe(true);
        expect(outputLen).toBe(32);
        
        if (outputPtr && outputLen > 0) {
          // Read the output bytes
          const output = new Uint8Array(outputLen);
          for (let i = 0; i < outputLen; i++) {
            output[i] = read.u8(outputPtr, i);
          }
          
          console.log("Output bytes:", Array.from(output));
          console.log("Last byte value:", output[31]);
          console.log("As hex:", output[31].toString(16));
          
          // The last byte should be 8 (not ASCII '8' which is 56)
          expect(output[31]).toBe(8);
        }
        
        lib.symbols.guillotine_free_result(resultPtr);
      }
      
      lib.symbols.guillotine_evm_destroy(evm);
    }
    
    lib.symbols.guillotine_cleanup();
  });
});