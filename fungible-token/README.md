# DeLab TON fungible-token implementation

**IN ACTIVE DEVELOPMENT. DO NOT USE IN PRODUCTION!**

## Pre-requisites
```
Node JS v16.16.0 or newer
yarn 1.22.19 or newer
FunC v0.3.0 or newer
Fift [ Commit: 585c5d5b547b27294f9e8d97d43933a254bc93b8 ] or newer
```

## Build and deploy

1. Install node js dependencies
```bash
yarn install
```

2. Build smart contracts
```bash
yarn build
```

3. Create `metadata.json` file with token metadata
```json
{
    "name": "TestToken",
    "symbol": "TT",
    "decimals": "9",
    "description": "Some fungible-token",
    "image": "ipfs://bafkreicwu5getztwleuqlmhucc5m4wfnymmon3wiszhgsdgekiub2beizi"
}
```

4. Create `tonconfig.json` (now only supports wallet v3r2)
```json
{
    "mnemonic": "swim drive ... once mind",
    "workchain": 0,
    "subwalletId": 698983191,
    "addressFormat": "testnet",
    "toncenterapi": {
        "url": "https://testnet.toncenter.com/api/v2/",
        "key": "b0...c6e"
    }
}
```

5. Deploy token contract and mint tokens
```
yarn deploy mexample.json 10000000000000
```

## Scripts

- `yarn build:root` - builds token root smart contract
- `yarn build:wallet` - builds token wallet smart contract
- `yarn build` - builds both of token root and token wallet
- `yarn clean` - cleans build artifacts

- `yarn deploy` - deploys the token root smart contract (more info `-h`)
- `yarn rootctrl` - script to interacting with token root (more info `-h`)
- `yarn wallctrl` - script to interacting with token wallet (more info `-h`)

## License
GNU GENERAL PUBLIC LICENSE Version 3
