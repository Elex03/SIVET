import {  useState,  } from "react";
import type {FormEvent} from 'react'
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/context/AuthContext"
import type { Role } from "../../shared/types/auth";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");

  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username || !password || !role) {
      setError("Complete todos los campos.");
      return;
    }

    const success = login(username, password, role);

    if (!success) {
      setError("No fue posible iniciar sesión.");
      return;
    }

    // Redirección dependiendo del rol
    if (role === "administrador") {
      navigate("/dashboard");
    }

    if (role === "bodega") {
      navigate("/bodega");
    }

    if (role === "farmacia") {
      navigate("/farmacia");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <img src="/logo-sivet.png" alt="SIVET" />
        </div>

        <h1>Bienvenido a SIVET</h1>

        <p className="login-description">
          Sistema de inventario veterinario
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="username">
              Usuario
            </label>

            <input
              id="username"
              type="text"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">
              Rol
            </label>

            <select
              id="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as Role)
              }
            >
              <option value="">
                Seleccione un rol
              </option>

              <option value="administrador">
                Administrador
              </option>

              <option value="bodega">
                Bodega
              </option>

              <option value="farmacia">
                Farmacia
              </option>
            </select>
          </div>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button type="submit">
            Iniciar sesión
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;