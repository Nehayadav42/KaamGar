import { Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { BookingsProvider } from './context/BookingsContext'
import { CatalogueProvider } from './context/CatalogueContext'
import ScrollToTop from './components/ui/ScrollToTop'
import Landing from './pages/Landing'
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

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <CatalogueProvider>
        <BookingsProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<Services />} />
              <Route path="book" element={<BookingWizard />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="bookings/:id" element={<BookingDetail />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="bookings" element={<BookingQueue />} />
              <Route path="workers" element={<Workers />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="services/new" element={<ServiceForm />} />
              <Route path="services/:id" element={<ServiceForm />} />
              <Route path="review" element={<ReviewSoon />} />
            </Route>

            <Route path="/worker" element={<ComingSoon title="Worker" />} />
            <Route path="*" element={<ComingSoon title="Page not found" />} />
          </Routes>
        </BookingsProvider>
      </CatalogueProvider>
    </MotionConfig>
  )
}