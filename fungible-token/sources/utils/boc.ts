import { BOC, Cell } from 'ton3'
import * as fs from 'fs'

function bocFileToCell (filename: string): Cell {
    const file = fs.readFileSync(filename)
    return BOC.fromStandard(file)
}

export { bocFileToCell }
