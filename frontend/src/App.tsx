import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Vendas from "./pages/Vendas";
import Usuarios from "./pages/Usuarios.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import GerenteRoute from "./components/GerenteRoute";

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