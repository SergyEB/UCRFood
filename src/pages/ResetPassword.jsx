import { useState } from "react";
import "./login.css"; // puedes reutilizar los estilos del login
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase"; // mismo import que en Login

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const nav = useNavigate();

  // misma regla que usaste en el registro
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const passOK = (v) => passRegex.test(v);

  const disabled =
    !password || !confirm || password !== confirm || !passOK(password) || loading;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!passOK(password)) {
      setErrorMsg(
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número."
      );
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      // Supabase ya tiene la sesión del enlace del correo
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error(error);
        setErrorMsg("No se pudo actualizar la contraseña.");
        return;
      }

      setInfoMsg("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
      // opcional: redirigir al login después de unos segundos
      setTimeout(() => {
        nav("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error inesperado al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="logo">
            UCR<span>Food</span>
          </div>
          <p className="subtitle">Restablecer contraseña 🔑</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Nueva contraseña{" "}
            <small style={{ color: "#64748b", fontWeight: 400 }}>
              8+, 1 mayúscula, 1 minúscula y 1 número
            </small>
            <div className="pwd-field">
              <input
                className="input"
                type={showPwd ? "text" : "password"}
                placeholder="********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                  setInfoMsg("");
                }}
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

          <label className="label">
            Confirmar contraseña
            <input
              className="input"
              type={showPwd ? "text" : "password"}
              placeholder="********"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrorMsg("");
                setInfoMsg("");
              }}
              required
            />
          </label>

          {password && !passOK(password) && (
            <small style={{ color: "#ef4444" }}>
              Debe cumplir: 8+ caracteres, una mayúscula, una minúscula y un número.
            </small>
          )}

          {confirm && password !== confirm && (
            <small style={{ color: "#ef4444" }}>
              Las contraseñas no coinciden.
            </small>
          )}

          {errorMsg && (
            <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>{errorMsg}</p>
          )}
          {infoMsg && (
            <p style={{ color: "#16a34a", marginTop: "0.5rem" }}>{infoMsg}</p>
          )}

          <button className="btn btn-primary" disabled={disabled}>
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
