import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FullScreenLoader } from '../ui/Spinner'
import Button from '../ui/Button'
import Logo from '../ui/Logo'
import { ROLE_LABEL, roleHome } from '../../lib/constants'

// Wrap a page tree to protect it:  <RequireRole roles={['customer']}><CustomerLayout /></RequireRole>
//  - not signed in            -> sent to the sign-in page for that role
//  - signed in as another role -> a friendly "wrong space" screen
//  - must change password      -> sent to the change-password page first
// (This only improves the experience. The real protection is on the server, which checks every request.)
export default function RequireRole({ roles, children }) {
  const { status, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (status === 'loading') return <FullScreenLoader />

  if (status === 'anonymous') {
    const door = roles.includes('customer') ? 'customer' : roles.includes('worker') ? 'worker' : 'owner'
    return <Navigate to={`/auth?role=${door}`} state={{ from: location }} replace />
  }

  if (user.mustChangePassword && location.pathname !== '/account/password') {
    return <Navigate to="/account/password" replace />
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="landing-backdrop grid min-h-screen place-items-center px-4">
        <div className="glass w-full max-w-[520px] rounded-[28px] p-10 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-8 font-serif text-[34px] leading-tight tracking-[-0.02em]">This isn’t your space.</h1>
          <p className="mt-3 text-[14px] text-muted">
            You’re signed in as <strong className="font-medium text-ink">{ROLE_LABEL[user.role]}</strong>, and this area is for someone
            else.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Button onClick={() => navigate(roleHome(user.role), { replace: true })}>Go to my space</Button>
            <button
              type="button"
              onClick={async () => { await logout(); navigate('/', { replace: true }) }}
              className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
