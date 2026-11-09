import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import RequireRole from './components/auth/RequireRole'
import ScrollToTop from './components/ui/ScrollToTop'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ChangePassword from './pages/account/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
import SetPassword from './pages/SetPassword'
import WorkerLayout from './pages/worker/WorkerLayout'
import Jobs from './pages/worker/Jobs'
import WorkerProfile from './pages/worker/Profile'
import PlatformLayout from './pages/platform/PlatformLayout'
import PlatformOverview from './pages/platform/PlatformOverview'
import CoopAdmins from './pages/platform/CoopAdmins'
import Cooperatives from './pages/platform/Cooperatives'
import AuditLog from './pages/platform/AuditLog'
import CustomerLayout from './pages/customer/CustomerLayout'
import Services from './pages/customer/Services'
import BookingWizard from './pages/customer/BookingWizard'
import MyBookings from './pages/customer/MyBookings'
import BookingDetail from './pages/customer/BookingDetail'
import AdminLayout from './pages/admin/AdminLayout'
import Overview from './pages/admin/Overview'
import BookingQueue from './pages/admin/BookingQueue'
import Workers from './pages/admin/Workers'
import AdminServices from './pages/admin/AdminServices'
import ServiceForm from './pages/admin/ServiceForm'
import ReviewSoon from './pages/admin/ReviewSoon'
import ComingSoon from './pages/ComingSoon'

const EVERYONE = ['customer', 'worker', 'coop_admin', 'platform_admin']

export default function App() {
  return (
    // reducedMotion="user": transform animations switch off for people who prefer less motion
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/platform/login" element={<AuthPage door="platform" />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account/password" element={<RequireRole roles={EVERYONE}><ChangePassword /></RequireRole>} />

          <Route path="/customer" element={<RequireRole roles={['customer']}><CustomerLayout /></RequireRole>}>
            <Route index element={<Services />} />
            <Route path="book" element={<BookingWizard />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
          </Route>

          <Route path="/admin" element={<RequireRole roles={['coop_admin']}><AdminLayout /></RequireRole>}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<BookingQueue />} />
            <Route path="workers" element={<Workers />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="services/new" element={<ServiceForm />} />
            <Route path="services/:id" element={<ServiceForm />} />
            <Route path="review" element={<ReviewSoon />} />
          </Route>

          <Route path="/worker" element={<RequireRole roles={['worker']}><WorkerLayout /></RequireRole>}>
            <Route index element={<Jobs />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>

          <Route path="/platform" element={<RequireRole roles={['platform_admin']}><PlatformLayout /></RequireRole>}>
            <Route index element={<PlatformOverview />} />
            <Route path="admins" element={<CoopAdmins />} />
            <Route path="cooperatives" element={<Cooperatives />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>
          <Route path="/owner" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </AuthProvider>
    </MotionConfig>
  )
}
