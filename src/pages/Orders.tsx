import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getToken, getTokenPayload } from '../auth/token'
import './Orders.css'

type Order = {
  _id: string
  total: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  createdAt: string
  items: Array<{ name: string; quantity: number; subtotal: number }>
  user_id?: { name: string; lastname: string; email: string }
}

const API_URL = import.meta.env.VITE_API_URL

export default function Orders() {
  const user = getTokenPayload()
  const isAdmin = user?.role === 'ADMIN'
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const ordersPath = isAdmin ? '/order' : '/order/me'
      const response = await fetch(`${API_URL}${ordersPath}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message ?? 'No se pudo cargar el historial')

      const pendingOrders = body.filter((order: Order) => order.status === 'PENDING')
      for (const order of pendingOrders) {
        await fetch(`${API_URL}/payment/sync/${order._id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
        })
      }

      if (pendingOrders.length === 0) {
        setOrders(body)
        return
      }

      const refreshedResponse = await fetch(`${API_URL}${ordersPath}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const refreshedOrders = await refreshedResponse.json()
      if (!refreshedResponse.ok) {
        throw new Error(refreshedOrders.message ?? 'No se pudo actualizar el historial')
      }
      setOrders(refreshedOrders)
      setMessage('Estados consultados en Mercado Pago')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="orders-page">
      <div className="orders-header">
        <div><p>Historial</p><h1>{isAdmin ? 'Todas las compras' : 'Mis compras'}</h1></div>
        <div>
          <Link to={isAdmin ? '/dashboard' : '/store'}>{isAdmin ? 'Volver al panel' : 'Volver a la tienda'}</Link>
          <button onClick={loadOrders}>Actualizar estados</button>
        </div>
      </div>
      {error && <div className="orders-error">{error}</div>}
      {message && <div className="orders-success">{message}</div>}
      {loading ? <p>Cargando compras...</p> : orders.length === 0 ? <p>Todavía no realizaste compras.</p> : (
        <section className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card__header">
                <div><small>{new Date(order.createdAt).toLocaleString('es-AR')}</small><h2>{order.currency} {order.total.toLocaleString('es-AR')}</h2></div>
                <span className={`order-status order-status--${order.status.toLowerCase()}`}>
                  {order.status === 'PENDING' && 'PROCESANDO'}
                  {order.status === 'PAID' && 'PAGADO'}
                  {order.status === 'CANCELLED' && 'CANCELADO'}
                </span>
              </div>
              {isAdmin && order.user_id && (
                <p className="order-customer">
                  Cliente: {order.user_id.name} {order.user_id.lastname} — {order.user_id.email}
                </p>
              )}
              <ul>{order.items.map((item, index) => <li key={`${order._id}-${index}`}>{item.quantity} × {item.name} — {order.currency} {item.subtotal.toLocaleString('es-AR')}</li>)}</ul>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
