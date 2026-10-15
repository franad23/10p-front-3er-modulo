import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { getToken, setToken } from "../auth/token";

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
      const body = await res.json().catch(() => ({}));
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Iniciar sesión</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register("email", {
            required: "El email es obligatorio",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email inválido",
            },
          })}
        />
        {errors.email && <p role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          {...register("password", {
            required: "La contraseña es obligatoria",
            minLength: { value: 6, message: "Mínimo 6 caracteres" },
          })}
        />
        {errors.password && <p role="alert">{errors.password.message}</p>}
      </div>

      {serverError && <p role="alert">{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
