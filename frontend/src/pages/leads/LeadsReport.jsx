import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PageHeader from '../../components/layout/PageHeader'
import LeadReportPreview from '../../components/leads/LeadReportPreview'
import { useAuth } from '../../contexts/AuthContext'
import {
  buildReportData,
  downloadLeadsReportPdf,
  downloadLeadsReportXlsx,
  emptyReportFilters,
} from '../../services/leadReport'
import { fetchLeads, LEAD_STAGES, LEAD_STATUS_OPTIONS } from '../../services/leads'

const inputClass =
  'w-full h-11 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500'

export default function LeadsReport() {

  const { profile, academy } = useAuth()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [reportFilters, setReportFilters] = useState(emptyReportFilters)
  const [reportData, setReportData] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    if (!profile?.academy_id) {
      return
    }

    let active = true

    async function loadLeads() {
      setLoading(true)

      try {
        const data = await fetchLeads(profile.academy_id)
        if (active) {
          setLeads(data)
        }
      } catch (err) {
        if (active) {
          setMessage(err.message ?? 'Erro ao carregar leads.')
          setIsError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadLeads()

    return () => {
      active = false
    }
  }, [profile?.academy_id])

  function handleReportFilterChange(e) {
    setReportFilters({
      ...reportFilters,
      [e.target.name]: e.target.value,
    })
  }

  function handleGenerateReport(e) {
    e.preventDefault()

    const report = buildReportData({
      leads,
      academyName: academy?.name,
      filters: reportFilters,
      generatedAt: new Date(),
    })

    setReportData(report)
    setMessage(`Relatório gerado com ${report.rows.length} lead(s).`)
    setIsError(false)
  }

  function handleClearReportFilters() {
    setReportFilters(emptyReportFilters)
    setReportData(null)
    setMessage('')
  }

  function handleDownloadXlsx() {
    if (!reportData) {
      return
    }

    downloadLeadsReportXlsx({
      report: reportData,
      academyName: academy?.name,
    })
  }

  async function handleDownloadPdf() {
    if (!reportData) {
      return
    }

    setExportingPdf(true)

    try {
      await downloadLeadsReportPdf({
        report: reportData,
        academyName: academy?.name,
        logoUrl: academy?.logo_url,
      })
    } catch (err) {
      setMessage(err.message ?? 'Erro ao gerar PDF.')
      setIsError(true)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div>
      <PageHeader />

      <div className="mb-6">
        <Link
          to="/leads"
          className="text-sm text-violet-600 font-semibold hover:underline"
        >
          ← Voltar para Central de Leads
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Relatório de Leads</h2>
        <p className="text-zinc-500 text-sm mb-6">
          Combine filtros ou use apenas um. Gere a visualização e exporte em XLSX ou PDF.
        </p>

        {loading ? (
          <p className="text-zinc-500">Carregando leads...</p>
        ) : (
          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Status</label>
                <select
                  name="status"
                  value={reportFilters.status}
                  onChange={handleReportFilterChange}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {LEAD_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Stage</label>
                <select
                  name="stage"
                  value={reportFilters.stage}
                  onChange={handleReportFilterChange}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {LEAD_STAGES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Origem</label>
                <input
                  type="text"
                  name="source"
                  value={reportFilters.source}
                  onChange={handleReportFilterChange}
                  placeholder="Ex: Instagram"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Tag</label>
                <input
                  type="text"
                  name="tag"
                  value={reportFilters.tag}
                  onChange={handleReportFilterChange}
                  placeholder="Ex: campanha-março"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Cadastro de</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={reportFilters.dateFrom}
                  onChange={handleReportFilterChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Cadastro até</label>
                <input
                  type="date"
                  name="dateTo"
                  value={reportFilters.dateTo}
                  onChange={handleReportFilterChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="h-11 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold"
              >
                Gerar relatório
              </button>
              <button
                type="button"
                onClick={handleClearReportFilters}
                className="h-11 px-5 rounded-xl border border-zinc-300 text-zinc-600 font-semibold hover:bg-zinc-50"
              >
                Limpar filtros
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      {reportData && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleDownloadXlsx}
              className="h-11 px-5 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50"
            >
              Download XLSX
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="h-11 px-5 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 disabled:opacity-60"
            >
              {exportingPdf ? 'Gerando PDF...' : 'Download PDF'}
            </button>
          </div>

          <LeadReportPreview report={reportData} academy={academy} />
        </div>
      )}
    </div>
  )
}
