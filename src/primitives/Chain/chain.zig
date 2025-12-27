//! Chain - Ethereum Chain Configuration
//!
//! Represents an Ethereum chain configuration with network-specific parameters.
//! Supports common chains like Mainnet, Goerli, Sepolia, and L2s like Optimism, Arbitrum.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const Chain = primitives.Chain;
//!
//! // Create chain from ID
//! const chain = Chain.fromId(1); // Mainnet
//!
//! // Check chain type
//! const is_testnet = Chain.isTestnet(chain);
//! const is_l2 = Chain.isL2(chain);
//!
//! // Hardfork queries
//! const block = Chain.getHardforkBlock(chain, .london);
//! const supports = Chain.supportsHardfork(chain, .cancun);
//! ```

const std = @import("std");
const ChainId = @import("../ChainId/ChainId.zig");

/// Native currency information
pub const NativeCurrency = struct {
    name: []const u8,
    symbol: []const u8,
    decimals: u8,
};

/// Block explorer configuration
pub const Explorer = struct {
    name: []const u8,
    url: []const u8,
};

/// Hardfork identifier enum
pub const Hardfork = enum {
    chainstart,
    homestead,
    dao,
    tangerine_whistle,
    spurious_dragon,
    byzantium,
    constantinople,
    petersburg,
    istanbul,
    muir_glacier,
    berlin,
    london,
    arrow_glacier,
    gray_glacier,
    paris,
    shanghai,
    cancun,
    prague,
};

/// Hardfork block numbers
pub const HardforkBlocks = struct {
    chainstart: ?u64 = null,
    homestead: ?u64 = null,
    dao: ?u64 = null,
    tangerine_whistle: ?u64 = null,
    spurious_dragon: ?u64 = null,
    byzantium: ?u64 = null,
    constantinople: ?u64 = null,
    petersburg: ?u64 = null,
    istanbul: ?u64 = null,
    muir_glacier: ?u64 = null,
    berlin: ?u64 = null,
    london: ?u64 = null,
    arrow_glacier: ?u64 = null,
    gray_glacier: ?u64 = null,
    paris: ?u64 = null,
    shanghai: ?u64 = null,
    cancun: ?u64 = null,
    prague: ?u64 = null,

    /// Get block number for a specific hardfork
    pub fn get(self: HardforkBlocks, hf: Hardfork) ?u64 {
        return switch (hf) {
            .chainstart => self.chainstart,
            .homestead => self.homestead,
            .dao => self.dao,
            .tangerine_whistle => self.tangerine_whistle,
            .spurious_dragon => self.spurious_dragon,
            .byzantium => self.byzantium,
            .constantinople => self.constantinople,
            .petersburg => self.petersburg,
            .istanbul => self.istanbul,
            .muir_glacier => self.muir_glacier,
            .berlin => self.berlin,
            .london => self.london,
            .arrow_glacier => self.arrow_glacier,
            .gray_glacier => self.gray_glacier,
            .paris => self.paris,
            .shanghai => self.shanghai,
            .cancun => self.cancun,
            .prague => self.prague,
        };
    }

    /// Get the latest activated hardfork
    pub fn getLatest(self: HardforkBlocks) Hardfork {
        // Check in reverse order (newest first)
        if (self.prague != null) return .prague;
        if (self.cancun != null) return .cancun;
        if (self.shanghai != null) return .shanghai;
        if (self.paris != null) return .paris;
        if (self.gray_glacier != null) return .gray_glacier;
        if (self.arrow_glacier != null) return .arrow_glacier;
        if (self.london != null) return .london;
        if (self.berlin != null) return .berlin;
        if (self.muir_glacier != null) return .muir_glacier;
        if (self.istanbul != null) return .istanbul;
        if (self.petersburg != null) return .petersburg;
        if (self.constantinople != null) return .constantinople;
        if (self.byzantium != null) return .byzantium;
        if (self.spurious_dragon != null) return .spurious_dragon;
        if (self.tangerine_whistle != null) return .tangerine_whistle;
        if (self.dao != null) return .dao;
        if (self.homestead != null) return .homestead;
        return .chainstart;
    }
};

/// Chain type - represents an Ethereum chain configuration
pub const Chain = struct {
    id: ChainId.ChainId,
    name: []const u8,
    short_name: ?[]const u8 = null,
    native_currency: NativeCurrency,
    rpc_urls: []const []const u8,
    websocket_urls: []const []const u8 = &[_][]const u8{},
    explorers: []const Explorer = &[_]Explorer{},
    testnet: bool = false,
    l2: bool = false,
    l1_chain_id: ?ChainId.ChainId = null,
    block_time: u64 = 12, // seconds
    gas_limit: u64 = 30_000_000,
    hardforks: HardforkBlocks = .{},
    latest_hardfork: Hardfork = .cancun,
};

