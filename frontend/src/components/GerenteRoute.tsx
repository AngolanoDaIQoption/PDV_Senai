import { Navigate, Outlet } from "react-router-dom";
import type { Usuario } from "../types";

export default function GerenteRoute() {
  const usuarioRaw = localStorage.getItem("usuario");
  const usuario: Usuario | null = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.perfil !== "GERENTE") {
    return <Navigate to="/pdv" replace />;
  }

  return <Outlet />;
}

