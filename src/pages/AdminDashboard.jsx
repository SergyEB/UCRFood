// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

export default function AdminDashboard() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from("tbl_usuario")
        .select("*")
        .eq("d_correo_electronico", data.user.email)
        .single();

      if (perfilError || !perfilData) {
        setErrorMsg("No se pudo cargar tu perfil.");
        setLoading(false);
        return;
      }

      // si NO es admin, lo sacamos
      if (perfilData.c_id_rol !== 3) {
        navigate("/home");
        return;
      }

      setPerfil(perfilData);
      setLoading(false);
    };

    init();
  }, [navigate]);

  const handleVolverHome = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <p>Cargando administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card home-card">
        {/* HEADER con botón a la derecha (usa las mismas clases que Home.jsx) */}
        <header className="home-header">
          <div>
            <div className="brand">
              <div className="logo">
                UCR<span>Food</span>
              </div>
              <p className="subtitle">Panel de administración</p>
            </div>
          </div>

          <div className="home-header-right">
            <button className="btn-outline" onClick={handleVolverHome}>
              Volver al inicio
            </button>
          </div>
        </header>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <section className="home-section">
          <h2 className="home-section-title">Opciones de administración</h2>

          <div className="home-grid">
            <Link to="/admin/usuarios" className="home-module home-module-admin">
              <h3>Gestión de usuarios</h3>
              <p>Activar y desactivar cuentas de usuarios registrados.</p>
            </Link>

            <Link to="/admin/solicitudes-emprendedor" className="home-module home-module-alt">
              <h3>Solicitudes de emprendedores</h3>
              <p>
                Revisa y aprueba o rechaza las solicitudes de registro de negocio.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
