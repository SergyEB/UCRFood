// src/pages/EditarPerfil.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

export default function EditarPerfil() {
  const [authUser, setAuthUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
    correo: "",
    direccion: "",
    alergias: "",
    enfermedades: "",
    preferencias: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoadingPerfil(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        navigate("/login");
        return;
      }

      setAuthUser(data.user);

      const { data: perfilData, error: perfilError } = await supabase
        .from("tbl_usuario")
        .select("*")
        .eq("d_correo_electronico", data.user.email)
        .single();

      if (perfilError || !perfilData) {
        console.error(perfilError);
        setErrorMsg("No se pudo cargar tu perfil. Intenta más tarde.");
      } else {
        setPerfil(perfilData);
        setForm({
          nombre: perfilData.d_nombre_completo || "",
          telefono: perfilData.d_telefono || "",
          cedula: perfilData.d_num_identificacion || "",
          correo: perfilData.d_correo_electronico || data.user.email || "",
          direccion: perfilData.d_direccion || "",
          alergias: perfilData.d_alergias || "",
          enfermedades: perfilData.d_enfermedades || "",
          preferencias: perfilData.d_preferencias_alimentarias || "",
        });
      }

      setLoadingPerfil(false);
    };

    cargarPerfil();
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validar = () => {
    if (!form.nombre.trim()) {
      setErrorMsg("El nombre completo es obligatorio.");
      return false;
    }

    if (form.telefono && !/^\d{8}$/.test(form.telefono.trim())) {
      setErrorMsg("El teléfono debe tener 8 dígitos numéricos.");
      return false;
    }

    // cédula y correo no se editan aquí para evitar líos con claves únicas.
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!perfil) return;
    if (!validar()) return;

    setSaving(true);

    const updateData = {
      d_nombre_completo: form.nombre.trim(),
      d_telefono: form.telefono.trim() || null,
      // Asegúrate de que estas columnas existan en tbl_usuario
      d_direccion: form.direccion.trim() || null,
      d_alergias: form.alergias.trim() || null,
      d_enfermedades: form.enfermedades.trim() || null,
      d_preferencias_alimentarias: form.preferencias.trim() || null,
    };

    const { error } = await supabase
      .from("tbl_usuario")
      .update(updateData)
      .eq("c_id_usuario", perfil.c_id_usuario);

    if (error) {
      console.error(error);
      setErrorMsg("No se pudieron guardar los cambios. Intenta de nuevo.");
    } else {
      setSuccessMsg("Perfil actualizado correctamente.");
    }

    setSaving(false);
  };

  const disabled = saving || loadingPerfil;

  if (loadingPerfil) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <p>Cargando tus datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="logo">
            UCR<span>Food</span>
          </div>
          <p className="subtitle">Editar perfil de usuario</p>
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        <form className="form" onSubmit={onSubmit}>
          {/* Nombre */}
          <label className="label">
            <span>Nombre completo</span>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={onChange}
              placeholder="Tu nombre completo"
            />
          </label>

          {/* Teléfono */}
          <label className="label">
            <span>Teléfono</span>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={onChange}
              placeholder="8 dígitos"
            />
          </label>

          {/* Cédula (solo lectura) */}
          <label className="label">
            <span>Número de identificación</span>
            <input
              type="text"
              name="cedula"
              value={form.cedula}
              readOnly
              disabled
            />
          </label>

          {/* Correo (solo lectura) */}
          <label className="label">
            <span>Correo</span>
            <input
              type="email"
              name="correo"
              value={form.correo}
              readOnly
              disabled
            />
          </label>

          {/* Dirección */}
          <label className="label">
            <span>Dirección</span>
            <textarea
              name="direccion"
              value={form.direccion}
              onChange={onChange}
              rows={2}
              placeholder="Dirección de contacto (opcional)"
            />
          </label>

          {/* Alergias */}
          <label className="label">
            <span>Alergias</span>
            <textarea
              name="alergias"
              value={form.alergias}
              onChange={onChange}
              rows={2}
              placeholder="Ej: alergia al maní, lácteos..."
            />
          </label>

          {/* Enfermedades */}
          <label className="label">
            <span>Enfermedades</span>
            <textarea
              name="enfermedades"
              value={form.enfermedades}
              onChange={onChange}
              rows={2}
              placeholder="Ej: diabetes, hipertensión... (opcional)"
            />
          </label>

          {/* Preferencias alimenticias */}
          <label className="label">
            <span>Preferencias alimenticias</span>
            <textarea
              name="preferencias"
              value={form.preferencias}
              onChange={onChange}
              rows={2}
              placeholder="Ej: vegetariano, vegano, sin gluten..."
            />
          </label>

          {/* Botones */}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/home")}
              disabled={disabled}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={disabled}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
