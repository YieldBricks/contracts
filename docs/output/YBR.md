# YieldBricks (YBR) Token Contract
This contract is for the YieldBricks token, which is an ERC20 token with additional features.

# Solidity API

  ###
  walletFrozen

  Mapping to track frozen wallets

    ```solidity
    mapping(address => bool) walletFrozen
    ```

  - - -

  ###
  constructor

  Contract constructor - disabled due to upgradeability

    ```solidity
    constructor() public
    ```

  - - -

  ###
  initialize

  Initializes the contract

    ```solidity
    function initialize(address owner_) external
    ```

    ####
    Parameters | Name | Type | Description | | ---- | ---- | ----------- |
      |
      owner_
      |
      address
      |
      The initial owner of the contract.
      |

  - - -

  ###
  nonces

  Override the nonces function to return the nonce for a given owner

    ```solidity
    function nonces(address owner) public view returns (uint256)
    ```

    ####
    Parameters | Name | Type | Description | | ---- | ---- | ----------- |
      |
      owner
      |
      address
      |
      The address of the token holder
      |

  - - -

  ###
  pauseTransfers

  Pauses the contract, preventing transfers

    ```solidity
    function pauseTransfers(bool isPaused) public
    ```

  - - -

  ###
  freezeWallet

  Allows the owner to freeze or unfreeze a wallet

    ```solidity
    function freezeWallet(address wallet, bool isFrozen) public
    ```

    ####
    Parameters | Name | Type | Description | | ---- | ---- | ----------- |
      |
      wallet
      |
      address
      |
      The address of the wallet to freeze or unfreeze
      |
      |
      isFrozen
      |
      bool
      |
      A boolean indicating whether the wallet should be frozen or unfrozen
      |

  - - -

