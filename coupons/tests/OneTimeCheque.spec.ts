import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, beginCell, toNano } from 'ton-core';
import { OneTimeCheque, ClaimFunctions } from '../wrappers/OneTimeCheque';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { getSecureRandomBytes, keyPairFromSeed, sign, KeyPair } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';

describe('OneTimeCheque', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('OneTimeCheque');
    });

    let blockchain: Blockchain;
    let oneTimeCheque: SandboxContract<OneTimeCheque>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
    });

    it('should deploy simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);

        oneTimeCheque = blockchain.openContract(
            OneTimeCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                },
                code
            )
        );

        const deployResult = await oneTimeCheque.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oneTimeCheque.address,
            deploy: true,
            success: true,
        });
    });

    it('should claim simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);

        oneTimeCheque = blockchain.openContract(
            OneTimeCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                },
                code
            )
        );
        const addr = randomAddress();

        const signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

        await oneTimeCheque.sendDeploy(deployer.getSender(), toNano('1'));
        const result = await oneTimeCheque.sendClaim({ signature, address: addr });

        expect(result.transactions).toHaveTransaction({
            from: oneTimeCheque.address,
            to: addr,
        });

        const balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeGreaterThan(toNano('0.9'));
        expect(balance).toBeLessThanOrEqual(toNano('1'));
    });

    it('should not claim simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);

        oneTimeCheque = blockchain.openContract(
            OneTimeCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                },
                code
            )
        );
        const addr = randomAddress();
        const another = randomAddress();

        const signature = sign(beginCell().storeAddress(another).endCell().hash(), keypair.secretKey);

        await oneTimeCheque.sendDeploy(deployer.getSender(), toNano('1'));

        await expect(oneTimeCheque.sendClaim({ signature: signature, address: addr })).rejects.toThrow();
    });
});
