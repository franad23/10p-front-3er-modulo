import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { getToken, setToken } from "../auth/token";
import "./Login.css";

type LoginForm = {
  email: string;
  password: string;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  if (getToken()) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      let body;
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (!res.ok) {
        setServerError(body.message ?? "Credenciales inválidas");
        return;
      }
      const token = body.token;
      if (!token) {
        setServerError("El servidor no devolvió un token");
        return;
      }
      setToken(token);
      navigate("/dashboard", { replace: true });
    } catch {
      setServerError("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__badge">👋</div>
          <h1>Bienvenido de nuevo</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email", {
                required: "El email es obligatorio",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido",
                },
              })}
            />
            {errors.email && (
              <p className="field-error" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password", {
                required: "La contraseña es obligatoria",
                minLength: { value: 6, message: "Mínimo 6 caracteres" },
              })}
            />
            {errors.password && (
              <p className="field-error" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="form-error" role="alert">
              {serverError}
            </div>
          )}

          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
