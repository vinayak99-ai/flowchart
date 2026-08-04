import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

async function captureDataUrl(node: HTMLElement): Promise<string> {
  return toPng(node, {
    cacheBust: true,
    backgroundColor: '#f7f8f7',
    pixelRatio: 2,
  })
}

export async function exportPng(node: HTMLElement, filename = 'flowchart.png'): Promise<void> {
  const dataUrl = await captureDataUrl(node)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportPdf(node: HTMLElement, filename = 'flowchart.pdf'): Promise<void> {
  const dataUrl = await captureDataUrl(node)
  const { width, height } = node.getBoundingClientRect()

  const pdf = new jsPDF({
    orientation: width >= height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
  pdf.save(filename)
}
