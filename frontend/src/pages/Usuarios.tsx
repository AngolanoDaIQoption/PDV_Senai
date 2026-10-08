import { useEffect, useState } from "react";
import type { Perfil, Usuario } from "../types";
import { atualizarUsuario, buscarUsuarios } from "../services/api";

const perfis: Perfil[] = ["CAIXA", "SUPERVISOR"];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  async function carregarUsuarios() {
    try {
      setErro("");
      const dados = await buscarUsuarios();
      setUsuarios(dados);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function mudarPerfil(id: number, perfil: Perfil) {
    try {
      setSalvandoId(id);
      setErro("");
      await atualizarUsuario(id, { perfil });
      setUsuarios((lista) =>
        lista.map((usuario) => (usuario.id === id ? { ...usuario, perfil } : usuario))
      );
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar o perfil.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function alternarAtivo(usuario: Usuario) {
    if (usuario.perfil === "GERENTE") {
      setErro("O perfil de gerente não pode ser inativado.");
      return;
    }

    try {
      setSalvandoId(usuario.id);
      setErro("");
      const ativo = !(usuario.ativo ?? true);
      await atualizarUsuario(usuario.id, { ativo });
      setUsuarios((lista) =>
        lista.map((item) => (item.id === usuario.id ? { ...item, ativo } : item))
      );
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível alterar o status do usuário.");
    } finally {
      setSalvandoId(null);
    }
  }

  return (
    <div className="pagina">
      <section className="card">
        <h2>Gestão de usuários</h2>

        {erro && <p className="erro">{erro}</p>}

        {carregando ? (
          <p className="texto-suave">Carregando usuários...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>#{usuario.id}</td>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  <td>
                    {usuario.perfil === "GERENTE" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: "#f2f4f7",
                          color: "#344054",
                          fontWeight: 600,
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        GERENTE
                      </span>
                    ) : (
                      <select
                        value={usuario.perfil}
                        onChange={(event) => mudarPerfil(usuario.id, event.target.value as Perfil)}
                        disabled={salvandoId === usuario.id}
                      >
                        {perfis.map((perfil) => (
                          <option key={perfil} value={perfil}>
                            {perfil}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <span
                      className={usuario.ativo === false ? "texto-suave" : ""}
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: usuario.ativo === false ? "#eef1f5" : "#e8f5ee",
                        color: usuario.ativo === false ? "#475467" : "#027a48",
                        fontWeight: 600,
                      }}
                    >
                      {usuario.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => alternarAtivo(usuario)}
                      disabled={salvandoId === usuario.id || usuario.perfil === "GERENTE"}
                      title={usuario.perfil === "GERENTE" ? "Gerente não pode ser inativado" : "Alterar status"}
                    >
                      {usuario.perfil === "GERENTE"
                        ? "Bloqueado"
                        : usuario.ativo === false
                          ? "Ativar"
                          : "Inativar"}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="texto-suave">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
