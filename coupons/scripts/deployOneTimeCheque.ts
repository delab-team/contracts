import { toNano } from 'ton-core';
import { OneTimeCheque, ClaimFunctions } from '../wrappers/OneTimeCheque';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { keyPairFromSeed, KeyPair, sha256 } from 'ton-crypto';

export async function run(provider: NetworkProvider) {
    const passwordString = 'qwerty';
    const seed: Buffer = await sha256(passwordString);
    const keypair: KeyPair = keyPairFromSeed(seed);

    const amount = toNano('0.1');

    const oneTimeCheque = provider.open(
        OneTimeCheque.createFromConfig(
            {
                publicKey: keypair.publicKey,
                claimCont: ClaimFunctions.toncoin,
            },
            await compile('OneTimeCheque')
        )
    );

    await oneTimeCheque.sendDeploy(provider.sender(), amount);

    await provider.waitForDeploy(oneTimeCheque.address);
}
