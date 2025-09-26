import { describe, test, expect } from "bun:test";
import { GuillotineEVM, hexToBytes, CallType } from "../../sdks/bun/src";

describe("Post-State Validation", () => {
  test("should validate balance changes correctly", () => {
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 0n,
      chainId: 1n,
    });

    // Set up initial state
    const sender = "0x1000000000000000000000000000000000000001";
    const receiver = "0x2000000000000000000000000000000000000002";
    
    evm.setBalance(sender, 1000n);
    evm.setBalance(receiver, 500n);
    
    // Simple value transfer via call
    const result = evm.call({
      caller: sender,
      to: receiver,
      value: 100n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    // Dump the state
    const stateDump = evm.dumpState();
    
    // Validate post-state
    const senderAccount = stateDump.accounts.get(sender);
    const receiverAccount = stateDump.accounts.get(receiver);
    
    // Sender should have 900 (1000 - 100)
    expect(senderAccount?.balance).toBe(900n);
    // Receiver should have 600 (500 + 100)
    expect(receiverAccount?.balance).toBe(600n);
    
    console.log("✅ Balance transfer validation passed!");
    
    evm.destroy();
  });

  test("should validate storage changes correctly", () => {
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 0n,
      chainId: 1n,
    });

    const contract = "0x3000000000000000000000000000000000000003";
    const caller = "0x4000000000000000000000000000000000000004";
    
    // Set up initial state
    evm.setBalance(caller, 1000000n);
    
    // Storage setter contract: PUSH1 0x42 PUSH1 0x00 SSTORE PUSH1 0x01 PUSH1 0x01 RETURN
    // This stores 0x42 at slot 0 and returns success
    const storageSetterCode = hexToBytes("0x6042600055600160015260016000f3");
    evm.setCode(contract, storageSetterCode);
    
    // Set initial storage value
    evm.setStorage(contract, 0n, 10n);
    
    // Call the contract
    const result = evm.call({
      caller: caller,
      to: contract,
      value: 0n,
      input: new Uint8Array(0),
      gas: 100000n,
      callType: CallType.CALL,
    });
    
    expect(result.success).toBe(true);
    
    // Dump the state
    const stateDump = evm.dumpState();
    
    // Validate storage was updated
    const contractAccount = stateDump.accounts.get(contract);
    const slot0Value = contractAccount?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000");
    
    // Storage slot 0 should now be 0x42 (66 in decimal)
    expect(slot0Value).toBe(0x42n);
    
    console.log("✅ Storage update validation passed!");
    console.log(`   - Initial value: 10`);
    console.log(`   - Final value: ${slot0Value} (0x42)`);
    
    evm.destroy();
  });

  test("should validate multiple storage slots correctly", () => {
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 0n,
      chainId: 1n,
    });

    const contract = "0x5000000000000000000000000000000000000005";
    const caller = "0x6000000000000000000000000000000000000006";
    
    evm.setBalance(caller, 1000000n);
    
    // Multi-storage setter: stores 0x11 at slot 0, 0x22 at slot 1, 0x33 at slot 2
    // PUSH1 0x11 PUSH1 0x00 SSTORE
    // PUSH1 0x22 PUSH1 0x01 SSTORE
    // PUSH1 0x33 PUSH1 0x02 SSTORE
    const multiStorageCode = hexToBytes("0x6011600055602260015560336002556000600052600160205260026040526060600053");
    evm.setCode(contract, multiStorageCode);
    
    // Set initial values
    evm.setStorage(contract, 0n, 0xAAn);
    evm.setStorage(contract, 1n, 0xBBn);
    evm.setStorage(contract, 2n, 0xCCn);
    
    const result = evm.call({
      caller: caller,
      to: contract,
      value: 0n,
      input: new Uint8Array(0),
      gas: 200000n,
      callType: CallType.CALL,
    });
    
    const stateDump = evm.dumpState();
    const contractAccount = stateDump.accounts.get(contract);
    
    // Validate all three storage slots
    const slot0 = contractAccount?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000000");
    const slot1 = contractAccount?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000001");
    const slot2 = contractAccount?.storage.get("0x0000000000000000000000000000000000000000000000000000000000000002");
    
    expect(slot0).toBe(0x11n);
    expect(slot1).toBe(0x22n);
    expect(slot2).toBe(0x33n);
    
    console.log("✅ Multi-slot storage validation passed!");
    console.log(`   - Slot 0: 0xAA -> 0x11`);
    console.log(`   - Slot 1: 0xBB -> 0x22`);
    console.log(`   - Slot 2: 0xCC -> 0x33`);
    
    evm.destroy();
  });

  test("should validate code deployment correctly", () => {
    const evm = new GuillotineEVM({
      number: 1n,
      timestamp: 1000n,
      gasLimit: 10000000n,
      coinbase: "0x0000000000000000000000000000000000000000",
      baseFee: 0n,
      chainId: 1n,
    });

    const deployer = "0x7000000000000000000000000000000000000007";
    const newContract = "0x8000000000000000000000000000000000000008";
    
    evm.setBalance(deployer, 1000000n);
    
    // Simple contract that will be deployed
    const deployedCode = hexToBytes("0x6042");
    evm.setCode(newContract, deployedCode);
    
    const stateDump = evm.dumpState();
    const contractAccount = stateDump.accounts.get(newContract);
    
    // Validate code was deployed
    expect(contractAccount).toBeDefined();
    expect(contractAccount?.code.length).toBe(2);
    expect(contractAccount?.code[0]).toBe(0x60);
    expect(contractAccount?.code[1]).toBe(0x42);
    
    console.log("✅ Code deployment validation passed!");
    console.log(`   - Deployed ${deployedCode.length} bytes of code`);
    
    evm.destroy();
  });
});