import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";

// Sem token, a pessoa volta ao login; com ele, mostramos o menu e a tela filha da rota.
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