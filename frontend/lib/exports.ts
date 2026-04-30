import { exportContractDocx as exportDocxBase } from './export/contractDocx'
import { exportContractPdf  as exportPdfBase }  from './export/contractPdf'

export async function exportContractPdf(contract: any): Promise<void> {
  return exportPdfBase({ contract })
}

export async function exportContractDocx(contract: any): Promise<void> {
  return exportDocxBase({ contract })
}
