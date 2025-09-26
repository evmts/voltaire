import { describe, test, expect } from "bun:test";
import { GuillotineEVM, hexToBytes, CallType } from "../../sdks/bun/src";

describe("State Dump API", () => {
  test("should correctly dump state after simple execution", () => {
    // Create EVM instance
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 0n,
      chainId: 1n,
    });

    // Set up initial state
    const address1 = "0x1000000000000000000000000000000000000001";
    const address2 = "0x2000000000000000000000000000000000000002";
    
    evm.setBalance(address1, 1000n);
    evm.setBalance(address2, 2000n);
    
    // Simple contract that stores a value (PUSH1 42 PUSH1 0 SSTORE)
    const simpleStorageCode = hexToBytes("0x602a600055");
    evm.setCode(address2, simpleStorageCode);
    
    // Call the contract to store value
    const result = evm.call({
      caller: address1,
      to: address2,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    // Dump the state
    const stateDump = evm.dumpState();
    
    console.log("State dump accounts:", stateDump.accounts.size);
    for (const [addr, state] of stateDump.accounts) {
      console.log(`Account ${addr}:`, {
        balance: state.balance,
        nonce: state.nonce,
        codeLength: state.code.length,
        storageSize: state.storage.size,
        storageKeys: Array.from(state.storage.keys())
      });
    }
    
    // Verify the state dump contains expected accounts
    expect(stateDump.accounts.size).toBeGreaterThanOrEqual(2);
    
    // Check account 1 balance
    const account1State = stateDump.accounts.get(address1);
    expect(account1State).toBeDefined();
    expect(account1State?.balance).toBe(1000n);
    
    // Check account 2 balance and code
    const account2State = stateDump.accounts.get(address2);
    expect(account2State).toBeDefined();
    expect(account2State?.balance).toBe(2000n);
    expect(account2State?.code.length).toBe(5);
    
    // Check storage was updated (slot 0 should have value 42)
    const storageValue = account2State?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(storageValue).toBe(42n);
    
    console.log("✅ State dump validation passed!");
    console.log(`   - Found ${stateDump.accounts.size} accounts`);
    console.log(`   - Account 1 balance: ${account1State?.balance}`);
    console.log(`   - Account 2 balance: ${account2State?.balance}`);
    console.log(`   - Account 2 storage[0]: ${storageValue}`);
    
    evm.destroy();
  });

  test("should validate post-state from spec test", () => {
    // This simulates what the spec tests do
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x2adc25665018aa1fe0e6bc666dac8fc2697ff9ba",
      baseFee: 0n,
      chainId: 1n,
    });

    // Set up a funded account
    const sender = "0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b";
    const contract = "0xc000000000000000000000000000000000000000";
    
    evm.setBalance(sender, 1000000n);
    
    // Deploy a simple contract that increments a counter
    // PUSH1 1 PUSH1 0 SLOAD ADD PUSH1 0 SSTORE
    const counterCode = hexToBytes("0x6001600054016000556001600054");
    evm.setCode(contract, counterCode);
    
    // Call the contract
    const result = evm.call({
      caller: sender,
      to: contract,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    expect(result.success).toBe(true);
    
    // Dump and verify state
    const stateDump = evm.dumpState();
    
    // Check contract storage - should have counter = 1
    const contractState = stateDump.accounts.get(contract);
    expect(contractState).toBeDefined();
    
    const counterValue = contractState?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(counterValue).toBe(1n);
    
    // Call again to increment counter
    const result2 = evm.call({
      caller: sender,
      to: contract,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    expect(result2.success).toBe(true);
    
    // Dump state again and verify counter incremented
    const stateDump2 = evm.dumpState();
    const contractState2 = stateDump2.accounts.get(contract);
    const counterValue2 = contractState2?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000");
    expect(counterValue2).toBe(2n);
    
    console.log("✅ Spec-style post-state validation passed!");
    console.log(`   - Counter after first call: 1`);
    console.log(`   - Counter after second call: 2`);
    
    evm.destroy();
  });
});