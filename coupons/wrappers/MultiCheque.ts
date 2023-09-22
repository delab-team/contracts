import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type MultiChequeConfig = {
    publicKey: Buffer;
    claimCont: Cell;
    activaitions: bigint;
    chequeAmount: bigint;
    ownerAddress: Address;
    helperCode: Cell;
};

export function multiChequeConfigToCell(config: MultiChequeConfig): Cell {
    return beginCell()
        .storeBuffer(config.publicKey)
        .storeCoins(config.chequeAmount)
        .storeAddress(config.ownerAddress)
        .storeUint(config.activaitions, 64)
        .storeUint(BigInt(Math.floor(Math.random() * 1e9)), 32)
        .storeUint(0n, 64)
        .storeRef(config.claimCont)
        .storeRef(config.helperCode)
        .endCell();
}

export const Opcodes = {
    claim: 0x22356c66,
    destroy: 0x7ba45f85,
};

export const ClaimFunctions = {
    toncoin: Cell.fromBoc(Buffer.from('B5EE9C720101010100140000248010C8CB05CE01FA027001CB6AC98040FB00', 'hex'))[0],
};

export class MultiCheque implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MultiCheque(address);
    }

    static createFromConfig(config: MultiChequeConfig, code: Cell, workchain = 0) {
        const data = multiChequeConfigToCell(config);
        const init = { code, data };
        return new MultiCheque(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendClaim(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        opts: {
            signature: Buffer;
            address: Address;
        }
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.claim, 32)
                .storeBuffer(opts.signature)
                .storeAddress(opts.address)
                .endCell(),
        });
    }

    async sendDestroy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.destroy, 32).endCell(),
        });
    }

    async getUsage(provider: ContractProvider): Promise<bigint> {
        return (await provider.get('get_number_of_uses', [])).stack.readBigNumber();
    }
}
