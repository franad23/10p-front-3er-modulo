import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { getToken } from '../auth/token'
import './PaymentResult.css'

type Props = { status: 'success' | 'pending' | 'failure' }
type Verification = 'checking' | 'paid' | 'pending' | 'error' | 'failure'

type Order = {
  status: 'PENDING' | 'PAID' | 'CANCELLED'
}

const API_URL = import.meta.env.VITE_API_URL
const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 20

const content = {
  checking: { icon: '', title: 'Procesando tu pago', text: 'Estamos esperando la confirmación de Mercado Pago. No cierres esta ventana.' },
  paid: { icon: '✓', title: 'Pago confirmado', text: 'Tu compra fue acreditada. Te estamos llevando a tus compras.' },
  pending: { icon: '…', title: 'El pago sigue pendiente', text: 'La confirmación está demorando más de lo esperado. Podés revisar el estado desde tus compras.' },
  error: { icon: '!', title: 'No pudimos verificar el pago', text: 'Tu pago no se perdió. Podés consultar nuevamente su estado desde tus compras.' },
  failure: { icon: '×', title: 'No se pudo completar el pago', text: 'El pago fue rechazado o cancelado. Podés volver a la tienda e intentarlo nuevamente.' },
}

export default function PaymentResult({ status }: Props) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [verification, setVerification] = useState<Verification>(
    status === 'failure' ? 'failure' : 'checking',
  )

  const orderId =
    params.get('external_reference') ??
    sessionStorage.getItem('pending_order_id')

  useEffect(() => {
    if (status === 'failure') return

    if (!orderId || !getToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerification('error')
      return
    }

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let attempts = 0

    const finishPaid = () => {
      if (cancelled) return
      sessionStorage.removeItem('pending_order_id')
      setVerification('paid')
      timeoutId = setTimeout(() => navigate('/orders', { replace: true }), 2000)
    }

    const readOrder = async () => {
      const response = await fetch(`${API_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!response.ok) throw new Error('ORDER-READ-FAILED')
      return (await response.json()) as Order
    }

    const syncPayment = async () => {
      const response = await fetch(`${API_URL}/payment/sync/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (response.status === 409) return null
      if (!response.ok) throw new Error('PAYMENT-SYNC-FAILED')
      return (await response.json()) as Order
    }

    const poll = async () => {
      try {
        const order = await readOrder()
        if (order.status === 'PAID') {
          finishPaid()
          return
        }

        // El webhook es el camino principal. Cada tres intentos se consulta
        // Mercado Pago directamente como respaldo por si el webhook se demora.
        if (attempts > 0 && attempts % 3 === 0) {
          const syncedOrder = await syncPayment()
          if (syncedOrder?.status === 'PAID') {
            finishPaid()
            return
          }
        }

        attempts += 1
        if (attempts >= MAX_ATTEMPTS) {
          if (!cancelled) setVerification('pending')
          return
        }
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
      } catch {
        if (!cancelled) setVerification('error')
      }
    }

    void poll()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [navigate, orderId, status])

  const result = content[verification]

  return (
    <main className={`payment-result payment-result--${verification}`}>
      <section>
        <div className="payment-result__icon">
          {verification === 'checking' ? <span className="payment-result__spinner" /> : result.icon}
        </div>
        <p>Checkout Pro</p>
        <h1>{result.title}</h1>
        <span>{result.text}</span>
        {params.get('payment_id') && <small>Pago: {params.get('payment_id')}</small>}
        {verification !== 'checking' && verification !== 'paid' && (
          <div className="payment-result__actions">
            <Link to="/orders">Ver mis compras</Link>
            <Link to="/store">Volver a la tienda</Link>
          </div>
        )}
      </section>
    </main>
  )
}
