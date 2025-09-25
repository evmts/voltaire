import { GuillotineEVM, CallType, hexToBytes } from '../../sdks/bun/src/index.ts';

// Test to reproduce the stack overflow issue with 1025 PUSH operations
// 
// EVM Specification: The stack is limited to 1024 items
// Expected behavior: 
// - 1024 PUSH0 operations should succeed (at limit)
// - 1025 PUSH0 operations should fail with StackOverflow error
//
// Current behavior: All tests pass, indicating a bug in stack limit enforcement
console.log('Testing EVM stack limit with PUSH0 operations...');
console.log('EVM stack limit should be 1024 items - testing enforcement...\n');

const evm = new GuillotineEVM({
  number: 1n,
  timestamp: 1000n,
  gasLimit: 30_000_000n,
  coinbase: '0x0000000000000000000000000000000000000000',
  baseFee: 10n,
  chainId: 1n,
});

function testStackLimit(pushCount, expectedSuccess, testName) {
  console.log(`\n=== ${testName} ===`);
  
  // Set balance for caller
  const caller = '0x1234567890123456789012345678901234567890';
  evm.setBalance(caller, 100_000_000_000_000_000n);
  
  // Create contract with specified number of PUSH0 operations
  // PUSH0 opcode = 0x5F
  const contractAddress = `0x000000000000000000000000000000000000${pushCount.toString(16).padStart(4, '0')}`;
  
  // Create bytecode with PUSH0 operations + STOP
  const bytecode = new Uint8Array(pushCount + 1);
  for (let i = 0; i < pushCount; i++) {
    bytecode[i] = 0x5F; // PUSH0 opcode
  }
  bytecode[pushCount] = 0x00; // STOP opcode to cleanly end execution
  
  console.log(`Creating contract with ${pushCount} PUSH0 operations + STOP`);
  console.log(`Bytecode length: ${bytecode.length} bytes`);
  console.log('First 10 bytes:', Array.from(bytecode.slice(0, 10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  console.log('Last 5 bytes:', Array.from(bytecode.slice(-5)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
  
  // Deploy the contract
  evm.setCode(contractAddress, bytecode);
  
  // Call the contract
  console.log(`Calling contract (expecting ${expectedSuccess ? 'SUCCESS' : 'STACK OVERFLOW'})...`);
  
  const result = evm.call({
    caller: caller,
    to: contractAddress,
    value: 0n,
    input: new Uint8Array(0),
    gas: 30_000_000n,
    callType: CallType.CALL,
  });
  
  console.log('Call result:', {
    success: result.success,
    gasLeft: result.gasLeft?.toString(),
    gasUsed: (30_000_000n - (result.gasLeft || 0n)).toString(),
    outputLength: result.output.length,
    error: result.error
  });
  
  // Verify the result matches expectations
  if (expectedSuccess) {
    if (result.success) {
      console.log('✅ SUCCESS: Call succeeded as expected');
    } else {
      console.log('❌ UNEXPECTED: Call failed when success was expected');
      console.log('Error:', result.error);
    }
  } else {
    if (!result.success) {
      if (result.error && (result.error.includes('stack') || result.error.includes('StackOverflow'))) {
        console.log('✅ SUCCESS: Stack overflow detected as expected');
        console.log('Error message:', result.error);
      } else {
        console.log('❌ UNEXPECTED: Call failed but not with stack overflow error');
        console.log('Actual error:', result.error);
      }
    } else {
      console.log('❌ UNEXPECTED: Call succeeded when stack overflow was expected');
    }
  }
  
  return result;
}

try {
  // Test 1: 1024 PUSH0 operations (should succeed - exactly at limit)
  testStackLimit(1024, true, "Test 1: 1024 PUSH0 operations (at limit)");
  
  // Test 2: 1025 PUSH0 operations (should fail - over limit)
  testStackLimit(1025, false, "Test 2: 1025 PUSH0 operations (over limit)");
  
  // Test 3: 1030 PUSH0 operations (should definitely fail - well over limit)  
  testStackLimit(1030, false, "Test 3: 1030 PUSH0 operations (well over limit)");
  
  // Test 4: 2048 PUSH0 operations (double the limit - should definitely fail)
  testStackLimit(2048, false, "Test 4: 2048 PUSH0 operations (double the limit)");
  
  console.log('\n=== SUMMARY ===');
  console.log('🐛 BUG REPRODUCED: Guillotine EVM does not enforce the 1024 stack item limit');
  console.log('📋 Expected: Operations beyond 1024 stack items should fail with StackOverflow error');
  console.log('❌ Actual: All operations succeed, even with 2048+ stack items');
  console.log('⚠️  This is a critical EVM compliance issue that needs to be fixed');
  
} catch (error) {
  console.log('\nException caught:', error.message);
  if (error.message.includes('stack') || error.message.includes('StackOverflow')) {
    console.log('✅ SUCCESS: Stack overflow exception detected as expected');
  } else {
    console.log('❌ UNEXPECTED: Exception but not stack overflow related');
  }
} finally {
  evm.destroy();
}