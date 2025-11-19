import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

// Constantes de roles y estados (ajusta si tus IDs son otros)
const ID_ROL_ADMIN = 3;
const ID_ROL_EMPRENDEDOR = 2;

const ID_ESTADO_PENDIENTE = 1;
const ID_ESTADO_ACTIVO = 2;
const ID_ESTADO_RECHAZADO = 4;

export default function AdminSolicitudesEmprendedor() {
  const [authUser, setAuthUser] = useState(null);
  const [adminPerfil, setAdminPerfil] = useState(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // Verificar que sea admin y cargar solicitudes
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
        return;
      }
      setAuthUser(data.user);

      const { data: perfil, error: perfilError } = await supabase
        .from("tbl_usuario")
        .select("*")
        .eq("d_correo_electronico", data.user.email)
        .single();

      if (perfilError || !perfil) {
        console.error(perfilError);
        setErrorMsg("No se pudo cargar tu perfil de administrador.");
        setLoading(false);
        return;
      }

      if (perfil.c_id_rol !== ID_ROL_ADMIN) {
        navigate("/home");
        return;
      }

      setAdminPerfil(perfil);
      await cargarSolicitudes("");
      setLoading(false);
    };

    init();
  }, [navigate]);

  // Cargar solicitudes pendientes (con o sin filtro)
  const cargarSolicitudes = async (term = "") => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    let query = supabase
      .from("tbl_emprendedor")
      .select("*")
      .eq("c_id_estado_negocio", ID_ESTADO_PENDIENTE);

    const t = term.trim();
    if (t) {
      query = query.or(
        `d_nombre_negocio.ilike.%${t}%,d_nombre_propietario.ilike.%${t}%,d_correo_electronico.ilike.%${t}%`
      );
    }

    query = query.order("c_id_emprendedor", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setErrorMsg("No se pudieron cargar las solicitudes.");
      setSolicitudes([]);
    } else {
      setSolicitudes(data || []);
    }

    setLoading(false);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await cargarSolicitudes(search);
  };

  const handleClearSearch = async () => {
    setSearch("");
    await cargarSolicitudes("");
  };

  // Aprobar solicitud: ACTIVO + cambiar rol del usuario a EMPRENDEDOR
  const handleAprobar = async (sol) => {
    setProcessingId(sol.c_id_emprendedor);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1) Cambiar estado del negocio a ACTIVO
      const { error: negocioError } = await supabase
        .from("tbl_emprendedor")
        .update({ c_id_estado_negocio: ID_ESTADO_ACTIVO })
        .eq("c_id_emprendedor", sol.c_id_emprendedor);

      if (negocioError) {
        console.error(negocioError);
        setErrorMsg("No se pudo actualizar el estado del negocio.");
        return;
      }

      // 2) Cambiar rol del usuario a EMPRENDEDOR
      const { error: usuarioError } = await supabase
        .from("tbl_usuario")
        .update({ c_id_rol: ID_ROL_EMPRENDEDOR })
        .eq("c_id_usuario", sol.c_id_usuario);

      if (usuarioError) {
        console.error(usuarioError);
        setErrorMsg(
          "El negocio se activó, pero no se pudo actualizar el rol del usuario."
        );
        return;
      }

      // 3) Quitar la solicitud de la lista (ya no está pendiente)
      setSolicitudes((prev) =>
        prev.filter((n) => n.c_id_emprendedor !== sol.c_id_emprendedor)
      );

      setSuccessMsg("Solicitud aprobada correctamente.");
    } finally {
      setProcessingId(null);
    }
  };

  // Rechazar solicitud: cambia estado a RECHAZADO
  const handleRechazar = async (sol) => {
    setProcessingId(sol.c_id_emprendedor);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("tbl_emprendedor")
        .update({ c_id_estado_negocio: ID_ESTADO_RECHAZADO })
        .eq("c_id_emprendedor", sol.c_id_emprendedor);

      if (error) {
        console.error(error);
        setErrorMsg("No se pudo rechazar la solicitud.");
        return;
      }

      setSolicitudes((prev) =>
        prev.filter((n) => n.c_id_emprendedor !== sol.c_id_emprendedor)
      );

      setSuccessMsg("Solicitud rechazada.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !solicitudes.length && !errorMsg) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card home-card">
        {/* Encabezado */}
        <header className="home-header">
          <div className="brand">
            <div className="logo">
              UCR<span>Food</span>
            </div>
            <p className="subtitle">
              Solicitudes de emprendedores — aprobación de negocios
            </p>
          </div>

          <div className="home-header-right">
            <button
              className="btn-outline"
              type="button"
              onClick={() => navigate("/admin")}
            >
              Volver al panel
            </button>
          </div>
        </header>

        <hr className="home-divider" />

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        {/* Buscador */}
        <section className="home-section">
          <h2 className="home-section-title">Solicitudes pendientes</h2>

          <form className="admin-search-row" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Buscar por negocio, propietario o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Buscar
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={handleClearSearch}
            >
              Limpiar
            </button>
          </form>
        </section>

        {/* Tabla de solicitudes */}
        <section className="home-section">
          <h2 className="home-section-title">
            Resultados ({solicitudes.length})
          </h2>

          {loading && <p>Cargando solicitudes...</p>}

          {!loading && solicitudes.length === 0 && (
            <p>No hay solicitudes pendientes en este momento.</p>
          )}

          {!loading && solicitudes.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Negocio</th>
                    <th>Propietario</th>
                    <th>Identificación</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={s.c_id_emprendedor}>
                      <td data-label="ID">{s.c_id_emprendedor}</td>
                      <td data-label="Negocio">{s.d_nombre_negocio}</td>
                      <td data-label="Propietario">
                        {s.d_nombre_propietario}
                      </td>
                      <td data-label="Identificación">
                        {s.d_num_identificacion}
                      </td>
                      <td data-label="Teléfono">{s.d_telefono}</td>
                      <td data-label="Correo">{s.d_correo_electronico}</td>
                      <td data-label="Acciones">
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleAprobar(s)}
                            disabled={processingId === s.c_id_emprendedor}
                          >
                            {processingId === s.c_id_emprendedor
                              ? "Procesando..."
                              : "Aprobar"}
                          </button>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => handleRechazar(s)}
                            disabled={processingId === s.c_id_emprendedor}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
