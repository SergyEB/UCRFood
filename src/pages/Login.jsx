import { useState } from "react";
import "./login.css";
import { Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const disabled = !form.email || !form.password || loading;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // aquí luego conectamos a la API/Supabase
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="logo">UCR<span>Food</span></div>
          <p className="subtitle">Bienvenido 👋</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Correo
            <input
              className="input"
              name="email"
              type="email"
              placeholder="usuario@ucr.ac.cr"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="label">
            Contraseña
            <div className="pwd-field">
              <input
                className="input"
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="********"
                value={form.password}
                onChange={onChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPwd ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          <div className="row">
            <a className="link" href="#" onClick={(e)=>e.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button className="btn btn-primary" disabled={disabled}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="footer">
          ¿No tienes cuenta? <Link className="link" to="/register">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
