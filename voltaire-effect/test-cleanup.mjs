import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { HDWalletService } from './src/crypto/HDWallet/HDWalletService.ts';
import { withPrivateKey, withSeed } from './src/crypto/HDWallet/derive.ts';

// Simple test layer that provides actual Uint8Array data for testing
const TestHDWalletLive = Layer.succeed(HDWalletService, {
  derive: () => Effect.succeed({}),
  generateMnemonic: () => Effect.succeed('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'),
  fromSeed: () => Effect.succeed({}),
  fromMnemonic: () => Effect.succeed({}),
  mnemonicToSeed: () => Effect.succeed(new Uint8Array(64).fill(42)),
  getPrivateKey: () => Effect.succeed(new Uint8Array(32).fill(99)),
  getPublicKey: () => Effect.succeed(new Uint8Array(33).fill(88)),
});

async function testWithPrivateKey() {
  let capturedKey = null;

  const program = Effect.gen(function* () {
    const master = {};
    yield* withPrivateKey(master, (key) => Effect.sync(() => {
      capturedKey = key;
      console.log('Inside withPrivateKey, key has data:', key.some(b => b !== 0));
    }));
  }).pipe(Effect.provide(TestHDWalletLive));

  await Effect.runPromise(program);
  console.log('After withPrivateKey, key is zeroed:', capturedKey.every(b => b === 0));
  if (!capturedKey.every(b => b === 0)) {
    throw new Error('Key was not zeroed!');
  }
}

async function testWithSeed() {
  let capturedSeed = null;

  const program = Effect.gen(function* () {
    yield* withSeed(['abandon', 'abandon'], (seed) => Effect.sync(() => {
      capturedSeed = seed;
      console.log('Inside withSeed, seed has data:', seed.some(b => b !== 0));
    }));
  }).pipe(Effect.provide(TestHDWalletLive));

  await Effect.runPromise(program);
  console.log('After withSeed, seed is zeroed:', capturedSeed.every(b => b === 0));
  if (!capturedSeed.every(b => b === 0)) {
    throw new Error('Seed was not zeroed!');
  }
}

testWithPrivateKey()
  .then(() => testWithSeed())
  .then(() => console.log('All memory cleanup tests passed!'))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
