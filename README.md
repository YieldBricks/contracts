# YieldBricks Smart Contracts

Open source implementation of YieldBricks in Solidity. This repository contains the core contracts of YieldBricks.

YieldBricks is a pioneering DeFi platform offering tokenized yield pools backed by real estate assets. We stand out as
one of the few platforms that are fully compliant with legal regulations, successfully navigating the complexities of
securities classification. Our mission is to democratize access to premium investment opportunities, making them
available to retail and small investors from the outset.

For learning more about how YieldBricks works, you can visit the
[YieldBricks documentation](https://yieldbricks.com/faq.html). The contract documentation can be found in the
[docs](./docs) folder.

## Getting started

YieldBricks uses [Hardhat](https://hardhat.org/) for development. Run the following command to install the dependencies:

```bash
yarn install
```

## Testing

The tests for YieldBricks are written in Solidity

### Run all tests

```bash
yarn test
```

### Run specific tests

A regular expression can be used to only run specific tests.

```bash
npx hardhat test <file-path> --grep <REGEX>
```

### Gas Measurement

To measure the gas usage of a test, run the following command:

```bash
yarn gas
```

There is also a special gas report test for the YBR snapshot feature, that can be run using:

```bash
yarn gas:ybr
```

## License

The license can be found in the [LICENSE](./LICENSE) file.
