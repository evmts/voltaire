import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr, read } from "bun:ffi";
import { join } from "path";
import { createEVM, CallType } from "../src/index";

describe("Compare Direct FFI vs TypeScript API", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("Direct FFI approach", () => {
    const lib = dlopen(libPath, {
      guillotine_init: { args: [], returns: FFIType.void },
      guillotine_cleanup: { args: [], returns: FFIType.void },
      guillotine_evm_create: { args: [FFIType.ptr], returns: FFIType.ptr },
      guillotine_evm_destroy: { args: [FFIType.ptr], returns: FFIType.void },
      guillotine_set_balance: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.bool },
      guillotine_set_code: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize], returns: FFIType.bool },
      guillotine_call: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
      guillotine_free_result: { args: [FFIType.ptr], returns: FFIType.void },
    });
    
    lib.symbols.guillotine_init();
    
    const blockInfo = new ArrayBuffer(136);
    const view = new DataView(blockInfo);
    view.setBigUint64(0, 1n, true);
    view.setBigUint64(8, 1000n, true);
    view.setBigUint64(16, 30_000_000n, true);
    view.setBigUint64(44, 1_000_000_000n, true);
    view.setBigUint64(52, 1n, true);
    
    const evm = lib.symbols.guillotine_evm_create(ptr(blockInfo));
    
    // Set balance for caller (address 0x10)
    const caller = new Uint8Array(20);
    caller[19] = 0x10;
    const balance = new Uint8Array(32);
    balance[24] = 0x0d;
    balance[25] = 0xe0;
    balance[26] = 0xb6;
    balance[27] = 0xb3;
    balance[28] = 0xa7;
    balance[29] = 0x64;
    balance[30] = 0x00;
    balance[31] = 0x00;
    lib.symbols.guillotine_set_balance(evm, ptr(caller), ptr(balance));
    
    // Deploy contract at address 0x20 with ADD code
    const contractAddr = new Uint8Array(20);
    contractAddr[19] = 0x20;
    const code = new Uint8Array([
      0x60, 0x05,  // PUSH1 5
      0x60, 0x03,  // PUSH1 3
      0x01,        // ADD
      0x60, 0x00,  // PUSH1 0
      0x52,        // MSTORE
      0x60, 0x20,  // PUSH1 32
      0x60, 0x00,  // PUSH1 0
      0xf3         // RETURN
    ]);
    lib.symbols.guillotine_set_code(evm, ptr(contractAddr), ptr(code), code.length);
    
    // Call the contract
    const callParams = new ArrayBuffer(104);
    const paramsView = new DataView(callParams);
    new Uint8Array(callParams, 0, 20).set(caller);
    new Uint8Array(callParams, 20, 20).set(contractAddr);
    paramsView.setBigUint64(88, 100000n, true);
    paramsView.setUint8(96, 0); // CALL
    
    const resultPtr = lib.symbols.guillotine_call(evm, ptr(callParams));
    
    if (resultPtr) {
      const success = read.u8(resultPtr, 0) !== 0;
      const gasLeft = read.u64(resultPtr, 8);
      const outputPtr = read.ptr(resultPtr, 16);
      const outputLen = Number(read.u64(resultPtr, 24));
      
      const output = new Uint8Array(outputLen);
      for (let i = 0; i < outputLen; i++) {
        output[i] = read.u8(outputPtr, i);
      }
      
      console.log("Direct FFI Result:");
      console.log("  Success:", success);
      console.log("  Gas left:", gasLeft);
      console.log("  Output:", Array.from(output));
      console.log("  Value at [31]:", output[31]);
      
      expect(output[31]).toBe(8);
      
      lib.symbols.guillotine_free_result(resultPtr);
    }
    
    lib.symbols.guillotine_evm_destroy(evm);
    lib.symbols.guillotine_cleanup();
  });
  
  test("TypeScript API approach", () => {
    const evm = createEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 30_000_000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 1_000_000_000n,
      chainId: 1n,
    });
    
    // Use same addresses as direct FFI test
    const caller = "0x0000000000000000000000000000000000000010";
    const contractAddress = "0x0000000000000000000000000000000000000020";
    
    evm.setBalance(caller, 1_000_000_000_000_000_000n); // 1 ETH
    
    const code = new Uint8Array([
      0x60, 0x05,  // PUSH1 5
      0x60, 0x03,  // PUSH1 3
      0x01,        // ADD
      0x60, 0x00,  // PUSH1 0
      0x52,        // MSTORE
      0x60, 0x20,  // PUSH1 32
      0x60, 0x00,  // PUSH1 0
      0xf3         // RETURN
    ]);
    evm.setCode(contractAddress, code);
    
    const result = evm.call({
      caller,
      to: contractAddress,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    console.log("\nTypeScript API Result:");
    console.log("  Success:", result.success);
    console.log("  Gas left:", result.gasLeft);
    console.log("  Output:", Array.from(result.output));
    console.log("  Value at [31]:", result.output[31]);
    
    expect(result.output[31]).toBe(8);
    
    evm.destroy();
  });
});