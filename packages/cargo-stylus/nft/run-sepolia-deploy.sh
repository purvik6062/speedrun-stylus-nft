#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  source .env
fi

# Exit on error
set -e

# Arbitrum Sepolia RPC URL
SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Check for PRIVATE_KEY environment variable
if [[ -z "$PRIVATE_KEY" ]]; then
  echo "Error: PRIVATE_KEY environment variable is not set."
  echo "Please set your private key: export PRIVATE_KEY=your_private_key_here"
  exit 1
fi

# Required tools check
for cmd in cast cargo; do
  if ! command -v $cmd &> /dev/null; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

# Check RPC connection
echo "Checking connection to Arbitrum Sepolia..."
if ! curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}' \
  "$SEPOLIA_RPC_URL" > /dev/null; then
    echo "Error: Cannot connect to Arbitrum Sepolia RPC"
    exit 1
fi
echo "Connected to Arbitrum Sepolia!"

# (Optional) Deploy Cache Manager Contract
# echo "Deploying Cache Manager contract to Arbitrum Sepolia..."
# cache_deploy_output=$(cast send --private-key "$PRIVATE_KEY" \
#   --rpc-url "$SEPOLIA_RPC_URL" \
#   --create 0x60a06040523060805234801561001457600080fd5b50608051611d1c61003060003960006105260152611d1c6000f3fe)
# cache_manager_address=$(echo "$cache_deploy_output" | grep "contractAddress" | grep -oE '0x[a-fA-F0-9]{40}')
# if [[ -z "$cache_manager_address" ]]; then
#   echo "Error: Failed to extract Cache Manager contract address."
#   echo "$cache_deploy_output"
#   exit 1
# fi
# echo "Cache Manager contract deployed at address: $cache_manager_address"

# Deploy the NFT contract using cargo stylus
echo "Deploying the NFT contract using cargo stylus..."
deploy_output=$(cargo stylus deploy -e "$SEPOLIA_RPC_URL" --private-key "$PRIVATE_KEY" --no-verify 2>&1)

if [[ $? -ne 0 ]]; then
    echo "Error: NFT contract deployment failed"
    echo "Deploy output: $deploy_output"
    exit 1
fi

# Extract deployment transaction hash
deployment_tx=$(echo "$deploy_output" | grep -i "transaction\|tx" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)

# Extract deployed contract address
contract_address=$(echo "$deploy_output" | grep -i "contract\|deployed" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)

# Fallbacks
if [[ -z "$deployment_tx" ]]; then
    deployment_tx=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{64}' | head -1)
fi
if [[ -z "$contract_address" ]]; then
    contract_address=$(echo "$deploy_output" | grep -oE '0x[a-fA-F0-9]{40}' | head -1)
fi

# Validate results
if [[ -z "$deployment_tx" ]]; then
    echo "Error: Could not extract deployment transaction hash"
    echo "Deploy output: $deploy_output"
    exit 1
fi

echo "NFT contract deployed successfully!"
echo "Transaction hash: $deployment_tx"
echo "Contract address: $contract_address"

# Export ABI
echo "Generating ABI for the deployed NFT contract..."
cargo stylus export-abi > stylus-contract.abi

if [[ $? -ne 0 ]]; then
  echo "Error: ABI generation failed."
  exit 1
fi

echo "ABI generated and saved to stylus-contract.abi"

# Create build directory
mkdir -p build

# Save deployment info
echo "{
  \"network\": \"arbitrum-sepolia\",
  \"contract_address\": \"${contract_address:-'N/A'}\",
  \"transaction_hash\": \"$deployment_tx\",
  \"rpc_url\": \"$SEPOLIA_RPC_URL\",
  \"deployment_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
}" > build/nft-deployment-info.json

echo "Deployment info saved to build/nft-deployment-info.json"
echo "NFT contract successfully deployed on Arbitrum Sepolia!"
