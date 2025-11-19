import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 820, textAlign: "center" }}>
        <h1 style={{ marginBottom: ".5rem" }}>Bienvenido a UCRFood</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>
          Página principal básica. Navega a las secciones disponibles.
        </p>

        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/login" style={{ padding: ".6rem 1rem", background: "#0369a1", color: "white", borderRadius: 8, textDecoration: "none" }}>
            Iniciar sesión
          </Link>
          <Link to="/register" style={{ padding: ".6rem 1rem", background: "#e2e8f0", color: "#0f172a", borderRadius: 8, textDecoration: "none" }}>
            Registrarse
          </Link>
        </div>
      </div>
    </main>
  );
}