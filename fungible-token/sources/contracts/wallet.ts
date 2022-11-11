import { Address, Builder, Cell, Coins } from 'ton3'

const WALLET_OP = {
    burn_query: 0x3a3b4252,
    transfer_query: 0xf8a7ea5,
    bouncable_transfer_query: 0x3a81b46
}

interface TransferOptions {
    queryId?: number | bigint,
    tokenAmount: Coins,
    to: Address,
    responseAddress?: Address,
    fwdAmount?: Coins,
    fwdBody?: Cell,
    notifbounce?: boolean
}

class TokenWallet {
    private static newQueryId (): number {
        return ~~(Date.now() / 1000)
    }

    public static buildTransferMessage (options: TransferOptions): Cell {
        const {
            queryId = this.newQueryId(),
            tokenAmount,
            to,
            responseAddress = Address.NONE,
            fwdAmount = Coins.fromNano(0),
            fwdBody = new Builder().cell(),
            notifbounce = false
        } = options

        const op = notifbounce ? WALLET_OP.bouncable_transfer_query : WALLET_OP.transfer_query

        // transfer_query or bouncable_transfer_query
        const body = new Builder()
            .storeUint(op, 32)                  // op
            .storeUint(queryId, 64)             // query_id
            .storeCoins(tokenAmount)            // token_amount
            .storeAddress(to)                   // to_address
            .storeAddress(responseAddress)      // response_address
            .storeBit(0)                        // custom_payload:(Maybe ^Cell)
            .storeCoins(fwdAmount)              // fwd_amount

        if (body.bits.length + fwdBody.bits.length > 1023) {
            body.storeBit(1).storeRef(fwdBody)
        } else {
            body.storeBit(0).storeSlice(fwdBody.slice())
        }

        return body.cell()
    }

    public static buildBurnMessage (
        amount: Coins,
        response: Address = Address.NONE,
        queryId: number | bigint = this.newQueryId()
    ): Cell {
        // burn_query
        const body = new Builder()
            .storeUint(WALLET_OP.burn_query, 32)    // op
            .storeUint(queryId, 64)                 // query_id
            .storeCoins(amount)                     // token_amount
            .storeAddress(response)                 // response_address

        return body.cell()
    }
}

export { TokenWallet }
