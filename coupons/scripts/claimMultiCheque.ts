import { Address, beginCell, Sender, toNano } from 'ton-core';
import { MultiCheque, ClaimFunctions } from '../wrappers/MultiCheque';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import { keyPairFromSeed, sign, KeyPair, sha256 } from 'ton-crypto';

export async function run(provider: NetworkProvider) {
    const passwordString = 'qwerty';
    const seed: Buffer = await sha256(passwordString);
    const keypair: KeyPair = keyPairFromSeed(seed);

    const address = Address.parse('EQDsD_def8Lmwk45z4UvkSuaDaJfXY8xg4l7XxIk9oOcPfRT');

    const signature = sign(beginCell().storeAddress(address).endCell().hash(), keypair.secretKey);

    const multiCheque = provider.open(
        MultiCheque.createFromAddress(Address.parse('EQCYTPsNtmK116FSdRoHTFblQXMIVdi91YJ1twQXJEKU0JQh'))
    );

    await multiCheque.sendClaim(provider.sender(), toNano('0.03'), { signature, address: address });
}
