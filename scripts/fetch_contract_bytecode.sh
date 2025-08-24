#!/bin/bash

# Script to fetch real contract bytecode from Ethereum mainnet using Etherscan API
# Usage: ./fetch_contract_bytecode.sh <contract_address> [api_key]

set -e

CONTRACT_ADDRESS=$1
API_KEY=${2:-"YourApiKeyToken"}

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Usage: $0 <contract_address> [api_key]"
    echo "Examples:"
    echo "  $0 0xA0b86a33E6Ba3b2a6b14b1a0b5b2c1234567890  # USDC"
    echo "  $0 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  # WETH"
    echo "  $0 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D  # Uniswap V2 Router"
    exit 1
fi

# Remove 0x prefix if present
ADDRESS=${CONTRACT_ADDRESS#0x}

echo "Fetching bytecode for contract: 0x$ADDRESS"

# Fetch bytecode using Etherscan API
RESPONSE=$(curl -s "https://api.etherscan.io/api?module=proxy&action=eth_getCode&address=0x$ADDRESS&tag=latest&apikey=$API_KEY")

# Extract bytecode from JSON response
BYTECODE=$(echo "$RESPONSE" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)

if [ "$BYTECODE" = "0x" ] || [ -z "$BYTECODE" ]; then
    echo "Error: No bytecode found. This might be an EOA (externally owned account) or the address doesn't exist."
    exit 1
fi

# Remove 0x prefix from bytecode
BYTECODE_HEX=${BYTECODE#0x}

echo "Bytecode length: ${#BYTECODE_HEX} characters"
echo "Bytecode: $BYTECODE_HEX"

# Save to file
OUTPUT_FILE="contract_${ADDRESS}.hex"
echo "$BYTECODE_HEX" > "$OUTPUT_FILE"
echo "Saved bytecode to: $OUTPUT_FILE"

# Popular contract addresses for reference:
# USDC: 0xA0b86a33E6Ba3b2a6b14b1a0b5b2c1234567890
# WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2  
# USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7
# Uniswap V2 Router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
# Uniswap V3 Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564
# Chainlink ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
# ENS Registry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
# Compound cUSDC: 0x39AA39c021dfbaE8faC545936693aC917d5E7563