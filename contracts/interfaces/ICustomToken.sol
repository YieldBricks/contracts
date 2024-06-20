pragma solidity >=0.6.9 <0.9.0;

interface ArbitrumEnabledToken {
    /// @notice should return `0xb1` if token is enabled for arbitrum gateways
    /// @dev Previous implmentation used to return `uint8(0xa4b1)`, however that causes compile time error in Solidity 0.8. due to type mismatch.
    ///      In current version `uint8(0xb1)` shall be returned, which results in no change as that's the same value as truncated `uint8(0xa4b1)`.
    function isArbitrumEnabled() external view returns (uint8);
}

/**
 * @title Minimum expected interface for L1 custom token (see TestCustomTokenL1.sol for an example implementation)
 */
interface ICustomToken is ArbitrumEnabledToken {
    /**
     * @notice Should make an external call to EthERC20Bridge.registerCustomL2Token
     */
    function registerTokenOnL2(
        address l2CustomTokenAddress,
        uint256 maxSubmissionCostForCustomBridge,
        uint256 maxSubmissionCostForRouter,
        uint256 maxGasForCustomBridge,
        uint256 maxGasForRouter,
        uint256 gasPriceBid,
        uint256 valueForGateway,
        uint256 valueForRouter,
        address creditBackAddress
    ) external payable;
}

interface L1MintableToken is ICustomToken {
    function bridgeMint(address account, uint256 amount) external;
}

interface L1ReverseToken is L1MintableToken {
    function bridgeBurn(address account, uint256 amount) external;
}
