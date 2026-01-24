<script lang="ts">
  import { onMount } from "svelte";
  import { Address, Hex, Keccak256 } from "@tevm/voltaire";
  import {
    wallet,
    formattedAddress,
    formattedBalance,
    chainName,
  } from "$lib/stores/wallet";
  import { Contract, COUNTER_ABI } from "$lib/ethereum/contract";

  // Contract state
  let count: bigint | null = null;
  let isLoading = false;
  let txPending = false;
  let lastTxHash: string | null = null;
  let error: string | null = null;

  // Event log
  let events: Array<{
    name: string;
    args: Record<string, unknown>;
    blockNumber: bigint;
    transactionHash: string;
  }> = [];

  // Contract instance (would be set with actual deployed address)
  let contract: Contract<typeof COUNTER_ABI> | null = null;

  // Example contract address (replace with your deployed counter)
  const COUNTER_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Initialize contract when wallet connects
  $: if ($wallet.isConnected && $wallet.address) {
    const provider = wallet.getProvider();
    if (provider && COUNTER_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      contract = new Contract({
        address: COUNTER_ADDRESS,
        abi: COUNTER_ABI,
        provider,
      });
      loadCount();
      loadEvents();
    }
  }

  async function loadCount() {
    if (!contract) return;
    isLoading = true;
    error = null;
    try {
      const result = await contract.read("count");
      count = result as bigint;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to read count";
    } finally {
      isLoading = false;
    }
  }

  async function loadEvents() {
    if (!contract) return;
    try {
      // Load last 1000 blocks of events
      const currentBlock = await wallet.getProvider()?.request<string>("eth_blockNumber", []);
      if (currentBlock) {
        const blockNum = BigInt(currentBlock);
        const fromBlock = blockNum > 1000n ? blockNum - 1000n : 0n;
        events = await contract.getEvents("CountChanged", { fromBlock });
      }
    } catch (err) {
      // Silently fail event loading
    }
  }

  async function increment() {
    if (!contract || !$wallet.address) return;
    txPending = true;
    error = null;
    lastTxHash = null;

    try {
      const txHash = await contract.write("increment", [], {
        from: $wallet.address,
      });
      lastTxHash = txHash;

      // Wait for confirmation
      const provider = wallet.getProvider();
      if (provider) {
        await provider.waitForTransaction(txHash);
        await loadCount();
        await loadEvents();
        await wallet.refreshBalance();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Transaction failed";
    } finally {
      txPending = false;
    }
  }

  async function decrement() {
    if (!contract || !$wallet.address) return;
    txPending = true;
    error = null;
    lastTxHash = null;

    try {
      const txHash = await contract.write("decrement", [], {
        from: $wallet.address,
      });
      lastTxHash = txHash;

      const provider = wallet.getProvider();
      if (provider) {
        await provider.waitForTransaction(txHash);
        await loadCount();
        await loadEvents();
        await wallet.refreshBalance();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Transaction failed";
    } finally {
      txPending = false;
    }
  }

  // Format address for display
  function formatAddress(addr: unknown): string {
    if (!addr) return "unknown";
    if (addr instanceof Uint8Array) {
      return Address.toShortHex(addr as ReturnType<typeof Address>, 6, 4);
    }
    const str = String(addr);
    if (str.length > 12) {
      return `${str.slice(0, 6)}...${str.slice(-4)}`;
    }
    return str;
  }
</script>

<svelte:head>
  <title>SvelteKit + Voltaire Contract Example</title>
</svelte:head>

<main>
  <h1>SvelteKit + Voltaire</h1>
  <p class="subtitle">Contract Interaction Example</p>

  <!-- Wallet Connection -->
  <section class="card">
    <h2>Wallet</h2>

    {#if !wallet.isAvailable()}
      <p class="warning">No Ethereum wallet detected. Please install MetaMask.</p>
    {:else if $wallet.isConnecting}
      <p>Connecting...</p>
    {:else if $wallet.isConnected}
      <div class="wallet-info">
        <div class="info-row">
          <span class="label">Address:</span>
          <span class="value mono">{$formattedAddress}</span>
        </div>
        <div class="info-row">
          <span class="label">Chain:</span>
          <span class="value">{$chainName}</span>
        </div>
        <div class="info-row">
          <span class="label">Balance:</span>
          <span class="value">{$formattedBalance} ETH</span>
        </div>
        <button class="secondary" on:click={() => wallet.disconnect()}>
          Disconnect
        </button>
      </div>
    {:else}
      <button class="primary" on:click={() => wallet.connect()}>
        Connect Wallet
      </button>
      {#if $wallet.error}
        <p class="error">{$wallet.error}</p>
      {/if}
    {/if}
  </section>

  <!-- Contract Interaction -->
  {#if $wallet.isConnected}
    <section class="card">
      <h2>Counter Contract</h2>

      {#if COUNTER_ADDRESS === "0x0000000000000000000000000000000000000000"}
        <p class="warning">
          Replace COUNTER_ADDRESS with your deployed contract address to interact
          with it.
        </p>
      {:else}
        <div class="contract-info">
          <p class="address mono">{COUNTER_ADDRESS}</p>

          {#if isLoading}
            <p>Loading...</p>
          {:else if count !== null}
            <div class="count-display">
              <span class="count-label">Current Count:</span>
              <span class="count-value">{count.toString()}</span>
            </div>

            <div class="button-group">
              <button
                class="primary"
                on:click={decrement}
                disabled={txPending}
              >
                {txPending ? "..." : "- Decrement"}
              </button>
              <button
                class="primary"
                on:click={increment}
                disabled={txPending}
              >
                {txPending ? "..." : "+ Increment"}
              </button>
            </div>

            {#if lastTxHash}
              <p class="tx-hash">
                Last TX: <span class="mono">{lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}</span>
              </p>
            {/if}
          {/if}

          {#if error}
            <p class="error">{error}</p>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Event Log -->
    <section class="card">
      <h2>Event Log</h2>

      {#if events.length === 0}
        <p class="muted">No events yet</p>
      {:else}
        <div class="event-list">
          {#each events.slice(-10).reverse() as event}
            <div class="event-item">
              <div class="event-header">
                <span class="event-name">{event.name}</span>
                <span class="event-block mono">Block {event.blockNumber.toString()}</span>
              </div>
              <div class="event-args">
                {#each Object.entries(event.args) as [key, value]}
                  <span class="event-arg">
                    <span class="arg-key">{key}:</span>
                    <span class="arg-value mono">
                      {typeof value === "bigint"
                        ? value.toString()
                        : formatAddress(value)}
                    </span>
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Usage Info -->
  <section class="card info">
    <h2>About This Example</h2>
    <p>
      This example demonstrates using <strong>Voltaire</strong> primitives with
      <strong>SvelteKit</strong> for Ethereum contract interaction:
    </p>
    <ul>
      <li><code>Address</code> - Type-safe Ethereum addresses</li>
      <li><code>Hex</code> - Hex string encoding/decoding</li>
      <li><code>Abi</code> - ABI encoding/decoding for contract calls</li>
      <li><code>Keccak256</code> - Hashing for event signatures</li>
    </ul>
    <p>
      All imports come from <code>@tevm/voltaire</code> - no internal paths needed.
    </p>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background: #0f0f0f;
    color: #e0e0e0;
    min-height: 100vh;
  }

  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    color: #fff;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #fff;
  }

  .subtitle {
    color: #888;
    margin: 0.5rem 0 2rem;
  }

  .card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .card.info {
    background: #1a1a2a;
    border-color: #2a2a4a;
  }

  .mono {
    font-family: "SF Mono", Monaco, "Andale Mono", monospace;
    font-size: 0.9em;
  }

  .wallet-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    color: #888;
  }

  .value {
    color: #fff;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  button.primary {
    background: #6366f1;
    color: white;
  }

  button.primary:hover:not(:disabled) {
    background: #4f46e5;
  }

  button.secondary {
    background: #333;
    color: #fff;
  }

  button.secondary:hover:not(:disabled) {
    background: #444;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .button-group button {
    flex: 1;
  }

  .warning {
    color: #fbbf24;
    background: #422006;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin: 0;
  }

  .error {
    color: #f87171;
    background: #450a0a;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }

  .muted {
    color: #666;
  }

  .contract-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .address {
    color: #888;
    font-size: 0.85rem;
    margin: 0;
  }

  .count-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem;
    background: #0f0f0f;
    border-radius: 8px;
    margin: 1rem 0;
  }

  .count-label {
    color: #888;
  }

  .count-value {
    font-size: 2rem;
    font-weight: 600;
    color: #6366f1;
  }

  .tx-hash {
    color: #888;
    font-size: 0.85rem;
    margin-top: 1rem;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .event-item {
    background: #0f0f0f;
    border-radius: 8px;
    padding: 0.75rem;
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .event-name {
    color: #6366f1;
    font-weight: 500;
  }

  .event-block {
    color: #666;
    font-size: 0.8rem;
  }

  .event-args {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
  }

  .event-arg {
    font-size: 0.85rem;
  }

  .arg-key {
    color: #888;
  }

  .arg-value {
    color: #e0e0e0;
  }

  ul {
    padding-left: 1.5rem;
    line-height: 1.8;
  }

  code {
    background: #2a2a2a;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-family: "SF Mono", Monaco, monospace;
    font-size: 0.9em;
  }
</style>
