# Ckbox

Ckbox provides convenient APIs to interact with the Nervos CKB.

- CoinClient: Transfer the ckb. Issue and transfer the sUDT. Get the balance.
- ContranctClient: Deploy and upgrade the contract.
- DaoClient: Depost, withdraw and unclock the DAO.

# Examples

[example](https://github.com/felicityin/ckbox/tree/main/examples)

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
