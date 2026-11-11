import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { clearToken, getToken } from "../auth/token";
import "./Dashboard.css";

type Category = {
  _id: string;
  name: string;
  description: string;
  active: boolean;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  currency: "ARS" | "USD";
  stock: number;
  active: boolean;
  category_id: string | Category | null;
  createdBy_id: string;
  createdAt: string;
  image: { url: string; public_id: string };
};

type ProductForm = {
  name: string;
  price: number;
  currency: "ARS" | "USD";
  stock: number;
  active: boolean;
  category_id: string;
  image: FileList;
};

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE_OPTIONS = [2, 5, 10, 20, 50];

export default function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    defaultValues: {
      name: "",
      price: 0,
      currency: "ARS",
      stock: 0,
      active: true,
      category_id: "",
    },
  });

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const loadProducts = async (
    targetPage = page,
    targetLimit = pageSize,
    targetSearch = search,
  ) => {
    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(targetLimit),
    });
    if (targetSearch.trim()) params.set("name", targetSearch.trim());

    const res = await fetch(`${API_URL}/product?${params.toString()}`);
    const body = await res.json();
    setProducts(Array.isArray(body.results) ? body.results : []);
    setPage(body.currentPage ?? targetPage);
    setTotalPages(body.totalPages ?? 1);
    setHasPrevPage(Boolean(body.hasPrevPage));
    setHasNextPage(Boolean(body.hasNextPage));
  };

  const loadCategories = async () => {
    const res = await fetch(`${API_URL}/category`);
    const body = await res.json();
    setCategories(Array.isArray(body) ? body : []);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await Promise.all([loadProducts(1), loadCategories()]);
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        await loadProducts(1, pageSize, search);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const goToPage = async (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setLoading(true);
    try {
      await loadProducts(targetPage);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = async (newSize: number) => {
    setPageSize(newSize);
    setLoading(true);
    try {
      await loadProducts(1, newSize, search);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setServerError(null);
    setSuccessMessage(null);
    const imageFile = data.image?.[0];
    if (!imageFile) {
      setServerError("La imagen del producto es obligatoria");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", String(Number(data.price)));
      formData.append("currency", data.currency);
      formData.append("stock", String(Number(data.stock)));
      formData.append("active", String(data.active));
      formData.append("category_id", data.category_id);
      formData.append("image", imageFile);

      const res = await fetch(`${API_URL}/product`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });
      let body;
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (!res.ok) {
        setServerError(
          Array.isArray(body.errors)
            ? body.errors.map((e: { msg: string }) => e.msg).join(", ")
            : (body.message ?? "No se pudo crear el producto"),
        );
        return;
      }
      setSuccessMessage("Producto creado con éxito");
      reset();
      await loadProducts(1);
    } catch {
      setServerError("No se pudo conectar con el servidor");
    }
  };

  const categoryName = (category_id: string | Category | null) => {
    if (!category_id) return "—";
    if (typeof category_id === "object") return category_id.name;
    return categories.find((c) => c._id === category_id)?.name ?? "—";
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <span className="dashboard__brand-badge">🚀</span>
          <span>Mi Panel</span>
        </div>
        <div className="dashboard__actions">
          <Link to="/orders">Ver compras</Link>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard__main dashboard__main--products">
        <section className="dashboard__card dashboard__card--form">
          <h2>Crear producto</h2>

          <form
            className="product-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                type="text"
                placeholder="Nombre del producto"
                aria-invalid={errors.name ? "true" : "false"}
                {...register("name", {
                  required: "El nombre es obligatorio",
                })}
              />
              {errors.name && (
                <p className="field-error" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="price">Precio</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-invalid={errors.price ? "true" : "false"}
                {...register("price", {
                  required: "El precio es obligatorio",
                  min: { value: 0, message: "El precio no puede ser negativo" },
                })}
              />
              {errors.price && (
                <p className="field-error" role="alert">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="currency">Moneda</label>
              <select
                id="currency"
                {...register("currency", { required: true })}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                placeholder="0"
                aria-invalid={errors.stock ? "true" : "false"}
                {...register("stock", {
                  required: "El stock es obligatorio",
                  min: { value: 0, message: "El stock no puede ser negativo" },
                })}
              />
              {errors.stock && (
                <p className="field-error" role="alert">
                  {errors.stock.message}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="image">Imagen</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                aria-invalid={errors.image ? "true" : "false"}
                {...register("image", {
                  required: "La imagen es obligatoria",
                })}
              />
              {errors.image && (
                <p className="field-error" role="alert">
                  {errors.image.message}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="category_id">Categoría</label>
              <select
                id="category_id"
                aria-invalid={errors.category_id ? "true" : "false"}
                {...register("category_id", {
                  required: "La categoría es obligatoria",
                })}
              >
                <option value="">Seleccioná una categoría</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="field-error" role="alert">
                  {errors.category_id.message}
                </p>
              )}
            </div>

            <div className="field field--checkbox">
              <label htmlFor="active">
                <input id="active" type="checkbox" {...register("active")} />
                Activo
              </label>
            </div>

            {serverError && (
              <div className="form-error" role="alert">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="form-success" role="status">
                {successMessage}
              </div>
            )}

            <button
              className="submit-btn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear producto"}
            </button>
          </form>
        </section>

        <section className="dashboard__card dashboard__card--table">
          <div className="dashboard__card-header">
            <h2>Productos</h2>
            <input
              type="search"
              className="search-input"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="table-empty">Cargando productos...</p>
          ) : products.length === 0 ? (
            <p className="table-empty">Todavía no hay productos creados.</p>
          ) : (
            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <button
                          type="button"
                          className="product-thumbnail-btn"
                          onClick={() =>
                            setPreviewImage({
                              url: product.image?.url,
                              name: product.name,
                            })
                          }
                        >
                          <img
                            src={product.image?.url}
                            alt={product.name}
                            className="product-thumbnail"
                          />
                        </button>
                      </td>
                      <td>{product.name}</td>
                      <td>
                        {product.price} {product.currency}
                      </td>
                      <td>{product.stock}</td>
                      <td>{categoryName(product.category_id)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            product.active
                              ? "status-badge--active"
                              : "status-badge--inactive"
                          }`}
                        >
                          {product.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="pagination">
              <button
                type="button"
                className="pagination__btn"
                onClick={() => goToPage(page - 1)}
                disabled={!hasPrevPage}
              >
                Anterior
              </button>
              <span className="pagination__status">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className="pagination__btn"
                onClick={() => goToPage(page + 1)}
                disabled={!hasNextPage}
              >
                Siguiente
              </button>

              <label className="pagination__size">
                Por página
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </section>
      </main>

      {previewImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="image-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setPreviewImage(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <img src={previewImage.url} alt={previewImage.name} />
            <p className="image-modal__caption">{previewImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
