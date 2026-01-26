import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const RPC_URL = 'https://mainnet.infura.io/v3/ec655131d00e4d559233b2fa2e1f21a6';
const CONTRACT_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

async function hasCode(blockNumber: bigint): Promise<boolean> {
  const code = await client.getBytecode({
    address: CONTRACT_ADDRESS,
    blockNumber,
  });
  return code !== undefined && code !== '0x';
}

async function findDeploymentBlock(): Promise<bigint> {
  // Get current block
  const currentBlock = await client.getBlockNumber();

  // Binary search bounds
  let low = 0n;
  let high = currentBlock;
  let deploymentBlock = high;

  console.log(`Searching between blocks 0 and ${currentBlock}`);

  while (low <= high) {
    const mid = (low + high) / 2n;
    const exists = await hasCode(mid);

    console.log(`Block ${mid}: ${exists ? 'HAS CODE' : 'NO CODE'}`);

    if (exists) {
      deploymentBlock = mid;
      high = mid - 1n; // Search earlier
    } else {
      low = mid + 1n; // Search later
    }
  }

  return deploymentBlock;
}

// Run the search
findDeploymentBlock()
  .then((block) => {
    console.log(`\nDeployment block: ${block}`);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
