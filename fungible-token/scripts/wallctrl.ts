/* eslint-disable @typescript-eslint/no-use-before-define */
import * as fs from 'fs'
import * as path from 'path'

import { Address, BOC, Builder, Coins, Providers } from 'ton3'
import { Command } from 'commander'

import { laodContext } from '../sources/context'
import { TokenWallet } from '../sources/contracts'
import { getSeqno, sendCellBoc } from '../sources/utils'

const program = new Command()
    .name(path.basename(__filename))
    .description('script to interacting with different token wallet methods')
    .showHelpAfterError()

program
    .command('send')
    .description('sends tokens to the specified address (needs at least 0.1 TON + fwd-amount)')
    .argument('<token>', 'base64 address of root token contract')
    .argument('<to>', 'base64 address of tokens receiver')
    .argument('<amount>', 'amount of tokens')
    .option('-a, --fwd-amount [number]', 'sets transfer_notification fwd amount in TONs')
    .option('-b, --fwd-body [path-to-boc]', 'sets transfer_notification fwd body')
    .option('-n, --notifbounce', 'sends transfer_notification with bounce flag', false)
    .option('-r, --response <base64-address>', 'sets response_address')
    .action(mint)

program
    .command('burn')
    .description('burns tokens from your wallet (needs at least 0.1 TON)')
    .argument('<token>', 'base64 address of root token contract')
    .argument('<amount>', 'amount of tokens')
    .option('-r, --response <base64-address>', 'sets response_address')
    .action(burn)

async function resolveWalletAddress (
    client: Providers.ClientRESTV2,
    token: string,
    address: Address
): Promise<Address> {
    const resp = await client.runGetMethod(null, {
        address: token,
        method: 'get_wallet_address',
        stack: [ [
            'tvm.Slice',
            BOC.toBase64Standard(new Builder().storeAddress(address).cell())
        ] ]
    })

    if ((<any>resp.data.result).exit_code !== 0) {
        throw new Error(`error exit code(get_wallet_address): ${(<any>resp.data.result).exit_code}`)
    }

    return BOC.fromStandard(
        (<any>resp.data.result).stack[0][1].bytes
    ).slice().loadAddress()
}

async function mint (token: string, to: string, amount: string) {
    const options = program.opts()
    const context = await laodContext()

    const fwdAmount = options.fwdAmount ? Coins.fromNano(options.fwdAmount) : new Coins(0)
    const fwdBody = options.fwdBody ? BOC.fromStandard(fs.readFileSync(options.fwdBody)) : undefined

    const msg = TokenWallet.buildTransferMessage({
        tokenAmount: Coins.fromNano(amount),
        to: new Address(to),
        responseAddress: options.response ? new Address(options.response) : Address.NONE,
        fwdAmount,
        fwdBody,
        notifbounce: options.notifbounce
    })

    const tokenWallet = await resolveWalletAddress(context.client, token, context.wallet.address)
    console.log(`token wallet address: ${tokenWallet.toString('base64', context.addrst)}`)

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: tokenWallet,
        amount: new Coins(0.1).add(fwdAmount),
        body: msg,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}

async function burn (token: string, amount: string) {
    const options = program.opts()
    const context = await laodContext()

    const msg = TokenWallet.buildBurnMessage(
        Coins.fromNano(amount),
        options.response ? new Address(options.response) : Address.NONE
    )

    const tokenWallet = await resolveWalletAddress(context.client, token, context.wallet.address)
    console.log(`token wallet address: ${tokenWallet.toString('base64', context.addrst)}`)

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: tokenWallet,
        amount: new Coins(0.1),
        body: msg,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}

program.parse()
