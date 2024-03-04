# YieldBricks Smart Contracts

## Usage

First, you need to setup the environment:

```sh
yarn install # install project dependencies
yarn hardhat vars setup # set MNEMONIC and INFURA_API_KEY
```

Then follow the normal development loop with:

```sh
yarn compile # compile the contracts
yarn test # run the tests
```

For all other commands, take a peek in the `package.json` file.

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
REPORT_GAS=true yarn test
```
