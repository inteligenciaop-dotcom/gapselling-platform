import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import CreateAcademy from './pages/onboarding/CreateAcademy'
import AcademySetupGuide from './pages/onboarding/AcademySetupGuide'
import Dashboard from './pages/dashboard/Dashboard'
import AcademySettings from './pages/academy/AcademySettings'
import LeadsCenter from './pages/leads/LeadsCenter'
import LeadsReport from './pages/leads/LeadsReport'
import CrmKanban from './pages/crm/CrmKanban'
import Campaigns from './pages/campaigns/Campaigns'
import Integrations from './pages/integrations/Integrations'
import PlaceholderPage from './pages/dashboard/PlaceholderPage'
import UserSettings from './pages/system/UserSettings'
import ForgotPassword from './pages/auth/ForgotPassword'
import UpdatePassword from './pages/auth/UpdatePassword'
import ChatIA from './pages/chat/ChatIA'
import AISettings from './pages/ai/AISettings'
import Students from './pages/students/Students'

import ProtectedRoute from './components/ProtectedRoute'
import SetupRequiredRoute from './components/SetupRequiredRoute'
import AppLayout from './components/layout/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding/academy" element={<ProtectedRoute><CreateAcademy /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/onboarding/setup" element={<AcademySetupGuide />} />
          <Route path="/academy/settings" element={<AcademySettings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crm" element={<SetupRequiredRoute><CrmKanban /></SetupRequiredRoute>} />
          <Route path="/leads" element={<SetupRequiredRoute><LeadsCenter /></SetupRequiredRoute>} />
          <Route path="/leads/report" element={<SetupRequiredRoute><LeadsReport /></SetupRequiredRoute>} />
          <Route path="/campanhas" element={<SetupRequiredRoute><Campaigns /></SetupRequiredRoute>} />
          <Route path="/alunos" element={<SetupRequiredRoute><Students /></SetupRequiredRoute>} />
          <Route path="/chat-ia" element={<SetupRequiredRoute><ChatIA /></SetupRequiredRoute>} />
          <Route path="/configuracoes-ia" element={<SetupRequiredRoute><AISettings /></SetupRequiredRoute>} />
          <Route path="/base-conhecimento" element={<SetupRequiredRoute><PlaceholderPage title="Base de Conhecimento" description="Conteudo e contexto para a IA vendedora." /></SetupRequiredRoute>} />
          <Route path="/usuarios" element={<SetupRequiredRoute><UserSettings /></SetupRequiredRoute>} />
          <Route path="/integracoes" element={<SetupRequiredRoute><Integrations /></SetupRequiredRoute>} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

