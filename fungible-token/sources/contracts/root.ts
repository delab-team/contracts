import { randomBytes } from 'crypto'
import { Address, Bit, Builder, Cell, Coins, Contracts, HashmapE } from 'ton3'

interface TokenMetadataOptions {
    name?: string,
    symbol?: string,
    decimals?: number,
    description?: string,
    image?: string
}

interface TokenDeployOptions {
    queryId?: number | bigint,
    mintable?: boolean,
    supply?: Coins,
    fwdAmount?: Coins,
    fwdBody?: Cell,
    notifbounce?: boolean,
    metadata?: TokenMetadataOptions
}

interface DeployMessage {
    body: Cell,
    init: Cell
}

interface TokenMintOptions {
    tokenAmount: Coins,
    to?: Address,
    fwdAmount?: Coins,
    fwdBody?: Cell,
    notifbounce?: boolean,
    queryId?: number | bigint
}

const METADATA_KEYS = { // sha256 hash of keys utf-8 string name
    name: 0x82a3537ff0dbce7eec35d69edc3a189ee6f17d82f353a553f9aa96cb0be3ce89n,
    symbol: 0xb76a7ca153c24671658335bbd08946350ffc621fa1c516e7123095d4ffd5c581n,
    decimals: 0xee80fd2f1e03480e2282363596ee752d7bb27f50776b95086a0279189675923en,
    description: 0xc9046f7a37ad0ea7cee73355984fa5428982f8b37c8f7bcec91f7ac71a7cd104n,
    image: 0x6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3dn
}

const ROOT_OP = {
    constructor_query: 0x7ce5f67b,
    burn_notification_query: 0x429ac50,
    change_metadata_query: 0x152b9240,
    transfer_ownership_query: 0x2437677e,
    mint_query: 0x23b9ecc
}

class TokenRoot extends Contracts.ContractBase {
    private _wallet_code: Cell

    constructor (workchain: number, code: Cell, wallet_code: Cell) {
        const storage = TokenRoot.initStorage()
        super({ workchain, code, storage })

        this._wallet_code = wallet_code
    }

    private static initStorage (): Cell {
        const storage = new Builder()       // TokenRootStateInit
            .storeBit(0)                    // inited
            .storeBytes(randomBytes(32))    // salt_bytes

        return storage.cell()
    }

    private static newQueryId (): number {
        return ~~(Date.now() / 1000)
    }

    private static buildOnchainMetadata (options: TokenMetadataOptions): Cell {
        const serializers = {
            key: (k: bigint): Bit[] => new Builder().storeUint(k, 256).bits,
            value: (v: string): Cell => new Builder()
                .storeRef(new Builder().storeUint(0, 8).storeString(v).cell()).cell()
        }

        const dict = new HashmapE<bigint, string>(256, { serializers })
        Object.keys(options).forEach((k) => { dict.set(METADATA_KEYS[k], options[k]) })

        return new Builder().storeUint(0x00, 8).storeDict(dict).cell()
    }

    public buildDeployMessage (options: TokenDeployOptions): DeployMessage {
        const {
            queryId = TokenRoot.newQueryId(),
            mintable = true,
            supply = Coins.fromNano(0),
            fwdAmount = Coins.fromNano(0),
            fwdBody = new Builder().cell(),
            notifbounce = false
        } = options

        const metadata = options.metadata
            ? TokenRoot.buildOnchainMetadata(options.metadata)
            : new Builder().cell()

        // constructor_query
        const body = new Builder()                      // RootInternalMsgBody
            .storeUint(ROOT_OP.constructor_query, 32)   // op
            .storeUint(queryId, 64)                     // query_id
            .storeBit(mintable ? 1 : 0)                 // mintable
            .storeCoins(supply)                         // supply
            .storeCoins(fwdAmount)                      // fwd_amount
            .storeRef(fwdBody)                          // fwd_body
            .storeBit(notifbounce ? 1 : 0)              // notifbounce
            .storeRef(metadata)                         // metadata
            .storeRef(this._wallet_code)                // wallet_code

        return { body: body.cell(), init: this.state }
    }

    public static buildChangeMetadata (metadata: TokenMetadataOptions, queryId?: number): Cell {
        // change_metadata_query
        const body = new Builder()                              // RootInternalMsgBody
            .storeUint(ROOT_OP.change_metadata_query, 32)       // op
            .storeUint(queryId || this.newQueryId(), 64)        // query_id
            .storeRef(TokenRoot.buildOnchainMetadata(metadata)) // new_metadata

        return body.cell()
    }

    public static buildTransferOwnership (newOwner: Address, queryId?: number): Cell {
        // transfer_ownership_query
        const body = new Builder()                              // RootInternalMsgBody
            .storeUint(ROOT_OP.transfer_ownership_query, 32)    // op
            .storeUint(queryId || this.newQueryId(), 64)        // query_id
            .storeAddress(newOwner)                             // new_owner_address

        return body.cell()
    }

    public static buildMintMessage (options: TokenMintOptions): Cell {
        const {
            tokenAmount,
            to = Address.NONE,
            fwdAmount = new Coins(0),
            fwdBody = new Builder().cell(),
            notifbounce = false,
            queryId = this.newQueryId()
        } = options

        // mint_query
        const body = new Builder()
            .storeUint(ROOT_OP.mint_query, 32)  // op
            .storeUint(queryId, 64)             // query_id
            .storeAddress(to)                   // to_address
            .storeCoins(tokenAmount)            // token_amount
            .storeCoins(fwdAmount)              // fwd_amount
            .storeRef(fwdBody)                  // fwd_body
            .storeBit(notifbounce ? 1 : 0)      // notifbounce

        return body.cell()
    }
}

export {
    TokenRoot,
    TokenMetadataOptions,
    TokenDeployOptions,
    DeployMessage
}
