import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { Usuario } from "../types";
import { useTheme } from "../utils/useTheme";

export default function Sidebar() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");
  const { isDark, toggleTheme } = useTheme();

  const podeVerClientes = ["CAIXA", "GERENTE"].includes(usuario?.perfil ?? "");
  const podeGerenciarProdutos = ["SUPERVISOR", "GERENTE"].includes(usuario?.perfil ?? "");
  const podeVerVendas = usuario?.perfil === "GERENTE";
  const podeGerenciarUsuarios = usuario?.perfil === "GERENTE";

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  }

  return (
    <aside className={`sidebar ${menuAberto ? "" : "recolhida"}`}>
      <div>
        <div className="sidebar-header">
          <div className="sidebar-marca" data-tooltip="MS² Vestuário">
            <Store size={18} />
            <span>MS² Vestuário</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setMenuAberto((valor) => !valor)}
            aria-label={menuAberto ? "Recolher menu" : "Expandir menu"}
            data-tooltip={menuAberto ? "Recolher menu" : "Expandir menu"}
          >
            {menuAberto ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          <NavLink
            to="/pdv"
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            aria-label="PDV"
            data-tooltip="PDV"
          >
            <LayoutDashboard size={18} />
            <span>PDV</span>
          </NavLink>

          {podeVerClientes && (
            <NavLink
              to="/clientes"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              aria-label="Clientes"
              data-tooltip="Clientes"
            >
              <Users size={18} />
              <span>Clientes</span>
            </NavLink>
          )}

          {podeGerenciarProdutos && (
            <NavLink
              to="/produtos"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              aria-label="Produtos"
              data-tooltip="Produtos"
            >
              <Package size={18} />
              <span>Produtos</span>
            </NavLink>
          )}

          {podeVerVendas && (
            <NavLink
              to="/vendas"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              aria-label="Vendas"
              data-tooltip="Vendas"
            >
              <ShoppingCart size={18} />
              <span>Vendas</span>
            </NavLink>
          )}

          {podeGerenciarUsuarios && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              aria-label="Usuários"
              data-tooltip="Usuários"
            >
              <ShieldCheck size={18} />
              <span>Usuários</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="btn btn-secundario theme-toggle sidebar-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          data-tooltip={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
        >
          <span>{isDark ? "☀️" : "🌙"}</span>
          <span>{isDark ? "Claro" : "Escuro"}</span>
        </button>

        {usuario && (
          <div
            className="usuario-chip sidebar-user"
            data-tooltip={`${usuario.nome} · ${usuario.perfil}`}
          >
            <span className="avatar">{usuario.nome?.charAt(0).toUpperCase() ?? "U"}</span>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-nome">{usuario.nome}</span>
              <span className="sidebar-user-role">{usuario.perfil}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-secundario sidebar-logout"
          onClick={sair}
          aria-label="Sair"
          data-tooltip="Sair"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
