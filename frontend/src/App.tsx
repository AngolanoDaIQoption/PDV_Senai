import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/pdv" element={<PDV />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/clientes" element={<Clientes />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}