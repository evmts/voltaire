import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr, read } from "bun:ffi";
import { join } from "path";

describe("Debug EVM Execution", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("verify account state before call", () => {
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
    
    // Create EVM with specific block configuration
    const blockInfo = new ArrayBuffer(136);
    const view = new DataView(blockInfo);
    view.setBigUint64(0, 1n, true); // block number
    view.setBigUint64(8, 1000n, true); // timestamp
    view.setBigUint64(16, 30_000_000n, true); // gas limit
    view.setBigUint64(44, 1_000_000_000n, true); // base fee
    view.setBigUint64(52, 1n, true); // chain id
    view.setBigUint64(60, 0n, true); // difficulty
    
    const evm = lib.symbols.guillotine_evm_create(ptr(blockInfo));
    expect(evm).toBeTruthy();
    
    if (evm) {
      // Set up caller account with balance
      const caller = new Uint8Array(20);
      caller[19] = 0x10; // Address 0x...10
      
      const balance = new Uint8Array(32);
      // Set 1 ETH in wei (1000000000000000000)
      balance[24] = 0x0d;
      balance[25] = 0xe0;
      balance[26] = 0xb6;
      balance[27] = 0xb3;
      balance[28] = 0xa7;
      balance[29] = 0x64;
      balance[30] = 0x00;
      balance[31] = 0x00;
      
      let success = lib.symbols.guillotine_set_balance(evm, ptr(caller), ptr(balance));
      expect(success).toBe(true);
      console.log("✅ Caller balance set to 1 ETH");
      
      // Deploy contract that returns 42
      const contractAddr = new Uint8Array(20);
      contractAddr[19] = 0x20; // Address 0x...20
      
      // This contract stores 42 in memory and returns it
      // PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
      const code = new Uint8Array([
        0x60, 0x2a,  // PUSH1 42 (0x2a = 42)
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE (store 42 at memory position 0)
        0x60, 0x20,  // PUSH1 32 (return 32 bytes)
        0x60, 0x00,  // PUSH1 0 (from position 0)
        0xf3         // RETURN
      ]);
      
      success = lib.symbols.guillotine_set_code(evm, ptr(contractAddr), ptr(code), code.length);
      expect(success).toBe(true);
      console.log("✅ Contract deployed with code that returns 42");
      console.log("Contract bytecode:", Array.from(code).map(b => "0x" + b.toString(16).padStart(2, '0')).join(' '));
      
      // Now call the contract
      const callParams = new ArrayBuffer(104);
      const paramsView = new DataView(callParams);
      
      // Set caller
      new Uint8Array(callParams, 0, 20).set(caller);
      console.log("Caller address: 0x..." + caller[19].toString(16));
      
      // Set to (contract address)
      new Uint8Array(callParams, 20, 20).set(contractAddr);
      console.log("Contract address: 0x..." + contractAddr[19].toString(16));
      
      // Set value (0 - no ETH transfer)
      // bytes 40-71 are already 0
      
      // Set input pointer and length (no input data)
      paramsView.setBigUint64(72, 0n, true); // input ptr
      paramsView.setBigUint64(80, 0n, true); // input len
      
      // Set gas
      paramsView.setBigUint64(88, 100000n, true);
      console.log("Gas limit: 100000");
      
      // Set call type (0 = CALL)
      paramsView.setUint8(96, 0);
      
      console.log("\n📞 Executing call to contract...");
      
      // Execute the call
      const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
      
      if (resultPtr) {
        const success = read.u8(resultPtr, 0) !== 0;
        const gasLeft = read.u64(resultPtr, 8);
        const outputPtr = read.ptr(resultPtr, 16);
        const outputLen = Number(read.u64(resultPtr, 24));
        
        console.log("\n=== Call Result ===");
        console.log("Success:", success);
        console.log("Gas left:", gasLeft);
        console.log("Gas used:", 100000n - gasLeft);
        console.log("Output length:", outputLen);
        
        if (!success) {
          const errorPtr = read.ptr(resultPtr, 32);
          if (errorPtr) {
            const error = new TextDecoder().decode(new Uint8Array(read.buffer(errorPtr)));
            console.log("Error:", error);
          }
        }
        
        if (outputPtr && outputLen > 0) {
          const output = new Uint8Array(outputLen);
          for (let i = 0; i < outputLen; i++) {
            output[i] = read.u8(outputPtr, i);
          }
          
          console.log("\nOutput bytes:", Array.from(output));
          console.log("Output hex:", Array.from(output).map(b => b.toString(16).padStart(2, '0')).join(' '));
          console.log("Last 8 bytes:", Array.from(output.slice(-8)));
          
          // The value 42 should be in the last byte of the 32-byte word
          console.log("\nExpected value at position 31:", 42);
          console.log("Actual value at position 31:", output[31]);
          
          expect(success).toBe(true);
          expect(outputLen).toBe(32);
          expect(output[31]).toBe(42);
        } else {
          console.log("No output returned!");
        }
        
        lib.symbols.guillotine_free_result(resultPtr);
      } else {
        const error = lib.symbols.guillotine_get_last_error();
        console.error("Call failed completely:", error);
        expect(resultPtr).toBeTruthy();
      }
      
      lib.symbols.guillotine_evm_destroy(evm);
    }
    
    lib.symbols.guillotine_cleanup();
  });
});