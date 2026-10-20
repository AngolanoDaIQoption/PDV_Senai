import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Vendas from "./pages/Vendas";
import Usuarios from "./pages/Usuarios.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import GerenteRoute from "./components/GerenteRoute";
import Sidebar from "./components/Sidebar";

function LayoutComSidebar() {
  const location = useLocation();
  const rotaLogin = location.pathname === "/login" || location.pathname === "/";

  if (rotaLogin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="conteudo-principal">
        <Routes>
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

          <Route path="*" element={<Navigate to="/pdv" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <LayoutComSidebar />;
}