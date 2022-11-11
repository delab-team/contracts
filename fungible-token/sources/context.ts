import { AddressStringifyOptions, KeyPair, Mnemonic, Providers } from 'ton3'
import { ContractWalletV3R2 } from 'ton3-contracts/dist/wallets'
import * as fs from 'fs'

interface Config {
    mnemonic: string,
    workchain: number,
    subwalletId: number,
    addressFormat: 'testnet' | 'mainnet',
    toncenterapi: { url: string, key: string }
}

interface Context {
    client: Providers.ClientRESTV2,
    wallet: ContractWalletV3R2,
    addrst: AddressStringifyOptions,
    keypair: KeyPair
}

async function laodContext (): Promise<Context> {
    const config = <Config>JSON.parse(fs.readFileSync('./tonconfig.json', { encoding: 'utf-8' }))
    const mnemonic = new Mnemonic(config.mnemonic.split(' '))

    const wallet = new ContractWalletV3R2({
        workchain: config.workchain,
        publicKey: mnemonic.keys.public,
        subwalletId: config.subwalletId
    })

    const authparams = config.toncenterapi.key ? { apiKey: config.toncenterapi.key } : undefined

    const provider = new Providers.ProviderRESTV2(config.toncenterapi.url, authparams)
    const client = await provider.client()

    const addrst: AddressStringifyOptions = config.addressFormat === 'testnet'
        ? { testOnly: true, bounceable: true } : { testOnly: false, bounceable: true }

    return { client, wallet, keypair: mnemonic.keys, addrst }
}

export { laodContext }
