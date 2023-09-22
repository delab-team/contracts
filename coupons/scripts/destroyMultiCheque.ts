import { Address, beginCell, Sender, toNano } from 'ton-core';
import { MultiCheque, ClaimFunctions } from '../wrappers/MultiCheque';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { keyPairFromSeed, sign, KeyPair, sha256 } from 'ton-crypto';

export async function run(provider: NetworkProvider) {
    const multiCheque = provider.open(
        MultiCheque.createFromAddress(Address.parse('EQB0pNuJjY59u3bYPbqQUVnhqT5z4taXBVwJoopoQpmyvIP7'))
    );
    await multiCheque.sendDestroy(provider.sender(), toNano('0.03'));
}