/// ETH native currency (reusable)
const ETH_CURRENCY: NativeCurrency = .{
    .name = "Ether",
    .symbol = "ETH",
    .decimals = 18,
};

/// MATIC native currency
const MATIC_CURRENCY: NativeCurrency = .{
    .name = "MATIC",
    .symbol = "MATIC",
    .decimals = 18,
};

/// POL native currency (Polygon renamed)
const POL_CURRENCY: NativeCurrency = .{
    .name = "POL",
    .symbol = "POL",
    .decimals = 18,
};

/// BNB native currency
const BNB_CURRENCY: NativeCurrency = .{
    .name = "BNB",
    .symbol = "BNB",
    .decimals = 18,
};

/// AVAX native currency
const AVAX_CURRENCY: NativeCurrency = .{
    .name = "Avalanche",
    .symbol = "AVAX",
    .decimals = 18,
};

/// FTM native currency
const FTM_CURRENCY: NativeCurrency = .{
    .name = "Fantom",
    .symbol = "FTM",
    .decimals = 18,
};

/// xDAI native currency
const XDAI_CURRENCY: NativeCurrency = .{
    .name = "xDAI",
    .symbol = "xDAI",
    .decimals = 18,
};

/// GLMR native currency
const GLMR_CURRENCY: NativeCurrency = .{
    .name = "Glimmer",
    .symbol = "GLMR",
    .decimals = 18,
};

/// DEV native currency (Moonbase)
const DEV_CURRENCY: NativeCurrency = .{
    .name = "DEV",
    .symbol = "DEV",
    .decimals = 18,
};

/// CELO native currency
const CELO_CURRENCY: NativeCurrency = .{
    .name = "CELO",
    .symbol = "CELO",
    .decimals = 18,
};

// ============================================================================
// Well-known Chain Configurations
// ============================================================================

// Ethereum Mainnet
pub const MAINNET: Chain = .{
    .id = ChainId.MAINNET,
    .name = "Ethereum",
    .short_name = "eth",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://eth.llamarpc.com"},
    .websocket_urls = &[_][]const u8{ "wss://ethereum-rpc.publicnode.com", "wss://eth.drpc.org" },
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://etherscan.io" }},
    .testnet = false,
    .block_time = 12,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .chainstart = 0,
        .homestead = 1_150_000,
        .dao = 1_920_000,
        .tangerine_whistle = 2_463_000,
        .spurious_dragon = 2_675_000,
        .byzantium = 4_370_000,
        .constantinople = 7_280_000,
        .petersburg = 7_280_000,
        .istanbul = 9_069_000,
        .muir_glacier = 9_200_000,
        .berlin = 12_244_000,
        .london = 12_965_000,
        .arrow_glacier = 13_773_000,
        .gray_glacier = 15_050_000,
        .paris = 15_537_394,
        .shanghai = 17_034_870,
        .cancun = 19_426_587,
    },
};

// Goerli Testnet (deprecated)
pub const GOERLI: Chain = .{
    .id = ChainId.GOERLI,
    .name = "Goerli",
    .short_name = "gor",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.ankr.com/eth_goerli"},
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://goerli.etherscan.io" }},
    .testnet = true,
    .block_time = 12,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Sepolia Testnet
pub const SEPOLIA: Chain = .{
    .id = ChainId.SEPOLIA,
    .name = "Sepolia",
    .short_name = "sep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.sepolia.org"},
    .websocket_urls = &[_][]const u8{"wss://ethereum-sepolia-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://sepolia.etherscan.io" }},
    .testnet = true,
    .block_time = 12,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .chainstart = 0,
        .london = 0,
        .paris = 1_735_371,
        .shanghai = 2_990_908,
        .cancun = 5_187_023,
    },
};

// Holesky Testnet
pub const HOLESKY: Chain = .{
    .id = ChainId.HOLESKY,
    .name = "Holesky",
    .short_name = "holesky",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://ethereum-holesky.publicnode.com"},
    .websocket_urls = &[_][]const u8{"wss://ethereum-holesky-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://holesky.etherscan.io" }},
    .testnet = true,
    .block_time = 12,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .chainstart = 0,
        .paris = 0,
        .shanghai = 6698,
        .cancun = 894733,
    },
};

// Optimism Mainnet
pub const OPTIMISM: Chain = .{
    .id = ChainId.OPTIMISM,
    .name = "OP Mainnet",
    .short_name = "oeth",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://mainnet.optimism.io"},
    .websocket_urls = &[_][]const u8{"wss://optimism-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://optimistic.etherscan.io" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 117387812 },
};

