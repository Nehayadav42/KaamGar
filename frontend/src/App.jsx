import { Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { BookingsProvider } from './context/BookingsContext'
import ScrollToTop from './components/ui/ScrollToTop'
import Landing from './pages/Landing'
import CustomerLayout from './pages/customer/CustomerLayout'
import Services from './pages/customer/Services'
import BookingWizard from './pages/customer/BookingWizard'
import MyBookings from './pages/customer/MyBookings'
import BookingDetail from './pages/customer/BookingDetail'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    // reducedMotion="user": transform animations switch off for people who prefer less motion
    <MotionConfig reducedMotion="user">
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

          <Route path="/worker" element={<ComingSoon title="Worker" />} />
          <Route path="/owner" element={<ComingSoon title="Cooperative Owner" />} />
          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </BookingsProvider>
    </MotionConfig>
  )
}
