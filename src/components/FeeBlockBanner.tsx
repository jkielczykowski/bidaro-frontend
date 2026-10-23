import { Link } from 'react-router-dom'
import type { FeeBlock } from '../lib/feeBlock'
import { formatPln } from '../lib/format'
import './FeeBlockBanner.css'

type Props = {
  block: FeeBlock | null
  /** Pay button on the fees page; elsewhere the banner links to it */
  onPay?: () => void
  paying?: boolean
  /** Also warn about fees due within 3 days (account and fees pages) */
  showDueSoon?: boolean
}

export function FeeBlockBanner({ block, onPay, paying, showDueSoon }: Props) {
  if (!block) return null

  const action = onPay ? (
    <button type="button" className="btn btn-primary" disabled={paying} onClick={onPay}>
      {paying ? 'Przekierowanie…' : 'Zapłać'}
    </button>
  ) : (
    <Link to="/my/fees?status=pending" className="btn btn-primary">
      Zapłać
    </Link>
  )

  if (block.blocked) {
    return (
      <div className="fee-block-banner fee-block-banner-blocked" role="alert" data-testid="fee-block-banner">
        <div>
          <p className="fee-block-banner-title">Konto zablokowane — zaległa prowizja {formatPln(block.overdue_amount)}</p>
          <p className="fee-block-banner-body">
            Prowizję płaci się w ciągu {block.payment_days} dni od sprzedaży. Do czasu zapłaty nie możesz licytować,
            kupować przez „Kup teraz” ani wystawiać aukcji. Blokada zniknie od razu po płatności.
          </p>
        </div>
        {action}
      </div>
    )
  }

  if (showDueSoon && block.due_soon_amount > 0 && block.next_due_at) {
    return (
      <div className="fee-block-banner fee-block-banner-soon" role="status" data-testid="fee-block-banner">
        <div>
          <p className="fee-block-banner-title">
            Zapłać prowizję {formatPln(block.due_soon_amount)} do{' '}
            {new Date(block.next_due_at).toLocaleDateString('pl-PL')}
          </p>
          <p className="fee-block-banner-body">
            Po terminie konto zostanie zablokowane — nie będzie można licytować ani wystawiać.
          </p>
        </div>
        {action}
      </div>
    )
  }

  return null
}
