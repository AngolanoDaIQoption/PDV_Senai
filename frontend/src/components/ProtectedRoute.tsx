import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const logado = localStorage.getItem("usuario");
  return logado ? <Outlet /> : <Navigate to="/login" replace />;
}