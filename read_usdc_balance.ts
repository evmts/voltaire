/**
 * Read USDC balance at specific block using Voltaire
 */
import { Address, Hex } from '@tevm/voltaire';
import { BrandedAbi } from '@tevm/voltaire';

// ERC-20 balanceOf ABI
const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ type: 'address', name: 'account' }],
    outputs: [{ type: 'uint256', name: 'balance' }],
  },
] as const;

// Contract addresses
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const HOLDER_ADDRESS = '0x55FE002aefF02F77364de339a1292923A15844B8';
const BLOCK_NUMBER = 18000000n;

// RPC URL
const RPC_URL = 'https://mainnet.infura.io/v3/ec655131d00e4d559233b2fa2e1f21a6';

async function main() {
  // Encode balanceOf(address) call - encodeFunction returns HexType (already hex string)
  const holderAddress = Address.fromHex(HOLDER_ADDRESS);
  const calldata = BrandedAbi.encodeFunction(
    erc20Abi as unknown as BrandedAbi.Abi,
    'balanceOf',
    [holderAddress]
  );

  const blockHex = `0x${BLOCK_NUMBER.toString(16)}`;

  // Make eth_call at specific block
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: USDC_ADDRESS,
          data: calldata,
        },
        blockHex,
      ],
      id: 1,
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`RPC Error: ${result.error.message}`);
  }

  // Decode the result
  const returnData = Hex.toBytes(result.result as `0x${string}`);
  const fn = erc20Abi[0];
  const [balance] = BrandedAbi.Function.decodeResult(fn as unknown as BrandedAbi.Function.FunctionType, returnData);

  return balance.toString();
}

main()
  .then((balance) => {
    console.log(`\nANSWER: ${balance}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
