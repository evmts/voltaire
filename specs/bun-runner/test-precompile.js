import { GuillotineEVM, CallType, hexToBytes } from '../../sdks/bun/src/index.ts';

// Test ecAdd precompile (address 0x06)
const evm = new GuillotineEVM({
  number: 1n,
  timestamp: 1000n,
  gasLimit: 30_000_000n,
  coinbase: '0x0000000000000000000000000000000000000000',
  baseFee: 10n,
  chainId: 1n,
});

try {
  // Set balance for caller
  const caller = '0x1234567890123456789012345678901234567890';
  evm.setBalance(caller, 100_000_000_000_000_000n);

  // Call ecAdd precompile with valid input
  // Input: two points on the elliptic curve to add
  // Point 1: (1, 2)
  // Point 2: (1, 2)
  const input = hexToBytes(
    '0000000000000000000000000000000000000000000000000000000000000001' + // x1
    '0000000000000000000000000000000000000000000000000000000000000002' + // y1
    '0000000000000000000000000000000000000000000000000000000000000001' + // x2
    '0000000000000000000000000000000000000000000000000000000000000002'   // y2
  );

  console.log('Calling ecAdd precompile at 0x06...');
  console.log('Input length:', input.length);
  
  const result = evm.call({
    caller: caller,
    to: '0x0000000000000000000000000000000000000006', // ecAdd precompile
    value: 0n,
    input: input,
    gas: 100_000n,
    callType: CallType.CALL,
  });

  console.log('Result:', result);
  console.log('Success:', result.success);
  console.log('Gas left:', result.gasLeft);
  console.log('Output length:', result.output.length);
  if (result.output.length > 0) {
    console.log('Output hex:', Array.from(result.output).map(b => b.toString(16).padStart(2, '0')).join(''));
  }
  if (result.error) {
    console.log('Error:', result.error);
  }
} finally {
  evm.destroy();
}
