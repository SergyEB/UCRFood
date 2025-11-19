// src/pages/Home.jsx (ajusta la ruta si usas otra estructura)
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../services/supabase"; // misma import que en Login.jsx
import "./login.css"; // reutilizamos estilos base

export default function Home() {
  const [authUser, setAuthUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setErrorMsg("");

      // 1. Verificar usuario autenticado
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        navigate("/login");
        return;
      }

      setAuthUser(data.user);

      // 2. Buscar su registro en tbl_usuario usando el correo
      const { data: perfilData, error: perfilError } = await supabase
        .from("tbl_usuario")
        .select("*")
        .eq("d_correo_electronico", data.user.email)
        .single();

      if (perfilError) {
        console.error(perfilError);
        setErrorMsg("No se pudo cargar tu perfil. Intenta más tarde.");
      } else {
        setPerfil(perfilData);
      }

      setLoading(false);
    };

    cargarDatos();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Mapeo sencillo de rol por id (ajusta según tus datos reales de tbl_rol)
  const getRolLabel = (rolId) => {
    if (!rolId) return "Sin rol";

    switch (rolId) {
      case 1:
        return "Estudiante";
      case 2:
        return "Emprendedor";
      case 3:
        return "Administrador";
      case 4:
        return "Usuario externo";
      default:
        return `Rol #${rolId}`;
    }
  };

  const rolLabel = perfil ? getRolLabel(perfil.c_id_rol) : "";
  const estadoLabel = perfil?.c_id_estado_usuario
    ? `Estado: #${perfil.c_id_estado_usuario}`
    : "";

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <p>Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card home-card">
        {/* HEADER */}
        <header className="home-header">
          <div>
            <div className="brand">
              <div className="logo">
                UCR<span>Food</span>
              </div>
              <p className="subtitle">
                Hola, {perfil?.d_nombre_completo || "usuario"} 👋
              </p>
            </div>
          </div>

          <div className="home-header-right">
            {rolLabel && <span className="pill pill-rol">{rolLabel}</span>}
            {estadoLabel && (
              <span className="pill pill-estado">{estadoLabel}</span>
            )}
            <button className="btn-outline" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <hr className="home-divider" />

        {/* SECCIÓN PERFIL */}
        <section className="home-section">
          <h2 className="home-section-title">Mi perfil</h2>
          <div className="home-profile">
            <div className="home-profile-data">
              <p>
                <strong>Nombre:</strong>{" "}
                {perfil?.d_nombre_completo || "—"}
              </p>
              <p>
                <strong>Correo:</strong>{" "}
                {authUser?.email || "—"}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {perfil?.d_telefono || "—"}
              </p>
              <p>
                <strong>N° identificación:</strong>{" "}
                {perfil?.d_num_identificacion || "—"}
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={() => navigate("/perfil")}
            >
              Editar perfil
            </button>
          </div>
        </section>

        {/* SECCIÓN MÓDULOS */}
        <section className="home-section">
          <h2 className="home-section-title">Módulos del sistema</h2>

          <div className="home-grid">
            {/* Módulos generales */}
            <Link to="/plan" className="home-module">
              <h3>Planificación semanal</h3>
              <p>Registra y administra tus comidas por semana.</p>
            </Link>

            <Link to="/pedidos" className="home-module">
              <h3>Pedidos al detalle</h3>
              <p>Realiza pedidos puntuales fuera de la planificación.</p>
            </Link>

            <Link to="/salud" className="home-module">
              <h3>Salud y objetivos</h3>
              <p>Registra tu peso, hábitos y seguimiento de metas.</p>
            </Link>

            <Link to="/comunicacion" className="home-module">
              <h3>Comunicados y Vida Estudiantil</h3>
              <p>Consulta actividades, ferias y consejos saludables.</p>
            </Link>

            <Link to="/perfil" className="home-module">
              <h3>Mi perfil</h3>
              <p>Edita tus datos de contacto y preferencias.</p>
            </Link>

            {/* Módulo "Mi negocio" para Emprendedor y Usuario externo */}
            {(rolLabel === "Emprendedor" || rolLabel === "Usuario externo") && (
              <Link
                to="/mi-negocio"
                className="home-module home-module-alt"
              >
                <h3>Mi negocio</h3>
                <p>Gestiona los datos de tu emprendimiento.</p>
              </Link>
            )}

            {rolLabel === "Emprendedor" && (
              <>
                <Link
                  to="/emprendedor/menus"
                  className="home-module home-module-alt"
                >
                  <h3>Menús y catálogo</h3>
                  <p>Publica y actualiza tus menús y precios.</p>
                </Link>

                <Link
                  to="/emprendedor/pedidos"
                  className="home-module home-module-alt"
                >
                  <h3>Pedidos recibidos</h3>
                  <p>Gestiona el estado de los pedidos de tus clientes.</p>
                </Link>
              </>
            )}

            {/* Módulos de administrador */}
            {rolLabel === "Administrador" && (
              <Link
                to="/admin"
                className="home-module home-module-admin"
              >
                <h3>Administración del sistema</h3>
                <p>
                  Gestiona usuarios, menús, pedidos y parámetros generales.
                </p>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
