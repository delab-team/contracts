import { Address, Cell, beginCell, toNano } from 'ton-core';
import { OneTimeCheque, ClaimFunctions } from '../wrappers/OneTimeCheque';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { getSecureRandomBytes, keyPairFromSeed, sign, KeyPair, sha256 } from 'ton-crypto';

export async function run(provider: NetworkProvider) {
    const passwordString = 'qwerty';
    const seed: Buffer = await sha256(passwordString);
    const keypair: KeyPair = keyPairFromSeed(seed);

    const address = Address.parse('EQDsD_def8Lmwk45z4UvkSuaDaJfXY8xg4l7XxIk9oOcPfRT');

    const signature = sign(beginCell().storeAddress(address).endCell().hash(), keypair.secretKey);

    const oneTimeCheque = provider.open(
        OneTimeCheque.createFromAddress(Address.parse('EQCSu4NbkDtJYzDXrJCkYtIJrIYaxLMLI4VoPzcZ0Qz4sHdP'))
    );

    await oneTimeCheque.sendClaim({ signature, address: address });
}
