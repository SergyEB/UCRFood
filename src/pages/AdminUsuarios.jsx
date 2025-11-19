import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

// Ajusta estos valores a tu tabla real
const ID_ROL_ADMIN = 3;
const ID_ESTADO_ACTIVO = 1;
const ID_ESTADO_INACTIVO = 2;

const ESTADO_LABELS = {
  [ID_ESTADO_ACTIVO]: "ACTIVO",
  [ID_ESTADO_INACTIVO]: "INACTIVO",
};

export default function AdminUsuarios() {
  const [authUser, setAuthUser] = useState(null);
  const [adminPerfil, setAdminPerfil] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // Verificar que sea admin y cargar lista
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

      // Perfil del usuario autenticado
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

      // Si no es admin, lo regresamos al home
      if (perfil.c_id_rol !== ID_ROL_ADMIN) {
        navigate("/home");
        return;
      }

      setAdminPerfil(perfil);
      await cargarUsuarios("");
      setLoading(false);
    };

    init();
  }, [navigate]);

  // Cargar usuarios (con o sin filtro)
  const cargarUsuarios = async (term = "") => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    let query = supabase.from("tbl_usuario").select("*");

    const t = term.trim();
    if (t) {
      query = query.or(
        `d_nombre_completo.ilike.%${t}%,d_correo_electronico.ilike.%${t}%,d_num_identificacion.ilike.%${t}%`
      );
    }

    query = query.order("c_id_usuario", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setErrorMsg("No se pudieron cargar los usuarios.");
      setUsuarios([]);
    } else {
      setUsuarios(data || []);
    }

    setLoading(false);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await cargarUsuarios(search);
  };

  const handleClearSearch = async () => {
    setSearch("");
    await cargarUsuarios("");
  };

  const getEstadoLabel = (id) => ESTADO_LABELS[id] || `#${id}`;

  // Activar / desactivar cuenta
  const toggleEstado = async (usuario) => {
    if (!usuario) return;

    // (opcional) evitar que el admin se desactive a sí mismo
    if (authUser && usuario.d_correo_electronico === authUser.email) {
      setErrorMsg("No puedes desactivar tu propia cuenta.");
      return;
    }

    const estadoActual = usuario.c_id_estado_usuario;
    const nuevoEstado =
      estadoActual === ID_ESTADO_ACTIVO
        ? ID_ESTADO_INACTIVO
        : ID_ESTADO_ACTIVO;

    setSavingId(usuario.c_id_usuario);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase
      .from("tbl_usuario")
      .update({ c_id_estado_usuario: nuevoEstado })
      .eq("c_id_usuario", usuario.c_id_usuario);

    if (error) {
      console.error(error);
      setErrorMsg("No se pudo actualizar el estado de la cuenta.");
    } else {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.c_id_usuario === usuario.c_id_usuario
            ? { ...u, c_id_estado_usuario: nuevoEstado }
            : u
        )
      );
      setSuccessMsg("Estado de la cuenta actualizado correctamente.");
    }

    setSavingId(null);
  };

  if (loading && !usuarios.length && !errorMsg) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <p>Cargando usuarios...</p>
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
              Administración de usuarios — activar y desactivar cuentas
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
          <h2 className="home-section-title">Búsqueda de usuarios</h2>

          <form className="admin-search-row" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o identificación..."
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

        {/* Tabla de usuarios */}
        <section className="home-section">
          <h2 className="home-section-title">
            Usuarios registrados ({usuarios.length})
          </h2>

          {loading && <p>Cargando usuarios...</p>}

          {!loading && usuarios.length === 0 && (
            <p>No se encontraron usuarios con ese criterio.</p>
          )}

          {!loading && usuarios.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Identificación</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const esActivo = u.c_id_estado_usuario === ID_ESTADO_ACTIVO;
                    const esYo =
                      authUser &&
                      u.d_correo_electronico === authUser.email;

                    return (
                      <tr key={u.c_id_usuario}>
                        <td>{u.c_id_usuario}</td>
                        <td>{u.d_nombre_completo}</td>
                        <td>{u.d_correo_electronico}</td>
                        <td>{u.d_num_identificacion}</td>
                        <td>{u.c_id_rol ?? "—"}</td>
                        <td>
                          <span
                            className={
                              esActivo
                                ? "badge badge-activo"
                                : "badge badge-inactivo"
                            }
                          >
                            {getEstadoLabel(u.c_id_estado_usuario)}
                          </span>
                          {esYo && (
                            <span className="badge badge-yo">Tú</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={esActivo ? "btn-outline" : "btn-primary"}
                            onClick={() => toggleEstado(u)}
                            disabled={savingId === u.c_id_usuario || esYo}
                          >
                            {savingId === u.c_id_usuario
                              ? "Guardando..."
                              : esActivo
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
