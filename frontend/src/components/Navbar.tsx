import { NavLink, useNavigate } from "react-router-dom";
import type { Usuario } from "../types";

export default function Navbar() {
  const navigate = useNavigate();
  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");

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
    <header className="navbar">
      <span className="navbar-marca">MS² Vestuário</span>

      <nav className="navbar-links">
        <NavLink to="/pdv">PDV</NavLink>
        {podeVerClientes && <NavLink to="/clientes">Clientes</NavLink>}
        {podeGerenciarProdutos && <NavLink to="/produtos">Produtos</NavLink>}
        {podeVerVendas && <NavLink to="/vendas">Vendas</NavLink>}
        {podeGerenciarUsuarios && <NavLink to="/usuarios">Usuários</NavLink>}
      </nav>

      <div className="navbar-usuario">
        {usuario && (
          <span>
            {usuario.nome} ({usuario.perfil})
          </span>
        )}
        <button className="btn btn-secundario" onClick={sair}>
          Sair
        </button>
      </div>
    </header>
  );
}