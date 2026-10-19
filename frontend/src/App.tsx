import { Routes, Route, Navigate } from "react-router-dom"; // Biblioteca de rotas do React: define as páginas e a navegação interna
import Login from "./pages/Login"; // Tela de login e autenticação do usuário
import PDV from "./pages/PDV"; // Página principal do caixa / ponto de venda
import Produtos from "./pages/Produtos"; // Gestão do catálogo de produtos
import Clientes from "./pages/Clientes"; // Cadastro e consulta de clientes
import Vendas from "./pages/Vendas"; // Histórico e gestão de vendas
import Usuarios from "./pages/Usuarios.tsx"; // Cadastro e controle de usuários do sistema
import ProtectedRoute from "./components/ProtectedRoute"; // Garante que só quem está logado pode acessar o app
import GerenteRoute from "./components/GerenteRoute"; // Restringe acesso por perfil (caixa, supervisor, gerente)

// Aqui definimos quais telas existem e agrupamos as que exigem login ou um perfil específico.
// A rota '*' redireciona qualquer página inexistente para a tela de login.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pdv" element={<PDV />} />

        <Route element={<GerenteRoute perfisPermitidos={["CAIXA", "GERENTE"]} />}>
          <Route path="/clientes" element={<Clientes />} />
        </Route>

        <Route element={<GerenteRoute perfisPermitidos={["SUPERVISOR", "GERENTE"]} />}>
          <Route path="/produtos" element={<Produtos />} />
        </Route>

        <Route element={<GerenteRoute perfisPermitidos={["GERENTE"]} />}>
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}