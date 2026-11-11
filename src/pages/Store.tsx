import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { clearToken, getToken } from '../auth/token'
import './Store.css'

type Product = {
  _id: string
  name: string
  price: number
  currency: 'ARS' | 'USD'
  stock: number
  active: boolean
  image?: { url: string }
}

const API_URL = import.meta.env.VITE_API_URL

export default function Store() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/product?limit=50`)
        const body = await response.json()
        const available = Array.isArray(body.results)
          ? body.results.filter((product: Product) => product.active && product.stock > 0)
          : []
        setProducts(available)
      } catch {
        setError('No se pudieron cargar los productos')
      } finally {
        setLoading(false)
      }
    }

    void loadProducts()
  }, [])

  const changeQuantity = (product: Product, quantity: number) => {
    setQuantities((current) => ({
      ...current,
      [product._id]: Math.max(0, Math.min(quantity, product.stock)),
    }))
  }

  const checkout = async () => {
    const items = products
      .map((product) => ({
        product_id: product._id,
        quantity: quantities[product._id] ?? 0,
      }))
      .filter((item) => item.quantity > 0)

    if (!items.length) {
      setError('Seleccioná al menos un producto')
      return
    }

    setBuying(true)
    setError(null)
    try {
      const orderResponse = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ items }),
      })
      const order = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(order.message ?? 'No se pudo crear la orden')

      const checkoutResponse = await fetch(`${API_URL}/payment/checkout/${order._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const checkoutBody = await checkoutResponse.json()
      if (!checkoutResponse.ok) {
        throw new Error(checkoutBody.message ?? 'No se pudo iniciar el pago')
      }

      const checkoutUrl = checkoutBody.sandbox_init_point || checkoutBody.init_point
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
      navigate('/orders')
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Error inesperado')
      setBuying(false)
    }
  }

  const logout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="store-page">
      <header className="store-header">
        <strong>Tienda Checkout Pro</strong>
        <nav>
          <Link to="/orders">Mis compras</Link>
          <button onClick={logout}>Cerrar sesión</button>
        </nav>
      </header>

      <main className="store-main">
        <div className="store-title">
          <div>
            <p>Mercado Pago Checkout Pro</p>
            <h1>Elegí tus productos</h1>
          </div>
          <button className="checkout-button" onClick={checkout} disabled={buying || loading}>
            {buying ? 'Creando checkout...' : 'Comprar con Mercado Pago'}
          </button>
        </div>

        {error && <div className="store-error">{error}</div>}
        {loading ? <p>Cargando productos...</p> : (
          <section className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product._id}>
                {product.image?.url
                  ? <img src={product.image.url} alt={product.name} />
                  : <div className="product-placeholder">📦</div>}
                <div className="product-card__body">
                  <h2>{product.name}</h2>
                  <strong>{product.currency} {product.price.toLocaleString('es-AR')}</strong>
                  <small>Stock: {product.stock}</small>
                  <label>
                    Cantidad
                    <input
                      type="number"
                      min="0"
                      max={product.stock}
                      value={quantities[product._id] ?? 0}
                      onChange={(event) => changeQuantity(product, Number(event.target.value))}
                    />
                  </label>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
