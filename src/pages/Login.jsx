import { useState } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../services/supabase"; // asegúrate que sea export default

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");     // <<< NUEVO: mensaje informativo
  const disabled = !form.email || !form.password || loading;

  const nav = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMsg("");
    setInfoMsg("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        console.error(error);
        setErrorMsg("Correo o contraseña incorrectos.");
        return;
      }

      nav("/Home");
    } catch (err) {
      console.error(err);
      setErrorMsg("Error inesperado al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  // <<< NUEVO: enviar correo de recuperación
  const onForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!form.email) {
      setErrorMsg("Escribe tu correo para enviar el enlace de recuperación.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        form.email,
        {
          // Ruta de tu app que manejará el cambio de contraseña
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error(error);
        setErrorMsg("No se pudo enviar el correo de recuperación.");
        return;
      }

      setInfoMsg(
        "Te hemos enviado un correo con instrucciones para restablecer tu contraseña."
      );
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al solicitar la recuperación de contraseña.");
    }
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="logo">
            UCR<span>Food</span>
          </div>
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

          {/* mensajes */}
          {errorMsg && (
            <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>{errorMsg}</p>
          )}
          {infoMsg && (
            <p style={{ color: "#16a34a", marginTop: "0.5rem" }}>{infoMsg}</p>
          )}

          <div className="row">
            <a className="link" href="#" onClick={onForgotPassword}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button className="btn btn-primary" disabled={disabled}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="footer">
          ¿No tienes cuenta?{" "}
          <Link className="link" to="/register">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
