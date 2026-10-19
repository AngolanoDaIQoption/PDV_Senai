import { Navigate, Outlet } from "react-router-dom"; // Componente de navegação e renderização da rota filha
import Navbar from "./Navbar"; // Barra superior do sistema, exibida em páginas internas

// Sem token, a pessoa volta ao login; com ele, mostramos o menu e a tela filha da rota.
// Este guard é o primeiro nível de segurança: exige autenticação antes de abrir qualquer área interna.
export default function ProtectedRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}