/**
 * Gera relatório PDF consolidado do Roadmap MVP GapSelling.
 * Uso: node Docs/Roadmap/scripts/generate-roadmap-report.mjs
 * Requer: npm install em frontend/ (jspdf + jspdf-autotable)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')
const ROADMAP_DIR = path.join(ROOT, 'Docs/Roadmap')
const FRONTEND_DIR = path.join(ROOT, 'frontend')

const require = createRequire(path.join(FRONTEND_DIR, 'package.json'))
const jsPDF = require('jspdf').default
const autoTable = require('jspdf-autotable').default

const BRAND = { r: 37, g: 99, b: 235 }
const MUTED = { r: 100, g: 116, b: 139 }
const SUCCESS = { r: 22, g: 163, b: 74 }
const WARNING = { r: 234, g: 179, b: 8 }
const DANGER = { r: 220, g: 38, b: 38 }

function readCsv(filename) {
  const filePath = path.join(ROADMAP_DIR, filename)
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const lines = text.trim().split(/\r?\n/)
  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
  return { headers, rows }
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function statusColor(status) {
  const s = (status ?? '').toLowerCase()
  if (s.includes('conclu')) return SUCCESS
  if (s.includes('andamento') || s.includes('progresso')) return WARNING
  if (s.includes('backlog')) return MUTED
  return DANGER
}

function countByStatus(rows) {
  const counts = {}
  for (const row of rows) {
    const st = row.Status || '—'
    counts[st] = (counts[st] || 0) + 1
  }
  return counts
}

function addSectionTitle(doc, title, y) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(14, y, 269, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 16, y + 5.5)
  doc.setTextColor(30, 41, 59)
  return y + 12
}

function addParagraph(doc, text, y, maxWidth = 269) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, 14, y)
  return y + lines.length * 4.2 + 4
}

function tableFromRows(doc, startY, headers, rows, options = {}) {
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map((r) => headers.map((h) => r[h] ?? '')),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [BRAND.r, BRAND.g, BRAND.b],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    ...options,
  })
  return doc.lastAutoTable.finalY + 8
}

function main() {
  const fases = readCsv('roadmap_mvp_fases.csv')
  const marcos = readCsv('roadmap_mvp_marcos.csv')
  const modulos = readCsv('roadmap_mvp_modulos.csv')
  const tarefas = readCsv('roadmap_mvp_tarefas.csv')
  const riscos = readCsv('roadmap_mvp_riscos.csv')
  const backlog = readCsv('roadmap_mvp_backlog.csv')

  const taskCounts = countByStatus(tarefas.rows)
  const totalTasks = tarefas.rows.length
  const doneTasks = taskCounts['Concluída'] ?? 0
  const inProgressTasks = taskCounts['Em andamento'] ?? 0
  const notStarted = taskCounts['Não iniciada'] ?? 0
  const backlogTasks = taskCounts['Backlog'] ?? 0
  const overallPct = Math.round(
    ((doneTasks + inProgressTasks * 0.5) / totalTasks) * 100,
  )

  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = 14

  // Capa
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 0, 297, 42, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('GapSelling — Relatório Roadmap MVP', 14, 22)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em ${generatedAt}`, 14, 32)
  doc.text('Período MVP: 27/05/2026 → 17/07/2026', 14, 38)

  y = 52
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo executivo', 14, y)
  y += 8

  const summaryText = [
    `Progresso geral estimado: ${overallPct}% (${doneTasks} concluídas, ${inProgressTasks} em andamento, ${notStarted} não iniciadas, ${backlogTasks} backlog de ${totalTasks} tarefas).`,
    'Arquitetura atual: frontend React acessa Supabase diretamente (services/*.js). Backend FastAPI ainda não implementado.',
    'Banco: 8 migrations — academies, profiles, leads, campaigns, whatsapp_instances, academy_profiles + RLS + RPC onboarding.',
    'Frontend em produção: https://gapselling-platform.vercel.app',
    'Módulos operacionais: Auth, Academy Settings, Leads Center, CRM Kanban, Relatório de Leads (XLSX/PDF).',
    'Bloqueadores para MVP: FastAPI (F0), WhatsApp + Campanhas + n8n (F3), Chat IA (F4), Alunos + Go-Live completo (F5).',
  ].join('\n\n')
  y = addParagraph(doc, summaryText, y)

  // KPI cards row
  const kpis = [
    ['Concluídas', String(doneTasks), SUCCESS],
    ['Em andamento', String(inProgressTasks), WARNING],
    ['Não iniciadas', String(notStarted), DANGER],
    ['% Geral', `${overallPct}%`, BRAND],
  ]
  let kx = 14
  for (const [label, value, color] of kpis) {
    doc.setFillColor(color.r, color.g, color.b)
    doc.roundedRect(kx, y, 62, 18, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(label, kx + 4, y + 7)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(value, kx + 4, y + 15)
    doc.setFont('helvetica', 'normal')
    kx += 67
  }
  y += 26

  // Fases
  y = addSectionTitle(doc, '1. Fases do MVP', y)
  y = tableFromRows(doc, y, [
    'Fase',
    'Status',
    '% conclusão',
    'Data início',
    'Data fim',
    'Prioridade',
    'Observações',
  ], fases.rows.map((r) => ({
    Fase: r.Nome,
    Status: r.Status,
    '% conclusão': r['% conclusão'],
    'Data início': r['Data início'],
    'Data fim': r['Data fim'],
    Prioridade: r.Prioridade,
    Observações: (r.Observações ?? '').slice(0, 80),
  })))

  if (y > 175) {
    doc.addPage()
    y = 14
  }

  // Marcos
  y = addSectionTitle(doc, '2. Marcos (M0–M5)', y)
  y = tableFromRows(doc, y, [
    'Marco',
    'Data',
    'Status',
    '% conclusão',
    'Entregável chave',
    'Observações',
  ], marcos.rows)

  if (y > 175) {
    doc.addPage()
    y = 14
  }

  // Módulos
  y = addSectionTitle(doc, '3. Módulos', y)
  y = tableFromRows(doc, y, [
    'Módulo',
    'Fase',
    'Status',
    '% conclusão',
    'Schema',
    'Entrega principal',
  ], modulos.rows.map((r) => ({
    ...r,
    'Entrega principal': (r['Entrega principal'] ?? '').slice(0, 60),
  })))

  doc.addPage()
  y = 14

  // Tarefas por fase
  y = addSectionTitle(doc, '4. Tarefas detalhadas', y)
  const faseOrder = [
    'F0 — Fundação',
    'F1 — Academia & Dashboard',
    'F2 — Leads & CRM',
    'F3 — WhatsApp & Campanhas',
    'F4 — Chat IA',
    'F5 — Go-Live',
  ]

  for (const fase of faseOrder) {
    const phaseTasks = tarefas.rows.filter((r) => r.Fase === fase)
    if (!phaseTasks.length) continue

    if (y > 165) {
      doc.addPage()
      y = 14
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
    doc.text(`${fase} (${phaseTasks.length} tarefas)`, 14, y)
    y += 5

    autoTable(doc, {
      startY: y,
      head: [['Nome', 'Status', 'Camada', 'Prioridade', 'Observações']],
      body: phaseTasks.map((r) => [
        (r.Nome ?? '').slice(0, 55),
        r.Status ?? '',
        r.Camada ?? '',
        r.Prioridade ?? '',
        (r.Observações ?? '—').slice(0, 70),
      ]),
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      headStyles: {
        fillColor: [BRAND.r, BRAND.g, BRAND.b],
        textColor: 255,
        fontStyle: 'bold',
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 1) {
          const st = data.cell.raw
          const c = statusColor(st)
          data.cell.styles.textColor = [c.r, c.g, c.b]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  doc.addPage()
  y = 14

  // Riscos
  y = addSectionTitle(doc, '5. Riscos e mitigações', y)
  y = tableFromRows(doc, y, [
    'Risco',
    'Impacto',
    'Prioridade',
    'Mitigação',
    'Fase afetada',
    'Observações',
  ], riscos.rows.map((r) => ({
    ...r,
    Mitigação: (r.Mitigação ?? '').slice(0, 70),
    Observações: (r.Observações ?? '').slice(0, 50),
  })))

  if (y > 165) {
    doc.addPage()
    y = 14
  }

  // Backlog
  y = addSectionTitle(doc, '6. Backlog pós-MVP / adiado', y)
  y = tableFromRows(doc, y, [
    'Nome',
    'Prioridade',
    'Status',
    'Fase sugerida',
    'Módulo',
    'Descrição',
  ], backlog.rows)

  // Stack e migrations
  if (y > 155) {
    doc.addPage()
    y = 14
  }

  y = addSectionTitle(doc, '7. Stack e estado técnico', y)
  const techText = [
    'Frontend: React + Vite + Tailwind — rotas auth, onboarding, dashboard, academy settings, leads, CRM, relatório leads.',
    'Backend: FastAPI planejado — pasta backend/ vazia (apenas .env.example e README).',
    'Database: Supabase PostgreSQL — migrations 20260527120000 a 20260527120007.',
    'Edge Functions: analyze-academy-profile (geração perfil comercial via IA).',
    'Deploy: Frontend Vercel (vercel.json); Backend DigitalOcean planejado F5.',
    'Tabelas implementadas: academies, profiles, leads, campaigns, whatsapp_instances, academy_profiles.',
    'Tabelas pendentes MVP: students, conversations, messages.',
  ].join('\n')
  y = addParagraph(doc, techText, y)

  y = addSectionTitle(doc, '8. Referências', y)
  y = addParagraph(
    doc,
    [
      'ROADMAP_MVP.md — visão completa das fases',
      'PROJECT_CONTEXT.md — regras de negócio e módulos',
      'DATABASE_SCHEMA.md — referência de tabelas',
      'Docs/Roadmap/*.csv — dados estruturados para Notion/planilhas',
      'Produção: https://gapselling-platform.vercel.app',
    ].join('\n'),
    y,
  )

  // Footer em todas as páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(
      `GapSelling Platform — Roadmap MVP — Página ${i}/${pageCount}`,
      14,
      200,
    )
    doc.text(generatedAt, 220, 200)
  }

  const outName = `relatorio_roadmap_mvp_${new Date().toISOString().slice(0, 10)}.pdf`
  const outPath = path.join(ROADMAP_DIR, outName)
  const buffer = Buffer.from(doc.output('arraybuffer'))
  fs.writeFileSync(outPath, buffer)
  console.log(`PDF gerado: ${outPath}`)
  console.log(`Páginas: ${pageCount}`)
}

main()
