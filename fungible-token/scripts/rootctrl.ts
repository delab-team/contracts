/* eslint-disable @typescript-eslint/no-use-before-define */
import * as fs from 'fs'
import * as path from 'path'

import { Address, BOC, Coins } from 'ton3'
import { Command } from 'commander'

import { laodContext } from '../sources/context'
import { TokenRoot } from '../sources/contracts'
import { getSeqno, sendCellBoc } from '../sources/utils'

const program = new Command()
    .name(path.basename(__filename))
    .description('script to interacting with different token root methods')
    .showHelpAfterError()

program
    .command('change-metadata')
    .description('changes the metadata of the specified token (needs at least 0.1 TON)')
    .argument('<token>', 'base64 address of root token contract')
    .argument('<metadata>', 'path to json file with token metadata')
    .action(changeMetadata)

program.command('transfer-ownership')
    .description('transfers ownership of the specified token (needs at least 0.1 TON)')
    .argument('<token>', 'base64 address of root token contract')
    .argument('<new-owner>', 'base64 or "00" address of new owner')
    .action(transferOwnership)

program.command('mint')
    .description('command script for token minting (needs at least 0.1 TON + fwd-amount)')
    .argument('<token>', 'base64 address of root token contract')
    .argument('<amount>', 'amount of tokens')
    .argument('<mint-to>', 'base64 or "00" address of tokens receiver')
    .option('-a, --fwd-amount [number]', 'sets transfer_notification fwd amount in TONs')
    .option('-b, --fwd-body [path-to-boc]', 'sets transfer_notification fwd body')
    .option('-n, --notifbounce', 'sends transfer_notification with bounce flag', false)
    .action(mint)

async function changeMetadata (token: string, metadata: string) {
    const context = await laodContext()
    const msg = TokenRoot.buildChangeMetadata(JSON.parse(fs.readFileSync(metadata, 'utf-8')))

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: new Address(token),
        amount: new Coins(0.1),
        body: msg,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}

async function transferOwnership (token: string, newOwner: string) {
    const context = await laodContext()

    const transferTo = newOwner === '00' ? Address.NONE : new Address(newOwner)
    const msg = TokenRoot.buildTransferOwnership(transferTo)

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: new Address(token),
        amount: new Coins(0.1),
        body: msg,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}

async function mint (token: string, amount: string, mintTo: string) {
    const options = program.opts()
    const context = await laodContext()

    const fwdAmount = options.fwdAmount ? Coins.fromNano(options.fwdAmount) : new Coins(0)
    const fwdBody = options.fwdBody ? BOC.fromStandard(fs.readFileSync(options.fwdBody)) : undefined

    const msg = TokenRoot.buildMintMessage({
        tokenAmount: Coins.fromNano(amount),
        to: mintTo === '00' ? Address.NONE : new Address(mintTo),
        fwdAmount,
        fwdBody,
        notifbounce: options.notifbounce
    })

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: new Address(token),
        amount: new Coins(0.1).add(fwdAmount),
        body: msg,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}

program.parse()
