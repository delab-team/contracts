# DeLab TON fungible-token implementation

> :warning: IN ACTIVE DEVELOPMENT. DO NOT USE IN PRODUCTION!

## Project structure

| Path                            | Description  |
| ------------------------------- | ------------ |
| [`./func/`](./func/)            | FunC code    |
| [`./fift/`](./fift/)            | Fift scripts |
| [`./scheme.tlb`](./scheme.tlb)  | TL-B scheme  |

## Deploy process

1. Build smart contracts
```
make
```

2. Create a config based on `sample.conf`

3. Run deploy fift script (`--help` for more info)
```
fift -s ./fift/deploy.fif deploy.conf ./build/out
```

4. Deploy into blockchain

Send an internal message to smart contract address with StateInit and body,
which were generated in the previous step.

## Standards coverage

[**Fungible tokens (Jettons) standard [TEP74]**](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)

| method                    | tag          |
| ------------------------- | ------------ |
| `transfer`                | `0x0f8a7ea5` |
| `transfer_notification`   | `0x7362d09c` |

Get-methods such as `get_wallet_data` and `get_jetton_data` also implemented.

[**Discoverable Jettons Wallets [TEP89]**](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md)

| method                    | tag          |
| ------------------------- | ------------ |
| `provide_wallet_address`  | `0x2c76b973` |
| `take_wallet_address`     | `0xd1735400` |

## License
`GNU GENERAL PUBLIC LICENSE Version 3`
