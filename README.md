# Escrowly — Web3 Freelance Escrow

React, JavaScript, Tailwind CSS, and ethers frontend for the existing Ethereum Sepolia escrow contract. The Solidity implementation and deployment are unchanged.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. Connect an Ethereum wallet on Sepolia. The existing root `.env` supplies server-side RPC configuration; the deployment artifact supplies the contract address. No root private key is used by the frontend.

```sh
npm run build
npm run preview
npm run lint
npm test
forge test
```

For the built application and its API, run `npm start` after building. See [frontend documentation](FRONTEND.md) for all routes, reference mapping, configuration, metadata storage, and browser lifecycle tests.

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/DeployFreelanceEscrow.s.sol:DeployFreelanceEscrow --rpc-url <your_rpc_url> --account <your_keystore_account>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
