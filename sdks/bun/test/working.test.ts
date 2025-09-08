import { test, expect, describe } from "bun:test";
import { dlopen, FFIType, suffix, ptr } from "bun:ffi";
import { join } from "path";

describe("Working FFI Tests", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  // Load library once for all tests
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
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.bool,
    },
    guillotine_set_code: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize],
      returns: FFIType.bool,
    },
    guillotine_get_last_error: {
      args: [],
      returns: FFIType.cstring,
    },
  });
  
  // Initialize FFI once
  lib.symbols.guillotine_init();

  test("EVM instance should be created", () => {
    // Create block info
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true); // number
    blockInfoView.setBigUint64(8, 1000n, true); // timestamp
    blockInfoView.setBigUint64(16, 30_000_000n, true); // gas_limit
    blockInfoView.setBigUint64(44, 1_000_000_000n, true); // base_fee
    blockInfoView.setBigUint64(52, 1n, true); // chain_id
    blockInfoView.setBigUint64(60, 0n, true); // difficulty
    
    // Create EVM instance
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    expect(evmHandle).toBeTruthy();
    expect(evmHandle).not.toBe(0);
    console.log("✅ EVM instance created:", evmHandle);
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should set account balance", () => {
    // Create EVM instance first
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    expect(evmHandle).toBeTruthy();
    
    const address = new Uint8Array(20);
    address[19] = 1; // Address ending in 0x01
    
    const balance = new Uint8Array(32);
    balance[31] = 100; // 100 wei
    balance[30] = 1;   // 256 wei
    // Total: 356 wei
    
    const success = lib.symbols.guillotine_set_balance(evmHandle, ptr(address), ptr(balance));
    expect(success).toBe(true);
    console.log("✅ Balance set for address 0x...01");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should set multiple account balances", () => {
    // Create EVM instance
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    
    const accounts = [
      { addr: 2, balance: [0, 0, 0, 1000] }, // 1000 wei
      { addr: 3, balance: [0, 0, 1, 0] },    // 256 wei
      { addr: 4, balance: [0, 1, 0, 0] },    // 65536 wei
    ];
    
    for (const account of accounts) {
      const address = new Uint8Array(20);
      address[19] = account.addr;
      
      const balance = new Uint8Array(32);
      for (let i = 0; i < account.balance.length; i++) {
        balance[31 - i] = account.balance[account.balance.length - 1 - i];
      }
      
      const success = lib.symbols.guillotine_set_balance(evmHandle, ptr(address), ptr(balance));
      expect(success).toBe(true);
    }
    console.log("✅ Multiple balances set");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should set contract code", () => {
    // Create EVM instance
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    
    const contractAddress = new Uint8Array(20);
    contractAddress[19] = 10; // Address ending in 0x0a
    
    // Simple bytecode: STOP
    const bytecode = new Uint8Array([0x00]);
    
    const success = lib.symbols.guillotine_set_code(
      evmHandle,
      ptr(contractAddress),
      ptr(bytecode),
      bytecode.length
    );
    expect(success).toBe(true);
    console.log("✅ Contract code set for address 0x...0a");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should set complex contract code", () => {
    // Create EVM instance
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    
    const contractAddress = new Uint8Array(20);
    contractAddress[19] = 11; // Address ending in 0x0b
    
    // Bytecode: PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
    // Returns the value 42
    const bytecode = new Uint8Array([
      0x60, 0x2a,  // PUSH1 42
      0x60, 0x00,  // PUSH1 0
      0x52,        // MSTORE
      0x60, 0x20,  // PUSH1 32
      0x60, 0x00,  // PUSH1 0
      0xf3         // RETURN
    ]);
    
    const success = lib.symbols.guillotine_set_code(
      evmHandle,
      ptr(contractAddress),
      ptr(bytecode),
      bytecode.length
    );
    expect(success).toBe(true);
    console.log("✅ Complex contract code set for address 0x...0b");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should handle empty code", () => {
    // Create EVM instance
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    
    const contractAddress = new Uint8Array(20);
    contractAddress[19] = 12;
    
    const bytecode = new Uint8Array(0); // Empty code
    
    const success = lib.symbols.guillotine_set_code(
      evmHandle,
      ptr(contractAddress),
      ptr(bytecode),
      0
    );
    expect(success).toBe(true);
    console.log("✅ Empty code handled correctly");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("should set large contract code", () => {
    // Create EVM instance
    const blockInfoBuffer = new ArrayBuffer(136);
    const blockInfoView = new DataView(blockInfoBuffer);
    blockInfoView.setBigUint64(0, 1n, true);
    blockInfoView.setBigUint64(8, 1000n, true);
    blockInfoView.setBigUint64(16, 30_000_000n, true);
    blockInfoView.setBigUint64(44, 1_000_000_000n, true);
    blockInfoView.setBigUint64(52, 1n, true);
    
    const evmHandle = lib.symbols.guillotine_evm_create(ptr(blockInfoBuffer));
    
    const contractAddress = new Uint8Array(20);
    contractAddress[19] = 13;
    
    // Create a larger bytecode (100 PUSH1 operations followed by STOP)
    const bytecode = new Uint8Array(201);
    for (let i = 0; i < 100; i++) {
      bytecode[i * 2] = 0x60;     // PUSH1
      bytecode[i * 2 + 1] = i;     // value
    }
    bytecode[200] = 0x00; // STOP
    
    const success = lib.symbols.guillotine_set_code(
      evmHandle,
      ptr(contractAddress),
      ptr(bytecode),
      bytecode.length
    );
    expect(success).toBe(true);
    console.log("✅ Large contract code (201 bytes) set successfully");
    
    // Clean up
    lib.symbols.guillotine_evm_destroy(evmHandle);
  });

  test("error handling - should get last error", () => {
    // This might return null if no error occurred
    const error = lib.symbols.guillotine_get_last_error();
    // Just check it doesn't crash
    console.log("Last error (if any):", error || "No error");
    expect(true).toBe(true);
  });
});

