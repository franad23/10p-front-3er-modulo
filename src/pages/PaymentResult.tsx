import { Link, useSearchParams } from 'react-router'
import './PaymentResult.css'

type Props = { status: 'success' | 'pending' | 'failure' }

const content = {
  success: { icon: '✓', title: 'Pago recibido', text: 'Ingresá a tus compras para consultar y confirmar el estado en Mercado Pago.' },
  pending: { icon: '…', title: 'Pago procesándose', text: 'Podés actualizar el estado desde tu historial de compras.' },
  failure: { icon: '×', title: 'No se pudo completar el pago', text: 'El pago fue rechazado o cancelado. Podés volver a la tienda e intentarlo nuevamente.' },
}

export default function PaymentResult({ status }: Props) {
  const [params] = useSearchParams()
  const result = content[status]

  return (
    <main className={`payment-result payment-result--${status}`}>
      <section>
        <div className="payment-result__icon">{result.icon}</div>
        <p>Checkout Pro</p>
        <h1>{result.title}</h1>
        <span>{result.text}</span>
        {params.get('payment_id') && <small>Pago: {params.get('payment_id')}</small>}
        <div className="payment-result__actions">
          <Link to="/orders">Ver mis compras</Link>
          <Link to="/store">Volver a la tienda</Link>
        </div>
      </section>
    </main>
  )
}
