import { useEffect, useState, type FormEvent } from "react";
import type { Produto, Usuario } from "../types";
import { buscarProdutos, criarProduto, atualizarProduto, inativarProduto, reativarProduto } from "../services/api";
import { formatarMoeda } from "../utils/format";

const formVazio = {
  codigo: "",
  descricao: "",
  preco: "",
  estoque: "",
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarProdutos() {
    try {
      const dados = await buscarProdutos(true);
      setProdutos(dados);
      setErro("");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarProdutos(true)
      .then((dados) => {
        setProdutos(dados);
        setErro("");
      })
      .catch((err) => {
        console.error(err);
        setErro("Não foi possível carregar os produtos.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  function atualizar(campo: keyof typeof formVazio, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function cancelarEdicao() {
    setForm(formVazio);
    setEditandoId(null);
    setErro("");
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const codigo = form.codigo.trim();
    const descricao = form.descricao.trim();
    const precoNum = Number(form.preco.replace(",", "."));
    const estoqueNum = Number(form.estoque);

    if (!codigo) {
      setErro("Informe o código de barras.");
      return;
    }
    if (!descricao) {
      setErro("Informe a descrição do produto.");
      return;
    }
    if (!form.preco || isNaN(precoNum) || precoNum <= 0) {
      setErro("O preço do produto deve ser maior que zero.");
      return;
    }
    if (
      form.estoque === "" ||
      isNaN(estoqueNum) ||
      !Number.isInteger(estoqueNum) ||
      estoqueNum < 0
    ) {
      setErro("O estoque deve ser um número inteiro maior ou igual a zero.");
      return;
    }

    try {
      setErro("");
      if (editandoId !== null) {
        // Ao salvar a edição, reativa o produto caso estivesse inativo
        await atualizarProduto(editandoId, {
          codigo_barras: codigo,
          descricao,
          preco: precoNum,
          estoque: estoqueNum,
          ativo: true,
        });

        setProdutos((lista) =>
          lista.map((p) =>
            p.id === editandoId
              ? {
                  ...p,
                  codigo,
                  descricao,
                  preco: precoNum,
                  estoque: estoqueNum,
                  ativo: true,
                }
              : p
          )
        );
      } else {
        const res = await criarProduto({
          codigo_barras: codigo,
          descricao,
          preco: precoNum,
          estoque: estoqueNum,
        });

        setProdutos((lista) => [
          ...lista,
          {
            id: res.id,
            codigo,
            descricao,
            preco: precoNum,
            estoque: estoqueNum,
            ativo: true,
          },
        ]);
      }

      await carregarProdutos();
      cancelarEdicao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar produto.");
    }
  }

  function editar(p: Produto) {
    setEditandoId(p.id);
    setErro("");
    setForm({
      codigo: p.codigo,
      descricao: p.descricao,
      preco: String(p.preco),
      estoque: String(p.estoque),
    });
  }

  async function handleInativar(id: number) {
    try {
      setErro("");
      await inativarProduto(id);
      // Mantém no estado com ativo: false para que apareça como Inativo e possa ser reativado
      setProdutos((lista) =>
        lista.map((p) => (p.id === id ? { ...p, ativo: false } : p))
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao inativar produto.");
    }
  }

  async function handleReativar(id: number) {
    try {
      setErro("");
      await reativarProduto(id);
      // Atualiza no estado para ativo: true
      setProdutos((lista) =>
        lista.map((p) => (p.id === id ? { ...p, ativo: true } : p))
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao reativar produto.");
    }
  }

  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");
  const ehGerente = usuario?.perfil === "GERENTE";

  const produtoEmEdicao = editandoId !== null ? produtos.find((p) => p.id === editandoId) : null;
  const editandoInativo = produtoEmEdicao?.ativo === false;

  const termo = busca.trim().toLowerCase();
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo)
  );

  return (
    <div className="pagina">
      {ehGerente && (
        <section className="card">
          <h2>{editandoId !== null ? "Editar produto" : "Novo produto"}</h2>

          <form className="form-grid" onSubmit={salvar}>
            <label>
              Código de barras
              <input
                value={form.codigo}
                onChange={(e) => atualizar("codigo", e.target.value)}
                placeholder="Ex: 7891234567890"
              />
            </label>
            <label className="largo">
              Descrição
              <input
                value={form.descricao}
                onChange={(e) => atualizar("descricao", e.target.value)}
                placeholder="Ex: Camiseta Básica Algodão"
              />
            </label>
            <label>
              Preço (R$)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.preco}
                onChange={(e) => atualizar("preco", e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              Estoque
              <input
                type="number"
                step="1"
                min="0"
                value={form.estoque}
                onChange={(e) => atualizar("estoque", e.target.value)}
                placeholder="0"
              />
            </label>

            {editandoInativo && (
              <div style={{ gridColumn: "1 / -1", color: "#b42318", fontSize: "0.9rem" }}>
                Produto inativo. Salvar as alterações irá reativá-lo.
              </div>
            )}

            <div className="linha acoes-form">
              {editandoId !== null && (
                <button type="button" className="btn btn-secundario" onClick={cancelarEdicao}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-primario">
                {editandoId !== null
                  ? editandoInativo
                    ? "Salvar e reativar produto"
                    : "Salvar alterações"
                  : "Cadastrar produto"}
              </button>
            </div>
          </form>

          {erro && <p className="erro">{erro}</p>}
        </section>
      )}

      <section className="card">
        <h2>
          {carregando
            ? "Carregando produtos..."
            : `Produtos cadastrados (${produtosFiltrados.length})`}
        </h2>

        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por código ou descrição"
        />

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Situação</th>
              {ehGerente && <th></th>}
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.descricao}</td>
                <td>{formatarMoeda(p.preco)}</td>
                <td>{p.estoque}</td>
                <td>{p.ativo !== false ? "Ativo" : "Inativo"}</td>
                {ehGerente && (
                  <td>
                    <div className="linha">
                      <button type="button" className="btn btn-secundario" onClick={() => editar(p)}>
                        Editar
                      </button>
                      {p.ativo === false ? (
                        <button
                          type="button"
                          className="btn btn-secundario"
                          onClick={() => handleReativar(p.id)}
                        >
                          Reativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-perigo"
                          onClick={() => handleInativar(p.id)}
                        >
                          Inativar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {produtosFiltrados.length === 0 && !carregando && (
              <tr>
                <td colSpan={ehGerente ? 6 : 5} className="texto-suave">
                  Nenhum produto cadastrado. Use o formulário acima para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}