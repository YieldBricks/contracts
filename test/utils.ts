// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function identityTypedMessage(eip712Domain: any, identity: any) {
  return {
    types: {
      Identity: [
        { name: "wallet", type: "address" },
        { name: "signer", type: "address" },
        { name: "emailHash", type: "bytes32" },
        { name: "expiration", type: "uint256" },
        { name: "country", type: "uint16" },
      ],
    },
    domain: {
      name: eip712Domain.name,
      version: eip712Domain.version,
      chainId: eip712Domain.chainId,
      verifyingContract: eip712Domain.verifyingContract,
    },
    identity,
  };
}

export const DAY = 60 * 60 * 24;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