// Optimism Sepolia
pub const OPTIMISM_SEPOLIA: Chain = .{
    .id = 11155420,
    .name = "OP Sepolia",
    .short_name = "opsep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia.optimism.io"},
    .websocket_urls = &[_][]const u8{"wss://optimism-sepolia-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Etherscan", .url = "https://sepolia-optimism.etherscan.io" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 8403392 },
};

// Arbitrum One
pub const ARBITRUM: Chain = .{
    .id = ChainId.ARBITRUM,
    .name = "Arbitrum One",
    .short_name = "arb1",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://arb1.arbitrum.io/rpc"},
    .websocket_urls = &[_][]const u8{"wss://arbitrum-one-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Arbiscan", .url = "https://arbiscan.io" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 1,
    .gas_limit = 32_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 189153517 },
};

// Arbitrum Sepolia
pub const ARBITRUM_SEPOLIA: Chain = .{
    .id = 421614,
    .name = "Arbitrum Sepolia",
    .short_name = "arbsep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia-rollup.arbitrum.io/rpc"},
    .websocket_urls = &[_][]const u8{"wss://arbitrum-sepolia-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Arbiscan", .url = "https://sepolia.arbiscan.io" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 1,
    .gas_limit = 32_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 33772963 },
};

// Base Mainnet
pub const BASE: Chain = .{
    .id = ChainId.BASE,
    .name = "Base",
    .short_name = "base",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://mainnet.base.org"},
    .websocket_urls = &[_][]const u8{"wss://base-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Basescan", .url = "https://basescan.org" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 11188936 },
};

// Base Sepolia
pub const BASE_SEPOLIA: Chain = .{
    .id = 84532,
    .name = "Base Sepolia",
    .short_name = "basesep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia.base.org"},
    .websocket_urls = &[_][]const u8{"wss://base-sepolia-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Basescan", .url = "https://sepolia.basescan.org" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 6383256 },
};

// Polygon Mainnet
pub const POLYGON: Chain = .{
    .id = ChainId.POLYGON,
    .name = "Polygon",
    .short_name = "matic",
    .native_currency = POL_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://polygon-rpc.com"},
    .websocket_urls = &[_][]const u8{"wss://polygon-bor-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Polygonscan", .url = "https://polygonscan.com" }},
    .testnet = false,
    .l2 = false,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .london = 23850000,
        .cancun = 54876000,
    },
};

// Polygon Amoy Testnet
pub const POLYGON_AMOY: Chain = .{
    .id = 80002,
    .name = "Polygon Amoy",
    .short_name = "polyamoy",
    .native_currency = POL_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc-amoy.polygon.technology"},
    .websocket_urls = &[_][]const u8{"wss://polygon-amoy-bor-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Polygonscan", .url = "https://amoy.polygonscan.com" }},
    .testnet = true,
    .l2 = false,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{ .cancun = 6594854 },
};

