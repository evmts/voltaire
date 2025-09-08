import { createEVM, CallType, hexToBytes, bytesToHex } from "./src/index";

// Example: Deploy and interact with a simple contract
async function main() {
  console.log("🚀 Guillotine EVM - Bun FFI Example");
  
  // Create EVM instance with block configuration
  const evm = createEVM({
    number: 1n,
    timestamp: BigInt(Date.now()),
    gasLimit: 30_000_000n,
    coinbase: "0x0000000000000000000000000000000000000000",
    baseFee: 1_000_000_000n,
    chainId: 1n,
    difficulty: 0n,
  });

  try {
    // Set up accounts with balances
    const deployer = "0x1234567890123456789012345678901234567890";
    const user = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    
    console.log("\n📝 Setting up accounts...");
    evm.setBalance(deployer, 10n ** 18n); // 1 ETH
    evm.setBalance(user, 5n * 10n ** 17n); // 0.5 ETH
    console.log(`✅ Deployer balance: 1 ETH`);
    console.log(`✅ User balance: 0.5 ETH`);

    // Deploy a simple storage contract
    // Bytecode for: contract Storage { uint256 value; function set(uint256 v) { value = v; } function get() returns (uint256) { return value; } }
    const deployBytecode = hexToBytes("0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146049575b600080fd5b60476042366004605e565b600055565b005b60005460405190815260200160405180910390f35b600060208284031215606f57600080fd5b503591905056fea264697066735822122089e5");
    
    console.log("\n🔨 Deploying storage contract...");
    const deployResult = evm.call({
      caller: deployer,
      to: "0x0000000000000000000000000000000000000000",
      value: 0n,
      input: deployBytecode,
      gas: 1_000_000n,
      callType: CallType.CREATE,
    });

    if (!deployResult.success) {
      throw new Error(`Deployment failed: ${deployResult.error}`);
    }
    
    console.log(`✅ Contract deployed!`);
    console.log(`   Gas used: ${1_000_000n - deployResult.gasLeft}`);
    
    // Calculate contract address (simplified - in real implementation would use proper CREATE address calculation)
    const contractAddress = "0x2222222222222222222222222222222222222222";
    
    // Set the deployed code
    evm.setCode(contractAddress, deployResult.output);
    
    // Call the set function (function selector: 0x60fe47b1)
    console.log("\n📤 Calling set(42)...");
    const setData = hexToBytes("0x60fe47b1000000000000000000000000000000000000000000000000000000000000002a");
    
    const setResult = evm.call({
      caller: user,
      to: contractAddress,
      value: 0n,
      input: setData,
      gas: 100_000n,
      callType: CallType.CALL,
    });

    if (!setResult.success) {
      throw new Error(`Set call failed: ${setResult.error}`);
    }
    
    console.log(`✅ Set call succeeded!`);
    console.log(`   Gas used: ${100_000n - setResult.gasLeft}`);
    
    // Call the get function (function selector: 0x6d4ce63c)
    console.log("\n📥 Calling get()...");
    const getData = hexToBytes("0x6d4ce63c");
    
    const getResult = evm.call({
      caller: user,
      to: contractAddress,
      value: 0n,
      input: getData,
      gas: 50_000n,
      callType: CallType.CALL,
    });

    if (!getResult.success) {
      throw new Error(`Get call failed: ${getResult.error}`);
    }
    
    console.log(`✅ Get call succeeded!`);
    console.log(`   Returned value: ${bytesToHex(getResult.output)}`);
    console.log(`   Gas used: ${50_000n - getResult.gasLeft}`);
    
    // Test STATICCALL (should not modify state)
    console.log("\n🔍 Testing STATICCALL...");
    const staticResult = evm.call({
      caller: user,
      to: contractAddress,
      value: 0n,
      input: getData,
      gas: 50_000n,
      callType: CallType.STATICCALL,
    });
    
    if (!staticResult.success) {
      throw new Error(`Static call failed: ${staticResult.error}`);
    }
    
    console.log(`✅ Static call succeeded!`);
    console.log(`   Returned value: ${bytesToHex(staticResult.output)}`);
    
    // Test simulation (doesn't commit state)
    console.log("\n🧪 Testing simulation...");
    const simResult = evm.simulate({
      caller: user,
      to: contractAddress,
      value: 0n,
      input: setData,
      gas: 100_000n,
      callType: CallType.CALL,
    });
    
    console.log(`✅ Simulation completed!`);
    console.log(`   Would use gas: ${100_000n - simResult.gasLeft}`);
    console.log(`   Success: ${simResult.success}`);

  } finally {
    // Clean up
    evm.destroy();
    console.log("\n🧹 EVM instance destroyed");
  }

  console.log("\n✨ Example completed successfully!");
}

// Run the example
main().catch(console.error);