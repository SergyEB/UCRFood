import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import supabase from '../services/supabase'; // ya lo tienes

export default function Register() {
  const [f, setF] = useState({
    nombre: "", apellidos: "", cedula: "", email: "", telefono: "", rol: "", password: "", confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");   // <<< NUEVO

  // ==== Validaciones RF-USU-01-1 ====
  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const isPhoneCR = (v) => /^\d{8}$/.test(v);          // 8 dígitos
  const isCedulaCR = (v) => /^\d{9}$/.test(v);         // 9 dígitos (ajusta si tu formato difiere)
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // 8+, 1 mayús, 1 minús, 1 número
  const passOK = (v) => passRegex.test(v);

  const onChange = (e) => {
    const { name, value } = e.target;
    setF(s => ({ ...s, [name]: value }));
    setErrorMsg("");   // limpiar error al escribir
  };

  const nav = useNavigate();

  const formReady =
    f.nombre &&
    f.apellidos &&
    isCedulaCR(f.cedula) &&
    isEmail(f.email) &&
    isPhoneCR(f.telefono) &&
    f.rol &&
    passOK(f.password) &&
    f.password === f.confirm &&
    !loading;

  // <<< NUEVO: función para convertir el rol string al id numérico de tu tabla tbl_rol
  // AJUSTA estos números a los que tengas en tu BD
  const getRolId = (rolString) => {
    switch (rolString) {
      case "ESTUDIANTE":
        return 1;
      case "EMPRENDEDOR":
        return 2;
      case "ADMIN":
        return 3;
      default:
        return 1; // por defecto estudiante
    }
  };

  const onSubmit = async (e) => {
  e.preventDefault();
  if (!formReady) return;

  setLoading(true);
  setErrorMsg("");

  try {
    const nombreCompleto = `${f.nombre} ${f.apellidos}`.trim();
    const rolId = getRolId(f.rol);

    // 1) REGISTRO EN SUPABASE AUTH
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
    });

    if (signUpError) {
      console.error(signUpError);
      setErrorMsg(signUpError.message || "Error al registrar en Supabase Auth.");
      return;
    }

    // (Opcional) id del usuario de auth, por si después agregas una columna auth_user_id
    const authUserId = signUpData.user?.id;

    // 2) INSERT EN TU TABLA tbl_usuario
    const { error: insertError } = await supabase
      .from("tbl_usuario")
      .insert([
        {
          d_nombre_completo: nombreCompleto,
          d_num_identificacion: f.cedula,
          d_correo_electronico: f.email,
          d_telefono: f.telefono,
          d_contrasenia: f.password,      // Para el proyecto; en producción NO se guarda plano
          c_id_rol: rolId,
          c_id_estado_usuario: 1,        // id del estado ACTIVO
          // si luego creas una columna auth_user_id:
          // auth_user_id: authUserId,
        },
      ]);

    if (insertError) {
      console.error(insertError);
      setErrorMsg(insertError.message || "Error al guardar los datos del usuario.");
      return;
    }

    // OK: redirigimos a login
    nav("/login");
  } catch (err) {
    console.error(err);
    setErrorMsg("Ocurrió un error inesperado al registrar el usuario.");
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="brand">
          <div className="logo">Crear cuenta</div>
          <p className="subtitle">Registro UCRFood</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="label">
            Nombre
            <input className="input" name="nombre" value={f.nombre} onChange={onChange} required />
          </label>

          <label className="label">
            Apellidos
            <input className="input" name="apellidos" value={f.apellidos} onChange={onChange} required />
          </label>

          <label className="label">
            Cédula
            <input className="input" name="cedula" value={f.cedula} onChange={onChange} placeholder="9 dígitos" required />
          </label>
          {f.cedula && !isCedulaCR(f.cedula) && (
            <small style={{ color: "#ef4444" }}>Cédula inválida (9 dígitos).</small>
          )}

          <label className="label">
            Correo
            <input className="input" type="email" name="email" value={f.email} onChange={onChange} required />
          </label>
          {f.email && !isEmail(f.email) && (
            <small style={{ color: "#ef4444" }}>Correo no válido.</small>
          )}

          <label className="label">
            Número de teléfono
            <input className="input" name="telefono" value={f.telefono} onChange={onChange} placeholder="88888888" required />
          </label>
          {f.telefono && !isPhoneCR(f.telefono) && (
            <small style={{ color: "#ef4444" }}>Teléfono inválido (8 dígitos).</small>
          )}

          <label className="label">
            Rol
            <select className="input" name="rol" value={f.rol} onChange={onChange} required>
              <option value="">Selecciona…</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="EMPRENDEDOR">Emprendedor</option>
              <option value="ADMIN">Administrativo</option>
            </select>
          </label>

          <label className="label">
            Contraseña <small style={{ color: "#64748b", fontWeight: 400 }}>8+, 1 mayúscula, 1 minúscula y 1 número</small>
            <input className="input" type="password" name="password" value={f.password} onChange={onChange} required />
          </label>
          {f.password && !passOK(f.password) && (
            <small style={{ color: "#ef4444" }}>
              Debe cumplir: 8+ caracteres, una mayúscula, una minúscula y un número.
            </small>
          )}

          <label className="label">
            Confirmar contraseña
            <input className="input" type="password" name="confirm" value={f.confirm} onChange={onChange} required />
          </label>
          {f.confirm && f.password !== f.confirm && (
            <small style={{ color: "#ef4444" }}>Las contraseñas no coinciden.</small>
          )}

          {/* Mostrar error general si existe */}
          {errorMsg && (
            <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>{errorMsg}</p>
          )}

          <button className="btn btn-primary" disabled={!formReady}>
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="footer">
          ¿Ya tienes cuenta? <Link className="link" to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