// Linea Mainnet
pub const LINEA: Chain = .{
    .id = 59144,
    .name = "Linea",
    .short_name = "linea",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.linea.build"},
    .explorers = &[_]Explorer{.{ .name = "Lineascan", .url = "https://lineascan.build" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Linea Sepolia
pub const LINEA_SEPOLIA: Chain = .{
    .id = 59141,
    .name = "Linea Sepolia",
    .short_name = "lineasep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.sepolia.linea.build"},
    .explorers = &[_]Explorer{.{ .name = "Lineascan", .url = "https://sepolia.lineascan.build" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// zkSync Era Mainnet
pub const ZKSYNC: Chain = .{
    .id = 324,
    .name = "zkSync Era",
    .short_name = "zksync",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://mainnet.era.zksync.io"},
    .websocket_urls = &[_][]const u8{"wss://mainnet.era.zksync.io/ws"},
    .explorers = &[_]Explorer{.{ .name = "zkSync Explorer", .url = "https://explorer.zksync.io" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 1,
    .gas_limit = 80_000_000,
    .latest_hardfork = .cancun,
};

// zkSync Era Sepolia
pub const ZKSYNC_SEPOLIA: Chain = .{
    .id = 300,
    .name = "zkSync Era Sepolia",
    .short_name = "zksyncsep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia.era.zksync.dev"},
    .websocket_urls = &[_][]const u8{"wss://sepolia.era.zksync.dev/ws"},
    .explorers = &[_]Explorer{.{ .name = "zkSync Explorer", .url = "https://sepolia.explorer.zksync.io" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 1,
    .gas_limit = 80_000_000,
    .latest_hardfork = .cancun,
};

// Scroll Mainnet
pub const SCROLL: Chain = .{
    .id = 534352,
    .name = "Scroll",
    .short_name = "scroll",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.scroll.io"},
    .explorers = &[_]Explorer{.{ .name = "Scrollscan", .url = "https://scrollscan.com" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 3,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Scroll Sepolia
pub const SCROLL_SEPOLIA: Chain = .{
    .id = 534351,
    .name = "Scroll Sepolia",
    .short_name = "scrollsep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia-rpc.scroll.io"},
    .explorers = &[_]Explorer{.{ .name = "Scrollscan", .url = "https://sepolia.scrollscan.com" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 3,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Blast Mainnet
pub const BLAST: Chain = .{
    .id = 81457,
    .name = "Blast",
    .short_name = "blast",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.blast.io"},
    .explorers = &[_]Explorer{.{ .name = "Blastscan", .url = "https://blastscan.io" }},
    .testnet = false,
    .l2 = true,
    .l1_chain_id = ChainId.MAINNET,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Blast Sepolia
pub const BLAST_SEPOLIA: Chain = .{
    .id = 168587773,
    .name = "Blast Sepolia",
    .short_name = "blastsep",
    .native_currency = ETH_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://sepolia.blast.io"},
    .explorers = &[_]Explorer{.{ .name = "Blastscan", .url = "https://sepolia.blastscan.io" }},
    .testnet = true,
    .l2 = true,
    .l1_chain_id = ChainId.SEPOLIA,
    .block_time = 2,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Avalanche C-Chain
pub const AVALANCHE: Chain = .{
    .id = 43114,
    .name = "Avalanche C-Chain",
    .short_name = "avax",
    .native_currency = AVAX_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://api.avax.network/ext/bc/C/rpc"},
    .websocket_urls = &[_][]const u8{"wss://avalanche-c-chain-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Snowtrace", .url = "https://snowtrace.io" }},
    .testnet = false,
    .l2 = false,
    .block_time = 2,
    .gas_limit = 15_000_000,
    .latest_hardfork = .cancun,
};

// Avalanche Fuji Testnet
pub const AVALANCHE_FUJI: Chain = .{
    .id = 43113,
    .name = "Avalanche Fuji",
    .short_name = "fuji",
    .native_currency = AVAX_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://api.avax-test.network/ext/bc/C/rpc"},
    .websocket_urls = &[_][]const u8{"wss://avalanche-fuji-c-chain-rpc.publicnode.com"},
    .explorers = &[_]Explorer{.{ .name = "Snowtrace", .url = "https://testnet.snowtrace.io" }},
    .testnet = true,
    .l2 = false,
    .block_time = 2,
    .gas_limit = 15_000_000,
    .latest_hardfork = .cancun,
};

// BSC Mainnet
pub const BSC: Chain = .{
    .id = 56,
    .name = "BNB Smart Chain",
    .short_name = "bnb",
    .native_currency = BNB_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://bsc-dataseed.binance.org"},
    .explorers = &[_]Explorer{.{ .name = "BscScan", .url = "https://bscscan.com" }},
    .testnet = false,
    .l2 = false,
    .block_time = 3,
    .gas_limit = 140_000_000,
    .latest_hardfork = .cancun,
};

// BSC Testnet
pub const BSC_TESTNET: Chain = .{
    .id = 97,
    .name = "BNB Smart Chain Testnet",
    .short_name = "bnbt",
    .native_currency = BNB_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://data-seed-prebsc-1-s1.binance.org:8545"},
    .explorers = &[_]Explorer{.{ .name = "BscScan", .url = "https://testnet.bscscan.com" }},
    .testnet = true,
    .l2 = false,
    .block_time = 3,
    .gas_limit = 140_000_000,
    .latest_hardfork = .cancun,
};

// Fantom Opera
pub const FANTOM: Chain = .{
    .id = 250,
    .name = "Fantom Opera",
    .short_name = "ftm",
    .native_currency = FTM_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.ftm.tools"},
    .explorers = &[_]Explorer{.{ .name = "FTMScan", .url = "https://ftmscan.com" }},
    .testnet = false,
    .l2 = false,
    .block_time = 1,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Fantom Testnet
pub const FANTOM_TESTNET: Chain = .{
    .id = 4002,
    .name = "Fantom Testnet",
    .short_name = "tftm",
    .native_currency = FTM_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.testnet.fantom.network"},
    .explorers = &[_]Explorer{.{ .name = "FTMScan", .url = "https://testnet.ftmscan.com" }},
    .testnet = true,
    .l2 = false,
    .block_time = 1,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
};

// Gnosis Chain
pub const GNOSIS: Chain = .{
    .id = 100,
    .name = "Gnosis",
    .short_name = "gno",
    .native_currency = XDAI_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.gnosischain.com"},
    .explorers = &[_]Explorer{.{ .name = "Gnosisscan", .url = "https://gnosisscan.io" }},
    .testnet = false,
    .l2 = false,
    .block_time = 5,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .constantinople = 10740904,
        .istanbul = 12095200,
        .berlin = 19040000,
        .london = 19040000,
        .paris = 26138654,
        .shanghai = 29794725,
        .cancun = 35800000,
    },
};

// Chiado Testnet (Gnosis)
pub const CHIADO: Chain = .{
    .id = 10200,
    .name = "Chiado",
    .short_name = "chiado",
    .native_currency = XDAI_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.chiadochain.net"},
    .explorers = &[_]Explorer{.{ .name = "Gnosisscan", .url = "https://gnosis-chiado.blockscout.com" }},
    .testnet = true,
    .l2 = false,
    .block_time = 5,
    .gas_limit = 30_000_000,
    .latest_hardfork = .cancun,
    .hardforks = .{
        .shanghai = 7862000,
        .cancun = 11907388,
    },
};

// Moonbeam
pub const MOONBEAM: Chain = .{
    .id = 1284,
    .name = "Moonbeam",
    .short_name = "mbeam",
    .native_currency = GLMR_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.api.moonbeam.network"},
    .explorers = &[_]Explorer{.{ .name = "Moonscan", .url = "https://moonbeam.moonscan.io" }},
    .testnet = false,
    .l2 = false,
    .block_time = 12,
    .gas_limit = 15_000_000,
    .latest_hardfork = .cancun,
};

// Moonbase Alpha
pub const MOONBASE_ALPHA: Chain = .{
    .id = 1287,
    .name = "Moonbase Alpha",
    .short_name = "mbase",
    .native_currency = DEV_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://rpc.api.moonbase.moonbeam.network"},
    .explorers = &[_]Explorer{.{ .name = "Moonscan", .url = "https://moonbase.moonscan.io" }},
    .testnet = true,
    .l2 = false,
    .block_time = 12,
    .gas_limit = 15_000_000,
    .latest_hardfork = .cancun,
};

// Celo Mainnet
pub const CELO: Chain = .{
    .id = 42220,
    .name = "Celo",
    .short_name = "celo",
    .native_currency = CELO_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://forno.celo.org"},
    .explorers = &[_]Explorer{.{ .name = "Celoscan", .url = "https://celoscan.io" }},
    .testnet = false,
    .l2 = false,
    .block_time = 5,
    .gas_limit = 50_000_000,
    .latest_hardfork = .cancun,
};

// Celo Alfajores Testnet
pub const CELO_ALFAJORES: Chain = .{
    .id = 44787,
    .name = "Celo Alfajores",
    .short_name = "celoalf",
    .native_currency = CELO_CURRENCY,
    .rpc_urls = &[_][]const u8{"https://alfajores-forno.celo-testnet.org"},
    .explorers = &[_]Explorer{.{ .name = "Celoscan", .url = "https://alfajores.celoscan.io" }},
    .testnet = true,
    .l2 = false,
    .block_time = 5,
    .gas_limit = 50_000_000,
    .latest_hardfork = .cancun,
};

// ============================================================================
// All Chains Array (for iteration)
// ============================================================================

/// Array of all well-known chains
pub const ALL_CHAINS: []const Chain = &[_]Chain{
    MAINNET,
    GOERLI,
    SEPOLIA,
    HOLESKY,
    OPTIMISM,
    OPTIMISM_SEPOLIA,
    ARBITRUM,
    ARBITRUM_SEPOLIA,
    BASE,
    BASE_SEPOLIA,
    POLYGON,
    POLYGON_AMOY,
    LINEA,
    LINEA_SEPOLIA,
    ZKSYNC,
    ZKSYNC_SEPOLIA,
    SCROLL,
    SCROLL_SEPOLIA,
    BLAST,
    BLAST_SEPOLIA,
    AVALANCHE,
    AVALANCHE_FUJI,
    BSC,
    BSC_TESTNET,
    FANTOM,
    FANTOM_TESTNET,
    GNOSIS,
    CHIADO,
    MOONBEAM,
    MOONBASE_ALPHA,
    CELO,
    CELO_ALFAJORES,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create Chain from ID
/// Returns null if chain ID is not recognized
pub fn fromId(id: ChainId.ChainId) ?Chain {
    return switch (id) {
        // Ethereum
        ChainId.MAINNET => MAINNET,
        ChainId.GOERLI => GOERLI,
        ChainId.SEPOLIA => SEPOLIA,
        ChainId.HOLESKY => HOLESKY,
        // Optimism
        ChainId.OPTIMISM => OPTIMISM,
        11155420 => OPTIMISM_SEPOLIA,
        // Arbitrum
        ChainId.ARBITRUM => ARBITRUM,
        421614 => ARBITRUM_SEPOLIA,
        // Base
        ChainId.BASE => BASE,
        84532 => BASE_SEPOLIA,
        // Polygon
        ChainId.POLYGON => POLYGON,
        80002 => POLYGON_AMOY,
        // Linea
        59144 => LINEA,
        59141 => LINEA_SEPOLIA,
        // zkSync
        324 => ZKSYNC,
        300 => ZKSYNC_SEPOLIA,
        // Scroll
        534352 => SCROLL,
        534351 => SCROLL_SEPOLIA,
        // Blast
        81457 => BLAST,
        168587773 => BLAST_SEPOLIA,
        // Avalanche
        43114 => AVALANCHE,
        43113 => AVALANCHE_FUJI,
        // BSC
        56 => BSC,
        97 => BSC_TESTNET,
        // Fantom
        250 => FANTOM,
        4002 => FANTOM_TESTNET,
        // Gnosis
        100 => GNOSIS,
        10200 => CHIADO,
        // Moonbeam
        1284 => MOONBEAM,
        1287 => MOONBASE_ALPHA,
        // Celo
        42220 => CELO,
        44787 => CELO_ALFAJORES,
        else => null,
    };
}

/// Alias for fromId - lookup chain by ID
pub const byId = fromId;

/// Create custom Chain configuration
pub fn from(config: Chain) Chain {
    return config;
}

// ============================================================================
// Accessors
// ============================================================================

/// Get chain name
pub fn getName(chain: Chain) []const u8 {
    return chain.name;
}

/// Get chain short name
pub fn getShortName(chain: Chain) ?[]const u8 {
    return chain.short_name;
}

/// Get native currency symbol
pub fn getSymbol(chain: Chain) []const u8 {
    return chain.native_currency.symbol;
}

/// Get first RPC URL (if available)
pub fn getRpcUrl(chain: Chain) ?[]const u8 {
    if (chain.rpc_urls.len > 0) {
        return chain.rpc_urls[0];
    }
    return null;
}

/// Get first WebSocket URL (if available)
pub fn getWebsocketUrl(chain: Chain) ?[]const u8 {
    if (chain.websocket_urls.len > 0) {
        return chain.websocket_urls[0];
    }
    return null;
}

/// Get first explorer URL (if available)
pub fn getExplorerUrl(chain: Chain) ?[]const u8 {
    if (chain.explorers.len > 0) {
        return chain.explorers[0].url;
    }
    return null;
}

/// Get block time in seconds
pub fn getBlockTime(chain: Chain) u64 {
    return chain.block_time;
}

/// Get gas limit
pub fn getGasLimit(chain: Chain) u64 {
    return chain.gas_limit;
}

/// Get L1 chain (for L2s)
pub fn getL1Chain(chain: Chain) ?Chain {
    if (chain.l1_chain_id) |l1_id| {
        return fromId(l1_id);
    }
    return null;
}

// ============================================================================
// Hardfork Functions
// ============================================================================

/// Get the latest hardfork for this chain
pub fn getLatestHardfork(chain: Chain) Hardfork {
    return chain.latest_hardfork;
}

/// Get block number for a specific hardfork
/// Returns null if the hardfork is not supported on this chain
pub fn getHardforkBlock(chain: Chain, hf: Hardfork) ?u64 {
    return chain.hardforks.get(hf);
}

/// Check if a chain supports a specific hardfork
pub fn supportsHardfork(chain: Chain, hf: Hardfork) bool {
    return chain.hardforks.get(hf) != null;
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if chain is a testnet
pub fn isTestnet(chain: Chain) bool {
    return chain.testnet;
}

/// Check if chain is an L2
pub fn isL2(chain: Chain) bool {
    return chain.l2;
}

/// Check if chain is mainnet
pub fn isMainnet(chain: Chain) bool {
    return chain.id == ChainId.MAINNET;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two chains are equal (by ID)
pub fn equals(a: Chain, b: Chain) bool {
    return a.id == b.id;
}

// ============================================================================
// Tests
// ============================================================================

test "Chain.fromId returns known chains" {
    const mainnet = fromId(1);
    try std.testing.expect(mainnet != null);
    try std.testing.expectEqualStrings("Ethereum", mainnet.?.name);
    try std.testing.expectEqual(@as(ChainId.ChainId, 1), mainnet.?.id);

    const sepolia = fromId(11155111);
    try std.testing.expect(sepolia != null);
    try std.testing.expectEqualStrings("Sepolia", sepolia.?.name);
}

test "Chain.fromId returns null for unknown chain" {
    const unknown = fromId(999999);
    try std.testing.expect(unknown == null);
}

test "Chain.isTestnet" {
    try std.testing.expect(!isTestnet(MAINNET));
    try std.testing.expect(isTestnet(GOERLI));
    try std.testing.expect(isTestnet(SEPOLIA));
    try std.testing.expect(isTestnet(HOLESKY));
    try std.testing.expect(!isTestnet(OPTIMISM));
}

test "Chain.isL2" {
    try std.testing.expect(!isL2(MAINNET));
    try std.testing.expect(!isL2(SEPOLIA));
    try std.testing.expect(isL2(OPTIMISM));
    try std.testing.expect(isL2(ARBITRUM));
    try std.testing.expect(isL2(BASE));
}

test "Chain.getL1Chain" {
    const l1 = getL1Chain(OPTIMISM);
    try std.testing.expect(l1 != null);
    try std.testing.expectEqual(ChainId.MAINNET, l1.?.id);

    const mainnet_l1 = getL1Chain(MAINNET);
    try std.testing.expect(mainnet_l1 == null);
}

test "Chain.getName" {
    try std.testing.expectEqualStrings("Ethereum", getName(MAINNET));
    try std.testing.expectEqualStrings("OP Mainnet", getName(OPTIMISM));
}

test "Chain.getSymbol" {
    try std.testing.expectEqualStrings("ETH", getSymbol(MAINNET));
    try std.testing.expectEqualStrings("POL", getSymbol(POLYGON));
}

test "Chain.getRpcUrl" {
    const url = getRpcUrl(MAINNET);
    try std.testing.expect(url != null);
    try std.testing.expect(std.mem.startsWith(u8, url.?, "https://"));
}

test "Chain.getExplorerUrl" {
    const url = getExplorerUrl(MAINNET);
    try std.testing.expect(url != null);
    try std.testing.expectEqualStrings("https://etherscan.io", url.?);
}

test "Chain.getBlockTime" {
    try std.testing.expectEqual(@as(u64, 12), getBlockTime(MAINNET));
    try std.testing.expectEqual(@as(u64, 2), getBlockTime(OPTIMISM));
    try std.testing.expectEqual(@as(u64, 1), getBlockTime(ARBITRUM));
}

test "Chain.equals" {
    try std.testing.expect(equals(MAINNET, MAINNET));
    try std.testing.expect(!equals(MAINNET, SEPOLIA));
}

test "Chain.isMainnet" {
    try std.testing.expect(isMainnet(MAINNET));
    try std.testing.expect(!isMainnet(SEPOLIA));
    try std.testing.expect(!isMainnet(OPTIMISM));
}

test "Chain constant values are correct" {
    try std.testing.expectEqual(@as(ChainId.ChainId, 1), MAINNET.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 5), GOERLI.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 11155111), SEPOLIA.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 17000), HOLESKY.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 10), OPTIMISM.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 42161), ARBITRUM.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 8453), BASE.id);
    try std.testing.expectEqual(@as(ChainId.ChainId, 137), POLYGON.id);
}

test "Chain.fromId returns all well-known chains" {
    // L2s
    try std.testing.expect(fromId(324) != null); // zkSync
    try std.testing.expect(fromId(59144) != null); // Linea
    try std.testing.expect(fromId(534352) != null); // Scroll
    try std.testing.expect(fromId(81457) != null); // Blast
    // Alt L1s
    try std.testing.expect(fromId(43114) != null); // Avalanche
    try std.testing.expect(fromId(56) != null); // BSC
    try std.testing.expect(fromId(250) != null); // Fantom
    try std.testing.expect(fromId(100) != null); // Gnosis
    try std.testing.expect(fromId(1284) != null); // Moonbeam
    try std.testing.expect(fromId(42220) != null); // Celo
}

test "Chain.byId is alias for fromId" {
    const chain1 = fromId(1);
    const chain2 = byId(1);
    try std.testing.expect(chain1 != null);
    try std.testing.expect(chain2 != null);
    try std.testing.expect(equals(chain1.?, chain2.?));
}

test "Chain.getWebsocketUrl" {
    const ws_url = getWebsocketUrl(MAINNET);
    try std.testing.expect(ws_url != null);
    try std.testing.expect(std.mem.startsWith(u8, ws_url.?, "wss://"));

    // Chain without websocket
    const linea_ws = getWebsocketUrl(LINEA);
    try std.testing.expect(linea_ws == null);
}

test "Chain.getLatestHardfork" {
    try std.testing.expectEqual(Hardfork.cancun, getLatestHardfork(MAINNET));
    try std.testing.expectEqual(Hardfork.cancun, getLatestHardfork(SEPOLIA));
    try std.testing.expectEqual(Hardfork.cancun, getLatestHardfork(OPTIMISM));
}

test "Chain.getHardforkBlock" {
    // Mainnet hardfork blocks
    try std.testing.expectEqual(@as(?u64, 12_965_000), getHardforkBlock(MAINNET, .london));
    try std.testing.expectEqual(@as(?u64, 15_537_394), getHardforkBlock(MAINNET, .paris));
    try std.testing.expectEqual(@as(?u64, 19_426_587), getHardforkBlock(MAINNET, .cancun));

    // Non-existent hardfork
    try std.testing.expectEqual(@as(?u64, null), getHardforkBlock(MAINNET, .prague));
}

test "Chain.supportsHardfork" {
    try std.testing.expect(supportsHardfork(MAINNET, .london));
    try std.testing.expect(supportsHardfork(MAINNET, .paris));
    try std.testing.expect(supportsHardfork(MAINNET, .cancun));
    try std.testing.expect(!supportsHardfork(MAINNET, .prague));
}

test "Chain.ALL_CHAINS contains expected count" {
    try std.testing.expectEqual(@as(usize, 32), ALL_CHAINS.len);
}

test "Chain.ALL_CHAINS can be iterated" {
    var mainnet_count: usize = 0;
    var l2_count: usize = 0;
    var testnet_count: usize = 0;

    for (ALL_CHAINS) |chain| {
        if (chain.id == ChainId.MAINNET) mainnet_count += 1;
        if (chain.l2) l2_count += 1;
        if (chain.testnet) testnet_count += 1;
    }

    try std.testing.expectEqual(@as(usize, 1), mainnet_count);
    try std.testing.expect(l2_count > 0);
    try std.testing.expect(testnet_count > 0);
}

test "HardforkBlocks.get returns correct values" {
    const hf = HardforkBlocks{
        .london = 100,
        .paris = 200,
        .cancun = 300,
    };

    try std.testing.expectEqual(@as(?u64, 100), hf.get(.london));
    try std.testing.expectEqual(@as(?u64, 200), hf.get(.paris));
    try std.testing.expectEqual(@as(?u64, 300), hf.get(.cancun));
    try std.testing.expectEqual(@as(?u64, null), hf.get(.homestead));
}

test "HardforkBlocks.getLatest returns newest hardfork" {
    const hf1 = HardforkBlocks{ .london = 100 };
    try std.testing.expectEqual(Hardfork.london, hf1.getLatest());

    const hf2 = HardforkBlocks{ .london = 100, .cancun = 200 };
    try std.testing.expectEqual(Hardfork.cancun, hf2.getLatest());

    const hf3 = HardforkBlocks{};
    try std.testing.expectEqual(Hardfork.chainstart, hf3.getLatest());
}

test "Chain native currencies are correct" {
    try std.testing.expectEqualStrings("ETH", MAINNET.native_currency.symbol);
    try std.testing.expectEqualStrings("ETH", OPTIMISM.native_currency.symbol);
    try std.testing.expectEqualStrings("POL", POLYGON.native_currency.symbol);
    try std.testing.expectEqualStrings("BNB", BSC.native_currency.symbol);
    try std.testing.expectEqualStrings("AVAX", AVALANCHE.native_currency.symbol);
    try std.testing.expectEqualStrings("FTM", FANTOM.native_currency.symbol);
    try std.testing.expectEqualStrings("xDAI", GNOSIS.native_currency.symbol);
    try std.testing.expectEqualStrings("GLMR", MOONBEAM.native_currency.symbol);
    try std.testing.expectEqualStrings("CELO", CELO.native_currency.symbol);
}

test "Chain L2s have correct L1 chain IDs" {
    try std.testing.expectEqual(@as(?ChainId.ChainId, ChainId.MAINNET), OPTIMISM.l1_chain_id);
    try std.testing.expectEqual(@as(?ChainId.ChainId, ChainId.MAINNET), ARBITRUM.l1_chain_id);
    try std.testing.expectEqual(@as(?ChainId.ChainId, ChainId.MAINNET), BASE.l1_chain_id);
    try std.testing.expectEqual(@as(?ChainId.ChainId, ChainId.MAINNET), ZKSYNC.l1_chain_id);
    try std.testing.expectEqual(@as(?ChainId.ChainId, ChainId.SEPOLIA), OPTIMISM_SEPOLIA.l1_chain_id);
    try std.testing.expectEqual(@as(?ChainId.ChainId, null), MAINNET.l1_chain_id);
}

test "Chain testnets are marked correctly" {
    // Mainnets
    try std.testing.expect(!MAINNET.testnet);
    try std.testing.expect(!OPTIMISM.testnet);
    try std.testing.expect(!BSC.testnet);
    // Testnets
    try std.testing.expect(SEPOLIA.testnet);
    try std.testing.expect(HOLESKY.testnet);
    try std.testing.expect(OPTIMISM_SEPOLIA.testnet);
    try std.testing.expect(BSC_TESTNET.testnet);
}
