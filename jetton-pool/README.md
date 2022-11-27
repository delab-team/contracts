# DeLab Jetton Pool TON smart contract

> :warning: IN ACTIVE DEVELOPMENT. DO NOT USE IN PRODUCTION!

## Introduction

The Jetton Pool TON smart contract is designed to create farm pools to distribute a specified income in `B tokens` as a reward for blocking liquidity in other `A tokens` (liquidity mining).

## Project structure

| Path                            | Description                                          |
| ------------------------------- | ---------------------------------------------------- |
| [`./func/`](./func/)            | FunC code                                            |
| [`./shared/`](./shared/)        | [`fungible-token`](../fungible-token/) compiled code |
| [`./scheme.tlb`](./scheme.tlb)  | TL-B scheme                                          |

> :warning: The compiled `fungible-token` code is not final. The `fungible-token` project, like this one, is under development.

## Deploy process

1. Build smart contracts
```
make
```

2. Create a config based on `sample.conf`

3. Run deploy fift script (`--help` for more info)
```
fift -s ./deploy.fif deploy.conf ./build/out
```

4. Deploy into blockchain

Send an internal message to smart contract address with StateInit and body, which were generated in the previous step.

## License
`GNU GENERAL PUBLIC LICENSE Version 3`
