import { useNavigate } from 'react-router-dom'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'

export default function ReviewSoon() {
  const navigate = useNavigate()
  return (
    <>
      <AdminHeading title="Coming next." />
      <p className="mt-10 max-w-[360px] text-[15px] leading-[1.7] text-muted">
        Human evidence review tools are coming next. Opening a request never changes its verification.
      </p>
      <div className="mt-8">
        <Button arrow={false} onClick={() => navigate('/admin')}>
          Back to Overview
        </Button>
      </div>
    </>
  )
}