import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://mainnet.infura.io/v3/ec655131d00e4d559233b2fa2e1f21a6')
});

const BAYC_ADDRESS = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const TOKEN_ID = 1234n;
const BLOCK_NUMBER = 15000000n;

async function getOwner() {
  const owner = await client.readContract({
    address: BAYC_ADDRESS,
    abi: [{
      name: 'ownerOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ type: 'uint256', name: 'tokenId' }],
      outputs: [{ type: 'address' }]
    }],
    functionName: 'ownerOf',
    args: [TOKEN_ID],
    blockNumber: BLOCK_NUMBER
  });
  
  console.log(owner);
}

getOwner();
