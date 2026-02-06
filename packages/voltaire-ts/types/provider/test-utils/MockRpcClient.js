/**
 * MockRpcClient for testing
 *
 * Simple mock that returns predefined responses for eth_* RPC methods.
 * Used for testing ForkProvider without real RPC dependency.
 */
export class MockRpcClient {
    accounts = new Map();
    blocks = new Map();
    blocksByNumber = new Map();
    currentBlockNumber = 0n;
    /**
     * Set account state for testing
     */
    setAccount(address, state) {
        const addr = address.toLowerCase();
        const existing = this.accounts.get(addr) || {
            balance: 0n,
            nonce: 0n,
            code: "0x",
            storage: new Map(),
        };
        this.accounts.set(addr, {
            ...existing,
            ...state,
            storage: state.storage || existing.storage,
        });
    }
    /**
     * Set block data for testing
     */
    setBlock(block) {
        this.blocks.set(block.hash, block);
        this.blocksByNumber.set(block.number, block);
        if (block.number > this.currentBlockNumber) {
            this.currentBlockNumber = block.number;
        }
    }
    /**
     * EIP-1193 request implementation
     */
    async request(args) {
        const { method, params = [] } = args;
        const p = Array.isArray(params) ? params : [params];
        switch (method) {
            case "eth_blockNumber":
                return `0x${this.currentBlockNumber.toString(16)}`;
            case "eth_getBalance": {
                const addr = p[0].toLowerCase();
                const account = this.accounts.get(addr);
                return `0x${(account?.balance || 0n).toString(16)}`;
            }
            case "eth_getTransactionCount": {
                const addr = p[0].toLowerCase();
                const account = this.accounts.get(addr);
                return `0x${(account?.nonce || 0n).toString(16)}`;
            }
            case "eth_getCode": {
                const addr = p[0].toLowerCase();
                const account = this.accounts.get(addr);
                return account?.code || "0x";
            }
            case "eth_getStorageAt": {
                const addr = p[0].toLowerCase();
                const slot = BigInt(p[1]);
                const account = this.accounts.get(addr);
                const value = account?.storage.get(slot) || 0n;
                return `0x${value.toString(16).padStart(64, "0")}`;
            }
            case "eth_getBlockByNumber": {
                const blockNum = this.parseBlockTag(p[0]);
                const block = this.blocksByNumber.get(blockNum);
                if (!block)
                    return null;
                return this.formatBlock(block);
            }
            case "eth_getBlockByHash": {
                const hash = p[0];
                const block = this.blocks.get(hash);
                if (!block)
                    return null;
                return this.formatBlock(block);
            }
            case "eth_getProof": {
                const addr = p[0].toLowerCase();
                const slots = p[1];
                const account = this.accounts.get(addr) || {
                    balance: 0n,
                    nonce: 0n,
                    code: "0x",
                    storage: new Map(),
                };
                return {
                    address: addr,
                    balance: `0x${account.balance.toString(16)}`,
                    nonce: `0x${account.nonce.toString(16)}`,
                    codeHash: "0x" +
                        "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
                    storageHash: "0x" +
                        "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
                    storageProof: slots.map((slot) => {
                        const slotBig = BigInt(slot);
                        const value = account.storage.get(slotBig) || 0n;
                        return {
                            key: slot,
                            value: `0x${value.toString(16)}`,
                            proof: [],
                        };
                    }),
                    accountProof: [],
                };
            }
            case "eth_chainId":
                return "0x1";
            case "net_version":
                return "1";
            default:
                throw new Error(`Mock RPC method not implemented: ${method}`);
        }
    }
    parseBlockTag(tag) {
        if (tag === "latest" || tag === "pending") {
            return this.currentBlockNumber;
        }
        if (tag === "earliest") {
            return 0n;
        }
        return BigInt(tag);
    }
    formatBlock(block) {
        return {
            number: `0x${block.number.toString(16)}`,
            hash: block.hash,
            parentHash: block.parentHash,
            timestamp: `0x${block.timestamp.toString(16)}`,
            gasLimit: `0x${block.gasLimit.toString(16)}`,
            gasUsed: `0x${block.gasUsed.toString(16)}`,
            baseFeePerGas: block.baseFeePerGas
                ? `0x${block.baseFeePerGas.toString(16)}`
                : undefined,
            miner: block.miner,
            difficulty: "0x0",
            totalDifficulty: "0x0",
            extraData: "0x",
            size: "0x3e8",
            nonce: "0x0000000000000000",
            mixHash: `0x${"0".repeat(64)}`,
            sha3Uncles: "0x" +
                "1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
            logsBloom: `0x${"0".repeat(512)}`,
            transactionsRoot: "0x" +
                "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
            stateRoot: "0x" +
                "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
            receiptsRoot: "0x" +
                "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
            transactions: block.transactions,
            uncles: [],
        };
    }
    // EIP-1193 Provider interface methods (minimal stubs)
    on() {
        return this;
    }
    removeListener() {
        return this;
    }
}
