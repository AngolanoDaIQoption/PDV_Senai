import { Navigate, Outlet } from "react-router-dom"; // Permite redirecionar e renderizar a rota protegida
import type { Perfil, Usuario } from "../types"; // Tipos compartilhados do sistema: perfil e estrutura do usuário

interface GerenteRouteProps {
  perfisPermitidos?: Perfil[];
}

// Além de estar logado, o usuário precisa ter um dos perfis aceitos para ver a tela.
// Este guard centraliza a regra de autorização por cargo dentro do sistema.
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