describe("Account and Code Management", () => {
  const libPath = join(__dirname, "../../../zig-out/lib", `libguillotine_ffi.${suffix}`);
  
  test("complete setup workflow", () => {
    const lib = dlopen(libPath, {
      guillotine_init: { args: [], returns: FFIType.void },
      guillotine_cleanup: { args: [], returns: FFIType.void },
      guillotine_evm_create: { args: [FFIType.ptr], returns: FFIType.ptr },
      guillotine_evm_destroy: { args: [FFIType.ptr], returns: FFIType.void },
      guillotine_set_balance: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.bool },
      guillotine_set_code: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.usize], returns: FFIType.bool },
    });
    
    lib.symbols.guillotine_init();
    
    // Create EVM with specific block configuration
    const blockInfo = new ArrayBuffer(136);
    const view = new DataView(blockInfo);
    view.setBigUint64(0, 12345n, true); // block number
    view.setBigUint64(8, BigInt(Date.now()), true); // timestamp
    view.setBigUint64(16, 15_000_000n, true); // gas limit
    view.setBigUint64(44, 25_000_000_000n, true); // base fee (25 gwei)
    view.setBigUint64(52, 1n, true); // mainnet chain id
    view.setBigUint64(60, 0n, true); // post-merge difficulty
    
    const evm = lib.symbols.guillotine_evm_create(ptr(blockInfo));
    expect(evm).toBeTruthy();
    
    // Set up multiple accounts
    const accounts = [
      { id: 0x10, balance: 1_000_000_000_000_000_000n }, // 1 ETH
      { id: 0x20, balance: 500_000_000_000_000_000n },   // 0.5 ETH
      { id: 0x30, balance: 100_000_000_000_000_000n },   // 0.1 ETH
    ];
    
    for (const account of accounts) {
      const addr = new Uint8Array(20);
      addr[19] = account.id;
      
      const bal = new Uint8Array(32);
      let temp = account.balance;
      for (let i = 31; i >= 0; i--) {
        bal[i] = Number(temp & 0xffn);
        temp = temp >> 8n;
      }
      
      const success = lib.symbols.guillotine_set_balance(evm, ptr(addr), ptr(bal));
      expect(success).toBe(true);
    }
    
    // Set up contracts with different bytecodes
    const contracts = [
      { id: 0x40, code: [0x00] }, // STOP
      { id: 0x41, code: [0x60, 0x01, 0x60, 0x02, 0x01, 0x00] }, // ADD 1+2, STOP
      { id: 0x42, code: [0x33, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3] }, // Return CALLER
    ];
    
    for (const contract of contracts) {
      const addr = new Uint8Array(20);
      addr[19] = contract.id;
      
      const code = new Uint8Array(contract.code);
      
      const success = lib.symbols.guillotine_set_code(evm, ptr(addr), ptr(code), code.length);
      expect(success).toBe(true);
    }
    
    console.log("✅ Complete setup: 3 accounts funded, 3 contracts deployed");
    
    // Cleanup
    lib.symbols.guillotine_evm_destroy(evm);
    lib.symbols.guillotine_cleanup();
  });
});