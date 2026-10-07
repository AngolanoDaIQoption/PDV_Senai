import { useEffect, useRef, useState } from "react";
import type { Cliente, FormaPagamento, ItemCarrinho, Produto, Usuario } from "../types";
import { buscarClientes, buscarProdutos } from "../services/api";
import { formatarMoeda } from "../utils/format";
import ModalAutorizacaoGerente from "../components/ModalAutorizacaoGerente";

const LIMITE_DESCONTO_CAIXA = 10;

export default function PDV() {
  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");
  const ehGerente = usuario?.perfil === "GERENTE";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "valor">("percentual");
  const [descontoTexto, setDescontoTexto] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [pagamento, setPagamento] = useState<FormaPagamento>("DINHEIRO");

  const [modalGerenteAberto, setModalGerenteAberto] = useState(false);
  const [descontoAutorizado, setDescontoAutorizado] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    buscarProdutos()
      .then(setProdutos)
      .catch((err) => console.error("Erro ao carregar produtos do PDV:", err));

    buscarClientes()
      .then(setClientes)
      .catch((err) => console.error("Erro ao carregar clientes do PDV:", err));
  }, []);

  const termo = busca.trim().toLowerCase();
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.codigo.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo)
  );

  function adicionar(produto: Produto) {
    setMensagemErro("");
    setMensagemSucesso("");
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto.id === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.estoque) return atual;
        return atual.map((i) =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      if (produto.estoque < 1) return atual;
      return [...atual, { produto, quantidade: 1 }];
    });
  }

  function alterarQuantidade(id: number, delta: number) {
    setMensagemErro("");
    setMensagemSucesso("");
    setCarrinho((atual) =>
      atual
        .map((i) =>
          i.produto.id === id
            ? {
                ...i,
                quantidade: Math.min(i.quantidade + delta, i.produto.estoque),
              }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  }

  function remover(id: number) {
    setMensagemErro("");
    setMensagemSucesso("");
    setCarrinho((atual) => atual.filter((i) => i.produto.id !== id));
  }

  // Cálculos em centavos para evitar erros de ponto flutuante
  const subtotalCentavos = carrinho.reduce((soma, i) => {
    const precoItemCentavos = Math.round(i.produto.preco * 100);
    return soma + precoItemCentavos * i.quantidade;
  }, 0);
  const subtotal = subtotalCentavos / 100;

  const descontoDigitado = Number(descontoTexto.replace(",", ".")) || 0;
  const descontoCalculadoCentavos =
    tipoDesconto === "percentual"
      ? Math.round((subtotalCentavos * descontoDigitado) / 100)
      : Math.round(descontoDigitado * 100);
  const valorDescontoCentavos = Math.max(0, Math.min(descontoCalculadoCentavos, subtotalCentavos));

  const valorDesconto = valorDescontoCentavos / 100;
  const percentualEfetivo =
    subtotalCentavos > 0 ? (valorDescontoCentavos / subtotalCentavos) * 100 : 0;

  const totalCentavos = subtotalCentavos - valorDescontoCentavos;
  const total = totalCentavos / 100;

  // Se o desconto ultrapassar 10%, exige perfil GERENTE ou liberação via modal
  const exigeAutorizacao =
    !ehGerente && !descontoAutorizado && percentualEfetivo > LIMITE_DESCONTO_CAIXA;

  function limparVenda() {
    setCarrinho([]);
    setDescontoTexto("");
    setClienteId("");
    setPagamento("DINHEIRO");
    setBusca("");
    setDescontoAutorizado(false);
  }

  function executarFinalizacao() {
    setMensagemSucesso(`Venda finalizada com sucesso! Total: ${formatarMoeda(total)}`);
    setMensagemErro("");
    limparVenda();
  }

  function finalizar() {
    setMensagemSucesso("");
    if (carrinho.length === 0) {
      setMensagemErro("Adicione ao menos um produto à venda.");
      return;
    }
    if (exigeAutorizacao) {
      setModalGerenteAberto(true);
      return;
    }
    executarFinalizacao();
  }

  function onAutorizarGerente() {
    setModalGerenteAberto(false);
    setDescontoAutorizado(true);
    setMensagemSucesso(`Venda finalizada com sucesso! Total: ${formatarMoeda(total)}`);
    setMensagemErro("");
    limparVenda();
  }

  // Atalho F2 para finalizar a venda
  const finalizarRef = useRef(finalizar);
  useEffect(() => {
    finalizarRef.current = finalizar;
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        finalizarRef.current();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Atalho Enter na busca para adicionar o primeiro produto da lista filtrada
  function handleBuscaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (produtosFiltrados.length > 0) {
        const primeiro = produtosFiltrados[0];
        if (primeiro.estoque >= 1) {
          adicionar(primeiro);
          setBusca("");
        } else {
          setMensagemErro(`Produto "${primeiro.descricao}" está sem estoque.`);
        }
      }
    }
  }

  return (
    <div className="pdv-grid">
      <section className="card">
        <h2>Produtos</h2>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={handleBuscaKeyDown}
          placeholder="Buscar por código ou descrição"
          autoFocus
        />
        <p className="texto-suave" style={{ fontSize: "0.8rem", margin: "6px 0 0" }}>
          Pressione Enter para adicionar o primeiro produto encontrado.
        </p>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((p) => (
              <tr key={p.id}>
                <td>{p.codigo}</td>
                <td>{p.descricao}</td>
                <td>{formatarMoeda(p.preco)}</td>
                <td>{p.estoque}</td>
                <td>
                  <button
                    className="btn btn-primario"
                    onClick={() => adicionar(p)}
                    disabled={p.estoque < 1}
                  >
                    {p.estoque < 1 ? "Sem estoque" : "Adicionar"}
                  </button>
                </td>
              </tr>
            ))}
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="texto-suave">
                  Nenhum produto encontrado para essa busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Venda atual</h2>

        {carrinho.length === 0 ? (
          <p className="texto-suave">Nenhum item. Adicione produtos pela lista ao lado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {carrinho.map((i) => {
                const subtotalItem = (Math.round(i.produto.preco * 100) * i.quantidade) / 100;
                return (
                  <tr key={i.produto.id}>
                    <td>{i.produto.descricao}</td>
                    <td>
                      <div className="qtd">
                        <button
                          className="btn btn-secundario"
                          onClick={() => alterarQuantidade(i.produto.id, -1)}
                        >
                          −
                        </button>
                        <span>{i.quantidade}</span>
                        <button
                          className="btn btn-secundario"
                          onClick={() => alterarQuantidade(i.produto.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{formatarMoeda(subtotalItem)}</td>
                    <td>
                      <button className="btn btn-perigo" onClick={() => remover(i.produto.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="campos-venda">
          <label>
            Cliente (opcional)
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Sem cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Forma de pagamento
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value as FormaPagamento)}>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">Pix</option>
              <option value="CARTAO_DEBITO">Cartão de débito</option>
              <option value="CARTAO_CREDITO">Cartão de crédito</option>
            </select>
          </label>

          <label>
            Desconto
            <div className="linha">
              <select
                value={tipoDesconto}
                onChange={(e) => {
                  setTipoDesconto(e.target.value as "percentual" | "valor");
                  setDescontoAutorizado(false);
                }}
              >
                <option value="percentual">%</option>
                <option value="valor">R$</option>
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={descontoTexto}
                onChange={(e) => {
                  setDescontoTexto(e.target.value);
                  setDescontoAutorizado(false);
                }}
                placeholder="0"
              />
            </div>
          </label>
        </div>

        {exigeAutorizacao && (
          <p className="erro">
            Desconto acima de {LIMITE_DESCONTO_CAIXA}%: será solicitada a autorização de um gerente ao finalizar.
          </p>
        )}

        {mensagemErro && <p className="erro">{mensagemErro}</p>}
        {mensagemSucesso && (
          <p style={{ color: "#027a48", fontWeight: 500, margin: "12px 0 0" }}>
            {mensagemSucesso}
          </p>
        )}

        <div className="totais">
          <div>
            <span>Subtotal</span>
            <span>{formatarMoeda(subtotal)}</span>
          </div>
          <div>
            <span>Desconto</span>
            <span>− {formatarMoeda(valorDesconto)}</span>
          </div>
          <div className="total">
            <span>Total</span>
            <span>{formatarMoeda(total)}</span>
          </div>
        </div>

        <div className="linha">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => {
              limparVenda();
              setMensagemErro("");
              setMensagemSucesso("");
            }}
          >
            Cancelar venda
          </button>
          <button type="button" className="btn btn-primario grande" onClick={finalizar}>
            Finalizar venda (F2)
          </button>
        </div>
      </section>

      <ModalAutorizacaoGerente
        aberto={modalGerenteAberto}
        onFechar={() => setModalGerenteAberto(false)}
        onAutorizar={onAutorizarGerente}
      />
    </div>
  );
}