/**
 * Svelte store for wallet state management
 */

import { writable, derived, type Readable } from "svelte/store";
import { Address, Keccak256 } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire";
import { BrowserProvider } from "$lib/ethereum/provider";

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: AddressType | null;
  chainId: bigint | null;
  balance: bigint | null;
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  chainId: null,
  balance: null,
  error: null,
};

function createWalletStore() {
  const { subscribe, set, update } = writable<WalletState>(initialState);

  let provider: BrowserProvider | null = null;
  let unsubscribeAccounts: (() => void) | null = null;
  let unsubscribeChain: (() => void) | null = null;

  return {
    subscribe,

    /**
     * Check if wallet is available
     */
    isAvailable(): boolean {
      return typeof window !== "undefined" && !!window.ethereum;
    },

    /**
     * Connect to wallet
     */
    async connect(): Promise<void> {
      update((s) => ({ ...s, isConnecting: true, error: null }));

      try {
        provider = BrowserProvider.fromWindow();
        if (!provider) {
          throw new Error("No Ethereum provider found. Please install MetaMask.");
        }

        const accounts = await provider.connect();
        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        const address = accounts[0];
        const chainId = await provider.getChainId();
        const balance = await provider.getBalance(address);

        // Subscribe to wallet events
        unsubscribeAccounts = provider.onAccountsChanged((newAccounts) => {
          if (newAccounts.length === 0) {
            this.disconnect();
          } else {
            update((s) => ({ ...s, address: newAccounts[0] }));
            this.refreshBalance();
          }
        });

        unsubscribeChain = provider.onChainChanged((newChainId) => {
          update((s) => ({ ...s, chainId: newChainId }));
          this.refreshBalance();
        });

        update((s) => ({
          ...s,
          isConnected: true,
          isConnecting: false,
          address,
          chainId,
          balance,
        }));
      } catch (err) {
        update((s) => ({
          ...s,
          isConnecting: false,
          error: err instanceof Error ? err.message : "Failed to connect",
        }));
      }
    },

    /**
     * Disconnect wallet
     */
    disconnect(): void {
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeChain) unsubscribeChain();
      provider = null;
      set(initialState);
    },

    /**
     * Refresh balance
     */
    async refreshBalance(): Promise<void> {
      if (!provider) return;

      let currentState: WalletState | null = null;
      const unsubscribeOnce = subscribe((s) => (currentState = s));
      unsubscribeOnce();

      if (!currentState?.address) return;

      try {
        const balance = await provider.getBalance(currentState.address);
        update((s) => ({ ...s, balance }));
      } catch (err) {
        // Silently fail balance refresh
      }
    },

    /**
     * Get the provider instance
     */
    getProvider(): BrowserProvider | null {
      return provider;
    },
  };
}

export const wallet = createWalletStore();

/**
 * Derived store for formatted address display
 */
export const formattedAddress: Readable<string | null> = derived(wallet, ($wallet) => {
  if (!$wallet.address) return null;
  return Address.toShortHex($wallet.address, 6, 4);
});

/**
 * Derived store for formatted balance in ETH
 */
export const formattedBalance: Readable<string | null> = derived(wallet, ($wallet) => {
  if ($wallet.balance === null) return null;
  const eth = Number($wallet.balance) / 1e18;
  return eth.toFixed(4);
});

/**
 * Derived store for chain name
 */
export const chainName: Readable<string | null> = derived(wallet, ($wallet) => {
  if (!$wallet.chainId) return null;

  const chains: Record<string, string> = {
    "1": "Ethereum Mainnet",
    "5": "Goerli Testnet",
    "11155111": "Sepolia Testnet",
    "137": "Polygon Mainnet",
    "80001": "Polygon Mumbai",
    "10": "Optimism Mainnet",
    "42161": "Arbitrum One",
    "8453": "Base Mainnet",
    "84532": "Base Sepolia",
  };

  return chains[$wallet.chainId.toString()] ?? `Chain ${$wallet.chainId}`;
});
