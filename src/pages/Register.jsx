import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import { supabase } from '../../services/supabase'; // ajusta la ruta si es distinta


export default function Register(){
  const [f, setF] = useState({
    nombre:"", apellidos:"", cedula:"", email:"", telefono:"", rol:"", password:"", confirm:""
  });
  const [loading, setLoading] = useState(false);

  // ==== Validaciones RF-USU-01-1 ====
  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const isPhoneCR = (v) => /^\d{8}$/.test(v);          // 8 dígitos
  const isCedulaCR = (v) => /^\d{9}$/.test(v);         // 9 dígitos (ajusta si tu formato difiere)
  const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/; // 8+, 1 mayús, 1 minús, 1 número
  const passOK = (v) => passRegex.test(v);

  const onChange = (e)=>{
    const {name, value} = e.target;
    setF(s=>({...s, [name]: value}));
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

  const onSubmit = async (e)=>{
    e.preventDefault();
    if(!formReady) return;
    setLoading(true);
    // Luego: supabase.auth.signUp({ email: f.email, password: f.password }) + tabla profiles
    setTimeout(()=>{
      setLoading(false);
      nav("/login");
    }, 600);
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
            <input className="input" name="nombre" value={f.nombre} onChange={onChange} required/>
          </label>

          <label className="label">
            Apellidos
            <input className="input" name="apellidos" value={f.apellidos} onChange={onChange} required/>
          </label>

          <label className="label">
            Cédula
            <input className="input" name="cedula" value={f.cedula} onChange={onChange} placeholder="9 dígitos" required/>
          </label>
          {f.cedula && !isCedulaCR(f.cedula) && (
            <small style={{color:"#ef4444"}}>Cédula inválida (9 dígitos).</small>
          )}

          <label className="label">
            Correo
            <input className="input" type="email" name="email" value={f.email} onChange={onChange} required/>
          </label>
          {f.email && !isEmail(f.email) && (
            <small style={{color:"#ef4444"}}>Correo no válido.</small>
          )}

          <label className="label">
            Número de teléfono
            <input className="input" name="telefono" value={f.telefono} onChange={onChange} placeholder="88888888" required/>
          </label>
          {f.telefono && !isPhoneCR(f.telefono) && (
            <small style={{color:"#ef4444"}}>Teléfono inválido (8 dígitos).</small>
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
            Contraseña <small style={{color:"#64748b", fontWeight:400}}>8+, 1 mayúscula, 1 minúscula y 1 número</small>
            <input className="input" type="password" name="password" value={f.password} onChange={onChange} required/>
          </label>
          {f.password && !passOK(f.password) && (
            <small style={{color:"#ef4444"}}>
              Debe cumplir: 8+ caracteres, una mayúscula, una minúscula y un número.
            </small>
          )}

          <label className="label">
            Confirmar contraseña
            <input className="input" type="password" name="confirm" value={f.confirm} onChange={onChange} required/>
          </label>
          {f.confirm && f.password!==f.confirm && (
            <small style={{color:"#ef4444"}}>Las contraseñas no coinciden.</small>
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
