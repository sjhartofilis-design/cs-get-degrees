import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { btnPrimary } from '../components/ui'

const backLink = (
  <Link to="/" className={btnPrimary}>
    Back to dashboard
  </Link>
)

export function NotFound() {
  return <EmptyState title="Page not found" message="This page doesn't exist." action={backLink} />
}

export function CheckNotFound() {
  return (
    <EmptyState
      title="Check not found"
      message="This check doesn't exist in this browser. It may have been removed when the demo data was reset."
      action={backLink}
    />
  )
}
