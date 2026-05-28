import * as XLSX from 'xlsx'

const COLUMN_ALIASES = {
  name: ['name', 'nome'],
  email: ['email', 'e-mail', 'e_mail'],
  phone: ['phone', 'telefone', 'celular', 'whatsapp'],
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
}

function mapHeaders(headers) {
  const mapping = {}

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header)

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(normalized) && mapping[field] === undefined) {
        mapping[field] = index
      }
    }
  })

  return mapping
}

function cellValue(row, index) {
  if (index === undefined || index === null) {
    return ''
  }

  const value = row[index]
  return value === null || value === undefined ? '' : String(value).trim()
}

function parseSheetRows(rows) {
  if (!rows.length) {
    return { rows: [], errors: ['A planilha está vazia.'] }
  }

  const [headerRow, ...dataRows] = rows
  const headerMapping = mapHeaders(headerRow)

  if (headerMapping.name === undefined) {
    return {
      rows: [],
      errors: ['Coluna obrigatória "name" (ou "nome") não encontrada na planilha.'],
    }
  }

  const parsedRows = []
  const errors = []

  dataRows.forEach((row, index) => {
    const lineNumber = index + 2
    const name = cellValue(row, headerMapping.name)
    const email = cellValue(row, headerMapping.email)
    const phone = cellValue(row, headerMapping.phone)

    if (!name && !email && !phone) {
      return
    }

    if (!name) {
      errors.push(`Linha ${lineNumber}: nome é obrigatório.`)
      return
    }

    parsedRows.push({ name, email: email || null, phone: phone || null })
  })

  if (!parsedRows.length && !errors.length) {
    errors.push('Nenhum lead válido encontrado na planilha.')
  }

  return { rows: parsedRows, errors }
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        resolve(parseSheetRows(rows))
      } catch {
        reject(new Error('Não foi possível ler a planilha. Verifique o formato do arquivo.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo.'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export async function parseLeadSpreadsheet(file) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!['csv', 'xlsx', 'xls'].includes(extension ?? '')) {
    throw new Error('Formato inválido. Use arquivos .csv, .xlsx ou .xls')
  }

  return readWorkbook(file)
}

export function buildLeadImportTemplateCsv() {
  return 'name,email,phone\nJoão Silva,joao@email.com,(11) 99999-9999\n'
}

export function downloadLeadImportTemplate() {
  const content = buildLeadImportTemplateCsv()
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'modelo-importacao-leads.csv'
  link.click()
  URL.revokeObjectURL(url)
}
