# YBR
yarn hardhat run --network mainnet migrations/ybr/ybr_eth.ts
yarn hardhat run --network arbitrum migrations/ybr/ybr_arb.ts
yarn hardhat run --network mainnet migrations/ybr/register_gateway.ts

# System
yarn hardhat run --network arbitrum migrations/00_initial_system.ts
yarn hardhat run --network arbitrum migrations/01_set_price_feeds.ts
yarn hardhat run --network arbitrum migrations/05_whitelist_payment_tokens.ts

# KYC Signer
yarn hardhat run --network arbitrum migrations/02_set_kyc_signer.ts

# Create Sale
yarn hardhat run --network arbitrum migrations/03_create_property_token.ts
yarn hardhat run --network arbitrum migrations/04_create_sale.ts

# Redeploy for Tiers V1
yarn hardhat run --network arbitrum migrations/06_redeploy_for_tiers_V1.ts
yarn hardhat run --network arbitrum migrations/01_set_price_feeds.ts
