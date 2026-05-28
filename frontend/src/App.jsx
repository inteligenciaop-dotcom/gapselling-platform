import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CreateAcademy from './pages/onboarding/CreateAcademy'
import Dashboard from './pages/dashboard/Dashboard'
import AcademySettings from './pages/academy/AcademySettings'
import LeadsCenter from './pages/leads/LeadsCenter'
import LeadsReport from './pages/leads/LeadsReport'
import CrmKanban from './pages/crm/CrmKanban'
import PlaceholderPage from './pages/dashboard/PlaceholderPage'
import UserSettings from './pages/system/UserSettings'
import ForgotPassword from './pages/auth/ForgotPassword'
import UpdatePassword from './pages/auth/UpdatePassword'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/onboarding/academy"
          element={
            <ProtectedRoute>
              <CreateAcademy />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crm" element={<CrmKanban />} />
          <Route path="/leads" element={<LeadsCenter />} />
          <Route path="/leads/report" element={<LeadsReport />} />
          <Route path="/campanhas" element={<PlaceholderPage title="Campanhas" description="Automação comercial com IA via WhatsApp." />} />
          <Route path="/alunos" element={<PlaceholderPage title="Alunos" description="Alunos convertidos e histórico de matrículas." />} />
          <Route path="/chat-ia" element={<PlaceholderPage title="Chat IA" description="Supervisão e acompanhamento das conversas com leads." />} />
          <Route path="/configuracoes-ia" element={<PlaceholderPage title="Configurações IA" description="Tom de comunicação e scripts da IA." />} />
          <Route path="/base-conhecimento" element={<PlaceholderPage title="Base de Conhecimento" description="Conteúdo e contexto para a IA vendedora." />} />
          <Route path="/usuarios" element={<UserSettings />} />
          <Route path="/academy/settings" element={<AcademySettings />} />
          <Route path="/integracoes" element={<PlaceholderPage title="Integrações" description="WhatsApp, n8n e outras integrações." />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App
