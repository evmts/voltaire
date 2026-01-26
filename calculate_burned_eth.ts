import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const RPC_URL = 'https://mainnet.infura.io/v3/ec655131d00e4d559233b2fa2e1f21a6';

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL),
});

async function calculateBurnedEth(startBlock: number, endBlock: number): Promise<string> {
  let totalBurnedWei = 0n;

  console.log(`Fetching blocks ${startBlock} to ${endBlock}...`);

  for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
    const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });

    if (block.baseFeePerGas) {
      const burned = block.baseFeePerGas * block.gasUsed;
      totalBurnedWei += burned;

      if ((blockNumber - startBlock) % 10 === 0) {
        console.log(`Progress: block ${blockNumber}/${endBlock}`);
      }
    }
  }

  // Convert wei to ETH (divide by 10^18)
  const ethBurned = Number(totalBurnedWei) / 1e18;

  return ethBurned.toString();
}

const startBlock = 13000000;
const endBlock = 13000100;

calculateBurnedEth(startBlock, endBlock).then(result => {
  console.log(`\nTotal ETH burned: ${result}`);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
