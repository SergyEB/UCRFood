import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ResetPassword from "./pages/ResetPassword"; // o la ruta donde lo pongas
import EditarPerfil from "./pages/EditarPerfil";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsuarios from "./pages/AdminUsuarios";
import MiNegocio from "./pages/MiNegocio";
import AdminSolicitudesEmprendedor from "./pages/AdminSolicitudesEmprendedor";

export default function App() {
  return (

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/perfil" element={<EditarPerfil />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      <Route path="/mi-negocio" element={<MiNegocio />} />
      <Route path="/admin/solicitudes-emprendedor" element={<AdminSolicitudesEmprendedor />} />
    </Routes>

  );
}
