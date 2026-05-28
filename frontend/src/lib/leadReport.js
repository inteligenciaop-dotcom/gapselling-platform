import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { parseDbTimestamp } from './leads'

export const emptyReportFilters = {
  status: '',
  stage: '',
  source: '',
  tag: '',
  dateFrom: '',
  dateTo: '',
}

export function formatReportDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function startOfDay(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function endOfDay(dateString) {
  const date = new Date(`${dateString}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function filterLeads(leads, filters) {
  return leads.filter((lead) => {
    if (filters.status && lead.status !== filters.status) {
      return false
    }

    if (filters.stage && lead.stage !== filters.stage) {
      return false
    }

    if (filters.source) {
      const source = (lead.source ?? '').toLowerCase()
      const filterSource = filters.source.trim().toLowerCase()
      if (!source.includes(filterSource)) {
        return false
      }
    }

    if (filters.tag) {
      const tag = (lead.tag ?? '').toLowerCase()
      const filterTag = filters.tag.trim().toLowerCase()
      if (!tag.includes(filterTag)) {
        return false
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      const createdAt = parseDbTimestamp(lead.created_at)

      if (!createdAt) {
        return false
      }

      if (filters.dateFrom) {
        const from = startOfDay(filters.dateFrom)
        if (from && createdAt < from) {
          return false
        }
      }

      if (filters.dateTo) {
        const to = endOfDay(filters.dateTo)
        if (to && createdAt > to) {
          return false
        }
      }
    }

    return true
  })
}

export function getAppliedFiltersSummary(filters) {
  const items = []

  if (filters.status) items.push(`Status: ${filters.status}`)
  if (filters.stage) items.push(`Stage: ${filters.stage}`)
  if (filters.source?.trim()) items.push(`Origem: ${filters.source.trim()}`)
  if (filters.tag?.trim()) items.push(`Tag: ${filters.tag.trim()}`)
  if (filters.dateFrom) items.push(`Cadastro de: ${formatFilterDate(filters.dateFrom)}`)
  if (filters.dateTo) items.push(`Cadastro até: ${formatFilterDate(filters.dateTo)}`)

  if (!items.length) {
    return ['Nenhum filtro — todos os leads']
  }

  return items
}

function formatFilterDate(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
}

function formatLeadRow(lead) {
  return {
    name: lead.name ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    status: lead.status ?? '',
    stage: lead.stage ?? '',
    source: lead.source ?? '',
    tag: lead.tag ?? '',
    created_at: lead.created_at
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parseDbTimestamp(lead.created_at))
      : '',
  }
}

function buildReportMeta({ academyName, filters, generatedAt }) {
  return {
    title: 'Relatório de Leads',
    academyName: academyName ?? 'Academia',
    generatedAt: formatReportDateTime(generatedAt),
    filters: getAppliedFiltersSummary(filters),
    totalLabel: null,
  }
}

export function buildReportData({ leads, academyName, filters, generatedAt = new Date() }) {
  const filteredLeads = filterLeads(leads, filters)
  const meta = buildReportMeta({ academyName, filters, generatedAt })
  meta.totalLabel = `${filteredLeads.length} lead(s)`

  return {
    meta,
    rows: filteredLeads.map(formatLeadRow),
  }
}

export function downloadLeadsReportXlsx({ report, academyName }) {
  const headerRows = [
    [report.meta.title],
    [`Academia: ${academyName ?? report.meta.academyName}`],
    [`Gerado em: ${report.meta.generatedAt}`],
    [],
    ['Filtros aplicados:'],
    ...report.meta.filters.map((item) => [item]),
    [],
    [`Total: ${report.meta.totalLabel}`],
    [],
    ['Nome', 'E-mail', 'Telefone', 'Status', 'Stage', 'Origem', 'Tag', 'Cadastro'],
  ]

  const dataRows = report.rows.map((row) => [
    row.name,
    row.email,
    row.phone,
    row.status,
    row.stage,
    row.source,
    row.tag,
    row.created_at,
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

  XLSX.writeFile(workbook, `relatorio-leads-${Date.now()}.xlsx`)
}

async function loadImageAsDataUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function downloadLeadsReportPdf({ report, academyName, logoUrl }) {
  const doc = new jsPDF({ orientation: 'landscape' })
  let cursorY = 16

  if (logoUrl) {
    try {
      const logoData = await loadImageAsDataUrl(logoUrl)
      const format = logoData.includes('image/jpeg') ? 'JPEG' : 'PNG'
      doc.addImage(logoData, format, 14, 10, 18, 18)
      cursorY = 20
    } catch {
      // logo opcional — continua sem imagem
    }
  }

  doc.setFontSize(16)
  doc.text(report.meta.title, logoUrl ? 36 : 14, 16)

  doc.setFontSize(10)
  doc.text(`Academia: ${academyName ?? report.meta.academyName}`, logoUrl ? 36 : 14, 23)
  doc.text(`Gerado em: ${report.meta.generatedAt}`, logoUrl ? 36 : 14, 29)
  doc.text(report.meta.totalLabel, logoUrl ? 36 : 14, 35)

  doc.setFontSize(9)
  doc.text('Filtros aplicados:', 14, 44)
  report.meta.filters.forEach((filter, index) => {
    doc.text(`• ${filter}`, 14, 50 + index * 5)
  })

  const tableStartY = 50 + report.meta.filters.length * 5 + 4

  autoTable(doc, {
    startY: tableStartY,
    head: [['Nome', 'E-mail', 'Telefone', 'Status', 'Stage', 'Origem', 'Tag', 'Cadastro']],
    body: report.rows.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.status,
      row.stage,
      row.source,
      row.tag,
      row.created_at,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [124, 58, 237] },
  })

  doc.save(`relatorio-leads-${Date.now()}.pdf`)
}
