import { Navigate, Outlet } from "react-router-dom";
import type { Perfil, Usuario } from "../types";

interface GerenteRouteProps {
  perfisPermitidos?: Perfil[];
}

export default function GerenteRoute({ perfisPermitidos = ["GERENTE"] }: GerenteRouteProps) {
  const usuarioRaw = localStorage.getItem("usuario");
  const usuario: Usuario | null = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/pdv" replace />;
  }

  return <Outlet />;
}

