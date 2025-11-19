// src/pages/MiNegocio.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";
import "./login.css";

// Roles (ajusta si usas otros ids)
const ID_ROL_EMPRENDEDOR = 2;
const ID_ROL_USUARIO_EXTERNO = 4;

// Estados de negocio (ajusta si en tu tabla son otros ids)
const ID_ESTADO_PENDIENTE = 1;
const ID_ESTADO_ACTIVO = 2;
const ID_ESTADO_INACTIVO = 3;
const ID_ESTADO_RECHAZADO = 4;
const ID_ESTADO_CERRADO = 5;

const ESTADOS = {
  [ID_ESTADO_PENDIENTE]: { label: "PENDIENTE", tipo: "pendiente" },
  [ID_ESTADO_ACTIVO]: { label: "ACTIVO", tipo: "activo" },
  [ID_ESTADO_INACTIVO]: { label: "INACTIVO", tipo: "inactivo" },
  [ID_ESTADO_RECHAZADO]: { label: "RECHAZADO", tipo: "rechazado" },
  [ID_ESTADO_CERRADO]: { label: "CERRADO", tipo: "cerrado" },
};

export default function MiNegocio() {
  const [authUser, setAuthUser] = useState(null);
  const [perfil, setPerfil] = useState(null);

  const [negocio, setNegocio] = useState(null); // registro en tbl_emprendedor
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    nombre_negocio: "",
    nombre_propietario: "",
    num_identificacion: "",
    telefono: "",
    correo: "",
    datos_pago: "",
    descripcion: "",
  });

  const navigate = useNavigate();

  // Cargar usuario, perfil y negocio (si existe)
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      // 1) Auth
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

      // Solo usuarios externos o emprendedores pueden entrar
      if (
        perfilData.c_id_rol !== ID_ROL_EMPRENDEDOR &&
        perfilData.c_id_rol !== ID_ROL_USUARIO_EXTERNO
      ) {
        navigate("/home");
        return;
      }

      setPerfil(perfilData);

      // 3) Buscar negocio asociado (suponiendo uno por usuario)
      const { data: negocioData, error: negocioError } = await supabase
        .from("tbl_emprendedor")
        .select("*")
        .eq("c_id_usuario", perfilData.c_id_usuario)
        .order("c_id_emprendedor", { ascending: false })
        .limit(1)
        .maybeSingle(); // puede devolver null

      if (negocioError) {
        console.error(negocioError);
        setErrorMsg("No se pudo cargar la información del negocio.");
        setLoading(false);
        return;
      }

      setNegocio(negocioData);

      // 4) Inicializar formulario
      if (negocioData) {
        // Ya tiene negocio → modo edición
        setForm({
          nombre_negocio: negocioData.d_nombre_negocio || "",
          nombre_propietario: negocioData.d_nombre_propietario || "",
          num_identificacion: negocioData.d_num_identificacion || "",
          telefono: negocioData.d_telefono || "",
          correo: negocioData.d_correo_electronico || "",
          datos_pago: negocioData.d_datos_pago || "",
          descripcion: negocioData.d_descripcion || "",
        });
      } else {
        // No tiene negocio → form nuevo, prellenar con datos del usuario
        setForm({
          nombre_negocio: "",
          nombre_propietario: perfilData.d_nombre_completo || "",
          num_identificacion: perfilData.d_num_identificacion || "",
          telefono: perfilData.d_telefono || "",
          correo: perfilData.d_correo_electronico || data.user.email || "",
          datos_pago: "",
          descripcion: "",
        });
      }

      setLoading(false);
    };

    cargarDatos();
  }, [navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const validar = () => {
    if (!form.nombre_negocio.trim()) {
      setErrorMsg("El nombre del negocio es obligatorio.");
      return false;
    }
    if (!form.nombre_propietario.trim()) {
      setErrorMsg("El nombre del propietario es obligatorio.");
      return false;
    }
    if (!form.num_identificacion.trim()) {
      setErrorMsg("El número de identificación es obligatorio.");
      return false;
    }
    if (!/^\d{8}$/.test(form.telefono.trim())) {
      setErrorMsg("El teléfono debe tener 8 dígitos numéricos.");
      return false;
    }
    if (!form.correo.trim()) {
      setErrorMsg("El correo electrónico es obligatorio.");
      return false;
    }
    // validación sencilla de email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo.trim())) {
      setErrorMsg("El correo electrónico no tiene un formato válido.");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!perfil) return;
    if (!validar()) return;

    setSaving(true);

    const payload = {
      c_id_usuario: perfil.c_id_usuario,
      d_nombre_negocio: form.nombre_negocio.trim(),
      d_nombre_propietario: form.nombre_propietario.trim(),
      d_num_identificacion: form.num_identificacion.trim(),
      d_telefono: form.telefono.trim(),
      d_correo_electronico: form.correo.trim(),
      d_datos_pago: form.datos_pago.trim() || null,
      d_descripcion: form.descripcion.trim() || null,
    };

    try {
      if (!negocio) {
        // Crear nuevo negocio -> PENDIENTE
        const { data: insertData, error: insertError } = await supabase
          .from("tbl_emprendedor")
          .insert({
            ...payload,
            c_id_estado_negocio: ID_ESTADO_PENDIENTE,
          })
          .select()
          .single();

        if (insertError) {
          console.error(insertError);
          setErrorMsg("No se pudo registrar el negocio. Intenta de nuevo.");
        } else {
          setNegocio(insertData);
          setSuccessMsg(
            "Solicitud enviada correctamente. Tu negocio está en estado PENDIENTE."
          );
        }
      } else {
        // Actualizar negocio existente (no cambiamos estado aquí)
        const { error: updateError } = await supabase
          .from("tbl_emprendedor")
          .update(payload)
          .eq("c_id_emprendedor", negocio.c_id_emprendedor);

        if (updateError) {
          console.error(updateError);
          setErrorMsg("No se pudieron guardar los cambios. Intenta de nuevo.");
        } else {
          setNegocio((prev) => (prev ? { ...prev, ...payload } : prev));
          setSuccessMsg("Datos del negocio actualizados correctamente.");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const renderEstadoNegocio = () => {
    if (!negocio) return null;

    const info = ESTADOS[negocio.c_id_estado_negocio];
    if (!info) return null;

    const baseClass = "badge";
    let extraClass = "";
    switch (info.tipo) {
      case "activo":
        extraClass = "badge-activo";
        break;
      case "pendiente":
        extraClass = "badge-pendiente";
        break;
      case "rechazado":
        extraClass = "badge-rechazado";
        break;
      case "inactivo":
      case "cerrado":
      default:
        extraClass = "badge-inactivo";
        break;
    }

    let mensajeExtra = "";
    if (info.tipo === "pendiente") {
      mensajeExtra =
        "Tu solicitud está en revisión por la administración.";
    } else if (info.tipo === "rechazado") {
      mensajeExtra =
        "Tu solicitud fue rechazada. Puedes actualizar la información y volver a intentarlo.";
    } else if (info.tipo === "activo") {
      mensajeExtra = "Tu negocio está activo en la plataforma.";
    } else if (info.tipo === "inactivo") {
      mensajeExtra = "Tu negocio está inactivo temporalmente.";
    } else if (info.tipo === "cerrado") {
      mensajeExtra = "Este negocio está cerrado definitivamente.";
    }

    return (
      <div className="negocio-estado-box">
        <span className={`${baseClass} ${extraClass}`}>
          Estado: {info.label}
        </span>
        {mensajeExtra && <p className="negocio-estado-msg">{mensajeExtra}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="login-wrap">
        <div className="login-card home-card">
          <p>Cargando información del negocio...</p>
        </div>
      </div>
    );
  }

  const esNuevo = !negocio;

  return (
    <div className="login-wrap">
      <div className="login-card home-card">
        <div className="brand">
          <div className="logo">
            UCR<span>Food</span>
          </div>
          <p className="subtitle">
            {esNuevo ? "Registrar mi negocio" : "Actualizar datos de mi negocio"}
          </p>
        </div>

        {errorMsg && <p className="error-msg">{errorMsg}</p>}
        {successMsg && <p className="success-msg">{successMsg}</p>}

        {/* Estado actual del negocio (si existe) */}
        {renderEstadoNegocio()}

        <form className="form" onSubmit={onSubmit}>
          {/* Nombre del negocio */}
          <label className="label">
            <span>Nombre del negocio *</span>
            <input
              type="text"
              name="nombre_negocio"
              value={form.nombre_negocio}
              onChange={onChange}
              placeholder="Ej: Sodas Doña Tere"
            />
          </label>

          {/* Propietario */}
          <label className="label">
            <span>Nombre del propietario *</span>
            <input
              type="text"
              name="nombre_propietario"
              value={form.nombre_propietario}
              onChange={onChange}
              placeholder="Nombre de la persona dueña del negocio"
            />
          </label>

          {/* Identificación */}
          <label className="label">
            <span>Número de identificación *</span>
            <input
              type="text"
              name="num_identificacion"
              value={form.num_identificacion}
              onChange={onChange}
              placeholder="Cédula física o jurídica"
            />
          </label>

          {/* Teléfono */}
          <label className="label">
            <span>Teléfono de contacto *</span>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={onChange}
              placeholder="8 dígitos"
            />
          </label>

          {/* Correo */}
          <label className="label">
            <span>Correo electrónico *</span>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={onChange}
              placeholder="correo@ejemplo.com"
            />
          </label>

          {/* Datos de pago */}
          <label className="label">
            <span>Datos de pago (SINPE, cuenta, etc.)</span>
            <textarea
              name="datos_pago"
              value={form.datos_pago}
              onChange={onChange}
              rows={2}
              placeholder="Opcional: IBAN, SINPE móvil, etc."
            />
          </label>

          {/* Descripción */}
          <label className="label">
            <span>Descripción del negocio</span>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={onChange}
              rows={3}
              placeholder="Breve descripción de lo que ofreces (máx. 500 caracteres)"
            />
          </label>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/home")}
              disabled={saving}
            >
              Volver al inicio
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : esNuevo
                ? "Enviar solicitud"
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
