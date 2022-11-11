import { Address, Cell, BOC, Providers } from 'ton3'

async function getSeqno (address: Address, client: Providers.ClientRESTV2): Promise<number> {
    const seqnoResp: any = await client.runGetMethod(null, {
        address: address.toString(),
        method: 'seqno',
        stack: []
    })

    const exitCode = <number>seqnoResp.data.result.exit_code
    return (exitCode !== 0) ? 0 : parseInt(<string>seqnoResp.data.result.stack[0][1], 16)
}

async function sendCellBoc (cell: Cell, client: Providers.ClientRESTV2): Promise<string> {
    const resp = await client.sendBoc(null, { boc: BOC.toBase64Standard(cell) })
    return JSON.stringify(resp.data.result)
}

export { getSeqno, sendCellBoc }
