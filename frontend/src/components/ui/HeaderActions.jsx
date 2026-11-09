import AccountMenu from './AccountMenu'
import NotificationBell from './NotificationBell'

// The bell and the account menu, together, for every signed-in header
export default function HeaderActions() {
  return (
    <div className="flex items-center gap-4">
      <NotificationBell />
      <AccountMenu />
    </div>
  )
}
