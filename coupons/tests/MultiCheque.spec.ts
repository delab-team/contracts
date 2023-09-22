import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, beginCell, toNano } from 'ton-core';
import { MultiCheque, ClaimFunctions } from '../wrappers/MultiCheque';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { getSecureRandomBytes, keyPairFromSeed, sign, KeyPair } from 'ton-crypto';
import { randomAddress } from '@ton-community/test-utils';

describe('MultiCheque', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MultiCheque');
    });

    let blockchain: Blockchain;
    let multiCheque: SandboxContract<MultiCheque>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
    });

    it('should deploy simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 1n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );

        const deployResult = await multiCheque.sendDeploy(deployer.getSender(), toNano('1.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: multiCheque.address,
            deploy: true,
            success: true,
        });
    });

    it('should claim simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 1n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );

        const addr = randomAddress();

        const signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

        await multiCheque.sendDeploy(deployer.getSender(), toNano('1.05'));

        const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), { signature, address: addr });

        expect(result.transactions).toHaveTransaction({
            from: multiCheque.address,
            to: addr,
        });

        const balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeGreaterThan(toNano('1'));
    });

    it('should not claim simple cheque (wrong signature)', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 1n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );
        const addr = randomAddress();
        const another = randomAddress();

        const signature = sign(beginCell().storeAddress(another).endCell().hash(), keypair.secretKey);

        const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), { signature, address: addr });

        await multiCheque.sendDeploy(deployer.getSender(), toNano('1.05'));

        expect(result.transactions).toHaveTransaction({
            exitCode: 700,
        });
        const balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeLessThanOrEqual(toNano('0.1'));
    });

    it('should not claim simple cheque (usage limit)', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 1n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );
        const addr = randomAddress();

        const first_signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

        await multiCheque.sendDeploy(deployer.getSender(), toNano('1.05'));
        const first_result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), {
            signature: first_signature,
            address: addr,
        });

        expect(first_result.transactions).toHaveTransaction({
            from: multiCheque.address,
            to: addr,
        });

        const first_balance = (await blockchain.getContract(addr)).balance;

        expect(first_balance).toBeGreaterThan(toNano('1'));

        const another = randomAddress();

        const signature = sign(beginCell().storeAddress(another).endCell().hash(), keypair.secretKey);

        const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), {
            signature,
            address: another,
        });

        expect(result.transactions).toHaveTransaction({
            exitCode: 702,
        });
        const balance = (await blockchain.getContract(another)).balance;
        expect(balance).toBeLessThanOrEqual(toNano('0.1'));
    });

    it('should not claim simple cheque (dual use)', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 2n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );
        const addr = randomAddress();

        const signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

        await multiCheque.sendDeploy(deployer.getSender(), toNano('2.05'));
        let result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), { signature, address: addr });

        expect(result.transactions).toHaveTransaction({
            from: multiCheque.address,
            to: addr,
        });

        let balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeGreaterThan(toNano('1'));
        await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), { signature, address: addr });

        balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeGreaterThan(toNano('1'));
        expect(balance).toBeLessThanOrEqual(toNano('1.05'));
    });

    it('should claim simple cheque 200 times', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = randomAddress();

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 200n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );
        await multiCheque.sendDeploy(deployer.getSender(), toNano('200.05'));
        for (let i = 0; i < 200; i++) {
            let activaitions = await multiCheque.getUsage();

            expect(activaitions).toEqual(BigInt(i));

            const addr = randomAddress();

            const signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

            const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), {
                signature,
                address: addr,
            });

            expect(result.transactions).toHaveTransaction({
                from: multiCheque.address,
                to: addr,
            });

            const balance = (await blockchain.getContract(addr)).balance;
            expect(balance).toBeGreaterThan(toNano('1'));
        }

        const another = randomAddress();

        const signature = sign(beginCell().storeAddress(another).endCell().hash(), keypair.secretKey);

        const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), {
            signature,
            address: another,
        });

        expect(result.transactions).toHaveTransaction({
            exitCode: 702,
        });

        const balance = (await blockchain.getContract(another)).balance;
        expect(balance).toBeLessThanOrEqual(toNano('0.1'));
    });

    it('should destroy simple cheque', async () => {
        const seed: Buffer = await getSecureRandomBytes(32);
        const keypair: KeyPair = keyPairFromSeed(seed);
        const owner_addr = deployer.address;

        multiCheque = blockchain.openContract(
            MultiCheque.createFromConfig(
                {
                    publicKey: keypair.publicKey,
                    claimCont: ClaimFunctions.toncoin,
                    ownerAddress: owner_addr,
                    chequeAmount: toNano('1'),
                    activaitions: 10n,
                    helperCode: await compile('Helper'),
                },
                code
            )
        );
        const addr = randomAddress();

        const signature = sign(beginCell().storeAddress(addr).endCell().hash(), keypair.secretKey);

        await multiCheque.sendDeploy(deployer.getSender(), toNano('10.05'));

        const result = await multiCheque.sendClaim(deployer.getSender(), toNano('0.03'), { signature, address: addr });

        expect(result.transactions).toHaveTransaction({
            from: multiCheque.address,
            to: addr,
        });

        const balance = (await blockchain.getContract(addr)).balance;
        expect(balance).toBeGreaterThan(toNano('1'));

        const result_destroy = await multiCheque.sendDestroy(deployer.getSender(), toNano('0.03'));

        expect(result_destroy.transactions).toHaveTransaction({
            from: multiCheque.address,
            to: owner_addr,
        });

        const owner_balance = (await blockchain.getContract(owner_addr)).balance;
        expect(owner_balance).toBeGreaterThan(toNano('9'));
    });
});
