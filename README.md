# Ckbox

Ckbox offers a set of tools to make it easy to interact with the Nervos CKB.

- CoinClient: Transfer the ckb. Issue and transfer the sUDT. Get the balance.
- ContractClient: Deploy and upgrade the contract.
- DaoClient: Depost, withdraw and unclock the DAO.

# Examples

[examples](https://github.com/felicityin/ckbox/tree/main/examples)

# Building

## Requirements
[Node.js](https://nodejs.org/en/)
[Yarn](https://yarnpkg.com/)
[node-gyp](https://github.com/nodejs/node-gyp)

```
sudo apt-get update
sudo apt install nodejs
npm install --global yarn
sudo apt install build-essential
```

## Install

```
yarn
```

## Build
```
yarn build
```

## Test
```
yarn test
```

## Format
```
yarn fmt
```

# Installing the package

Install from the command line:
```
$ yarn add @felicityin/ckbox
```

Install via package.json:
```
"@felicityin/ckbox": "^1.0.0"
```
