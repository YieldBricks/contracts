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
yarn hardhat run --network arbitrum migrations/05_whitelist_payment_tokens.ts

# Upgrades
yarn hardhat run --network arbitrum migrations/07_upgrade_compliance.ts
yarn hardhat run --network arbitrum migrations/09_upgrade_sale_manager.ts
yarn hardhat run --network arbitrum migrations/10_upgrade_oracle.ts
yarn hardhat run --network arbitrum migrations/11_upgrade_tiers.ts

# Escrow
yarn hardhat run --network arbitrum migrations/escrow/deploy_escrow.ts

0x4f65527DBD020aAEbe04bcf2Fb756323Aefbd7D0


# Verify

yarn verify --network arbitrum --contract contracts/Property.sol:Property 0xa66dd9aad8c78b7977c0686ab07160c6ae50d0a5 0xf29906A75255c04B6f9D522047979D289893bFf3 0x003eeD405A1EaFcf40e2bdEbbB086e80f7B28A1E 