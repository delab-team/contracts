import * as fs from 'fs'
import * as path from 'path'

import { BOC, Coins } from 'ton3'
import { Command } from 'commander'

import { laodContext } from '../sources/context'
import { TokenRoot } from '../sources/contracts'
import { bocFileToCell, getSeqno, sendCellBoc } from '../sources/utils'

interface Options {
    metadata: string,
    supply: string,
    mintable: boolean,
    fwdAmount: string,
    fwdBody: string,
    notifbounce: boolean
}

const options: Options = new Command().name(path.basename(__filename))
    .description('script for deploying the root smart contract (needs at least 1.5 TON)')

    .argument('<metadata>', 'path to json file with token metadata')
    .argument('<supply>', 'initial supply in minimum token units')

    .option('-m, --mintable', 'allows to mint new tokens after deployment', true)
    .option('-a, --fwd-amount [number]', 'sets transfer_notification fwd amount in TONs')
    .option('-b, --fwd-body [path-to-boc]', 'sets transfer_notification fwd body')
    .option('-n, --notifbounce', 'sends transfer_notification with bounce flag', false)

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    .action(main)

    .parse(process.argv)
    .opts()

async function main (metadata: string, supply: string) {
    console.log(`starting "${path.basename(__filename)}" script ...`)

    const tokenCode = bocFileToCell('build/root.code.boc')
    const walletCode = bocFileToCell('build/wallet.code.boc')
    const context = await laodContext()

    const token = new TokenRoot(0, tokenCode, walletCode)
    const msg = token.buildDeployMessage({
        supply: Coins.fromNano(supply),
        metadata: JSON.parse(fs.readFileSync(metadata, 'utf-8')),
        mintable: options.mintable,
        fwdAmount: options.fwdAmount ? Coins.fromNano(options.fwdAmount) : undefined,
        fwdBody: options.fwdBody ? BOC.fromStandard(fs.readFileSync(options.fwdBody)) : undefined,
        notifbounce: options.notifbounce
    })

    const address = token.address.toString('base64', context.addrst)
    console.log(`contract address: ${address}`)

    const seqno = await getSeqno(context.wallet.address, context.client)
    const transfer = context.wallet.createTransferMessage([ {
        destination: token.address,
        amount: new Coins(1.5),
        body: msg.body,
        init: msg.init,
        mode: 3
    } ], seqno).sign(context.keypair.private)

    console.log('sending an external message...')
    console.log(await sendCellBoc(transfer, context.client))
}
