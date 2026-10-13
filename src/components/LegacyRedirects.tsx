import { Navigate, useParams } from 'react-router-dom'

/** Redirect legacy PL routes while preserving path params. */
export function RedirectAuction() {
  const { id } = useParams()
  return <Navigate to={`/auction/${id}`} replace />
}

export function RedirectAuctionEdit() {
  const { id } = useParams()
  return <Navigate to={`/auction/${id}/edit`} replace />
}

export function RedirectMessage() {
  const { id } = useParams()
  return <Navigate to={`/messages/${id}`} replace />
}
