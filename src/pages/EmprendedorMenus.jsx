import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

// Constantes (ajusta si cambian tus IDs)
const ID_ROL_EMPRENDEDOR = 2;
// Estado ACTIVO del negocio (ajusta si en tbl_estado_negocio usaste otro id)
const ID_ESTADO_NEGOCIO_ACTIVO = 2;

export default function EmprendedorMenus() {
  const [authUser, setAuthUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [negocio, setNegocio] = useState(null);

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingMenuId, setEditingMenuId] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    ingredientes: "",
    info_nutricional: "",
    precio: "",
    disponible_desde: "",
    disponible_hasta: "",
    imagen_url: "",
  });

  const navigate = useNavigate();

  // Cargar usuario, perfil, negocio activo y menús
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // 1) Usuario autenticado
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
        return;
      }
      setAuthUser(data.user);

      // 2) Perfil en tbl_usuario
      const { data: perfilData, error: perfilError } = await supabase
        .from("tbl_usuario")
        .select("*")
        .eq("d_correo_electronico", data.user.email)
        .single();

      if (perfilError || !perfilData) {
        console.error(perfilError);
        setErrorMsg("No se pudo cargar tu perfil.");
        setLoading(false);
        return;
      }

      if (perfilData.c_id_rol !== ID_ROL_EMPRENDEDOR) {
        // Solo los emprendedores pueden gestionar menús
        navigate("/home");
        return;
      }

      setPerfil(perfilData);

      // 3) Buscar negocio activo asociado al usuario
      const { data: negocioData, error: negocioError } = await supabase
        .from("tbl_emprendedor")
        .select("*")
        .eq("c_id_usuario", perfilData.c_id_usuario)
        .eq("c_id_estado_negocio", ID_ESTADO_NEGOCIO_ACTIVO)
        .maybeSingle();

      if (negocioError) {
        console.error(negocioError);
        setErrorMsg("No se pudo cargar tu negocio.");
        setLoading(false);
        return;
      }

      if (!negocioData) {
        setNegocio(null);
        setLoading(false);
        return;
      }

      setNegocio(negocioData);

      // 4) Cargar menús del negocio
      await cargarMenus(negocioData.c_id_emprendedor);

      setLoading(false);
    };

    cargarDatos();
  }, [navigate]);

  const cargarMenus = async (c_id_emprendedor) => {
    const { data, error } = await supabase
      .from("tbl_menu")
      .select("*")
      .eq("c_id_emprendedor", c_id_emprendedor)
      .order("c_id_menu", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMsg("No se pudieron cargar los menús.");
      setMenus([]);
    } else {
      setMenus(data || []);
    }
  };

  const resetForm = () => {
    setEditingMenuId(null);
    setForm({
      titulo: "",
      descripcion: "",
      ingredientes: "",
      info_nutricional: "",
      precio: "",
      disponible_desde: "",
      disponible_hasta: "",
      imagen_url: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validar = () => {
    if (!form.titulo.trim()) {
      setErrorMsg("El título del menú es obligatorio.");
      return false;
    }
    if (!form.ingredientes.trim()) {
      setErrorMsg("Debes indicar los ingredientes.");
      return false;
    }
    if (!form.precio.trim()) {
      setErrorMsg("El precio es obligatorio.");
      return false;
    }
    const numPrecio = Number(form.precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setErrorMsg("El precio debe ser un número mayor a 0.");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!negocio) {
      setErrorMsg(
        "No puedes registrar menús porque tu negocio aún no está activo."
      );
      return;
    }

    if (!validar()) return;

    setSaving(true);

    const payload = {
      c_id_emprendedor: negocio.c_id_emprendedor,
      d_titulo_menu: form.titulo.trim(),
      d_descripcion: form.descripcion.trim() || null,
      d_ingredientes: form.ingredientes.trim(),
      d_info_nutricional: form.info_nutricional.trim() || null,
      m_precio: Number(form.precio),
      f_disponible_desde: form.disponible_desde || null,
      f_disponible_hasta: form.disponible_hasta || null,
      d_imagen_url: form.imagen_url.trim() || null,
    };

    try {
      if (!editingMenuId) {
        // Crear nuevo menú
        const { data: insertData, error: insertError } = await supabase
          .from("tbl_menu")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          console.error(insertError);
          setErrorMsg("No se pudo registrar el menú. Intenta de nuevo.");
        } else {
          setMenus((prev) => [insertData, ...prev]);
          setSuccessMsg(
            "Menú registrado correctamente. Quedará disponible para revisión."
          );
          resetForm();
        }
      } else {
        // Actualizar menú existente
        const { error: updateError } = await supabase
          .from("tbl_menu")
          .update(payload)
          .eq("c_id_menu", editingMenuId);

        if (updateError) {
          console.error(updateError);
          setErrorMsg("No se pudieron guardar los cambios del menú.");
        } else {
          setMenus((prev) =>
            prev.map((m) =>
              m.c_id_menu === editingMenuId ? { ...m, ...payload } : m
            )
          );
          setSuccessMsg("Menú actualizado correctamente.");
          resetForm();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (menu) => {
    setEditingMenuId(menu.c_id_menu);
    setForm({
      titulo: menu.d_titulo_menu || "",
      descripcion: menu.d_descripcion || "",
      ingredientes: menu.d_ingredientes || "",
      info_nutricional: menu.d_info_nutricional || "",
      precio: String(menu.m_precio ?? ""),
      disponible_desde: menu.f_disponible_desde
        ? menu.f_disponible_desde.slice(0, 16) // "YYYY-MM-DDTHH:mm"
        : "",
      disponible_hasta: menu.f_disponible_hasta
        ? menu.f_disponible_hasta.slice(0, 16)
        : "",
      imagen_url: menu.d_imagen_url || "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <p>Cargando menús...</p>
        </div>
      </div>
    );
  }

  // Si no hay negocio activo
  if (!negocio) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <div className="brand">
            <div className="logo">
              UCR<span>Food</span>
            </div>
            <p className="subtitle">Gestión de menús</p>
          </div>
          <p className="error-msg">
            No tienes un negocio activo en la plataforma. Primero debes
            registrar tu negocio y esperar aprobación antes de crear menús.
          </p>
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/emprendedor/mi-negocio")}
          >
            Ir a "Mi negocio"
          </button>
        </div>
      </div>
    );
  }

  const esEdicion = Boolean(editingMenuId);

  return (
    <div className="login-wrap">
      <div className="login-card home-card">
        <div className="brand">
          <div className="logo">
            UCR<span>Food</span>
          </div>
          <p className="subtitle">
            {esEdicion ? "Editar menú" : "Registrar nuevo menú"}
          </p>
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        <p style={{ fontSize: ".85rem", color: "#6b7280", marginBottom: "0.75rem" }}>
          Negocio: <strong>{negocio.d_nombre_negocio}</strong>
        </p>

        {/* Formulario de menú */}
        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            <span>Título del menú *</span>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={onChange}
              placeholder="Ej: Casado con pollo a la plancha"
            />
          </label>

          <label className="label">
            <span>Descripción (opcional)</span>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              rows={2}
              placeholder="Descripción breve del plato."
            />
          </label>

          <label className="label">
            <span>Ingredientes *</span>
            <textarea
              name="ingredientes"
              value={form.ingredientes}
              onChange={onChange}
              rows={3}
              placeholder="Lista de ingredientes principales."
            />
          </label>

          <label className="label">
            <span>Información nutricional (opcional)</span>
            <textarea
              name="info_nutricional"
              value={form.info_nutricional}
              onChange={onChange}
              rows={3}
              placeholder="Ej: kcal aproximadas, macros, etc."
            />
          </label>

          <label className="label">
            <span>Precio (₡) *</span>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio"
              value={form.precio}
              onChange={onChange}
              placeholder="Ej: 3500"
            />
          </label>

          <label className="label">
            <span>Disponible desde (opcional)</span>
            <input
              type="datetime-local"
              name="disponible_desde"
              value={form.disponible_desde}
              onChange={onChange}
            />
          </label>

          <label className="label">
            <span>Disponible hasta (opcional)</span>
            <input
              type="datetime-local"
              name="disponible_hasta"
              value={form.disponible_hasta}
              onChange={onChange}
            />
          </label>

          <label className="label">
            <span>URL de imagen (opcional)</span>
            <input
              type="text"
              name="imagen_url"
              value={form.imagen_url}
              onChange={onChange}
              placeholder="https://..."
            />
          </label>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                if (esEdicion) resetForm();
                else navigate("/home");
              }}
              disabled={saving}
            >
              {esEdicion ? "Cancelar edición" : "Volver al inicio"}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Guardando..."
                : esEdicion
                ? "Guardar cambios"
                : "Registrar menú"}
            </button>
          </div>
        </form>

        {/* Lista de menús existentes */}
        <section className="home-section" style={{ marginTop: "1.75rem" }}>
          <h2 className="home-section-title">
            Menús registrados ({menus.length})
          </h2>

          {menus.length === 0 && (
            <p style={{ fontSize: ".9rem", color: "#6b7280" }}>
              Aún no has registrado menús para este negocio.
            </p>
          )}

          {menus.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Precio</th>
                    <th>Disponible</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((m) => (
                    <tr key={m.c_id_menu}>
                      <td data-label="ID">{m.c_id_menu}</td>
                      <td data-label="Título">{m.d_titulo_menu}</td>
                      <td data-label="Precio">
                        ₡{Number(m.m_precio).toFixed(2)}
                      </td>
                      <td data-label="Disponible">
                        {m.f_disponible_desde
                          ? m.f_disponible_desde.slice(0, 16).replace("T", " ")
                          : "—"}
                        {m.f_disponible_hasta
                          ? ` → ${m.f_disponible_hasta
                              .slice(0, 16)
                              .replace("T", " ")}`
                          : ""}
                      </td>
                      <td data-label="Acciones">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => handleEditar(m)}
                        >
                          Editar
                        </button>
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
