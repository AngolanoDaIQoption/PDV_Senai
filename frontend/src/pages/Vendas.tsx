import { useEffect, useState } from "react";
import type { VendaHistorico } from "../types";
import { buscarVendas } from "../services/api";
import { formatarMoeda } from "../utils/format";

function formatarFormaPagamento(forma: string): string {
  switch (forma) {
    case "DINHEIRO":
      return "Dinheiro";
    case "PIX":
      return "Pix";
    case "CARTAO_DEBITO":
      return "Cartão de Débito";
    case "CARTAO_CREDITO":
      return "Cartão de Crédito";
    default:
      return forma;
  }
}

function formatarDataHora(dataString?: string): string {
  if (!dataString) return "-";
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return dataString;
  return data.toLocaleString("pt-BR");
}

export default function Vendas() {
  const [vendas, setVendas] = useState<VendaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [linhaExpandidaId, setLinhaExpandidaId] = useState<number | null>(null);

  useEffect(() => {
    buscarVendas()
      .then((dados) => {
        setVendas(dados);
        setErro("");
      })
      .catch((err) => {
        console.error(err);
        setErro("Não foi possível carregar o histórico de vendas.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  function toggleExpandir(id: number) {
    setLinhaExpandidaId((atual) => (atual === id ? null : id));
  }

  const termoCliente = buscaCliente.trim().toLowerCase();
  const vendasFiltradas = vendas.filter((v) => {
    const nomeCliente = (v.cliente_nome ?? "sem cliente").toLowerCase();
    const bateCliente = !termoCliente || nomeCliente.includes(termoCliente);

    let bateData = true;
    if (filtroData && v.data_venda) {
      const dataIso = new Date(v.data_venda).toISOString().slice(0, 10);
      bateData = dataIso === filtroData;
    }

    return bateCliente && bateData;
  });

  return (
    <div className="pagina">
      <section className="card">
        <h2>Filtros do Histórico</h2>
        <div className="form-grid">
          <label className="largo">
            Buscar por cliente
            <input
              type="search"
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
              placeholder="Digite o nome do cliente..."
            />
          </label>
          <label>
            Filtrar por data
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            />
          </label>
          <div className="linha" style={{ alignItems: "flex-end" }}>
            {(buscaCliente || filtroData) && (
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => {
                  setBuscaCliente("");
                  setFiltroData("");
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>
          {carregando
            ? "Carregando histórico de vendas..."
            : `Histórico de Vendas (${vendasFiltradas.length})`}
        </h2>

        {erro && <p className="erro">{erro}</p>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data/Hora</th>
              <th>Cliente</th>
              <th>Operador</th>
              <th>Pagamento</th>
              <th>Desconto</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendasFiltradas.map((v) => {
              const expandida = linhaExpandidaId === v.id;
              return (
                <tr key={`venda-wrapper-${v.id}`} style={{ borderBottom: "1px solid var(--borda)" }}>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1.2fr 1.5fr 1fr 1.2fr 90px 1.1fr 100px",
                        alignItems: "center",
                        padding: "10px 8px",
                        background: expandida ? "rgba(31, 78, 121, 0.05)" : "transparent",
                      }}
                    >
                      <span>#{v.id}</span>
                      <span>{formatarDataHora(v.data_venda)}</span>
                      <span>{v.cliente_nome || <em className="texto-suave">Sem cliente</em>}</span>
                      <span>{v.usuario_nome || `Operador #${v.usuario_id}`}</span>
                      <span>{formatarFormaPagamento(v.forma_pagamento)}</span>
                      <span>{v.percentual_desconto}%</span>
                      <strong>{formatarMoeda(v.valor_total)}</strong>
                      <div>
                        <button
                          type="button"
                          className="btn btn-secundario"
                          style={{ padding: "5px 10px", fontSize: "0.85rem" }}
                          onClick={() => toggleExpandir(v.id)}
                        >
                          {expandida ? "Recolher" : "Detalhes"}
                        </button>
                      </div>
                    </div>

                    {expandida && (
                      <div
                        style={{
                          padding: "14px 18px",
                          background: "#fafbfc",
                          borderTop: "1px dashed var(--borda)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "20px",
                            marginBottom: "12px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span>
                            <strong>Subtotal:</strong> {formatarMoeda(v.valor_subtotal)}
                          </span>
                          <span>
                            <strong>Desconto aplicado:</strong> − {formatarMoeda(v.valor_desconto)} ({v.percentual_desconto}%)
                          </span>
                          <span>
                            <strong>Status:</strong>{" "}
                            <span style={{ color: v.status === "CANCELADA" ? "var(--perigo)" : "#027a48", fontWeight: 600 }}>
                              {v.status}
                            </span>
                          </span>
                          {v.autorizado_por_nome && (
                            <span>
                              <strong>Autorizado por:</strong> {v.autorizado_por_nome}
                            </span>
                          )}
                          {v.cancelado_por_nome && (
                            <span>
                              <strong>Cancelado por:</strong> {v.cancelado_por_nome} (Motivo: {v.motivo_cancelamento ?? "Não informado"})
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: "10px 0 6px", fontSize: "0.95rem" }}>
                          Itens Comprados ({v.itens?.length ?? 0})
                        </h4>

                        {v.itens && v.itens.length > 0 ? (
                          <table style={{ margin: 0, background: "#fff", border: "1px solid var(--borda)" }}>
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Preço Unitário Histórico</th>
                                <th>Subtotal do Item</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.itens.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.produto_descricao || `Produto #${item.produto_id}`}</td>
                                  <td>{item.quantidade}</td>
                                  <td>{formatarMoeda(item.preco_unitario)}</td>
                                  <td>{formatarMoeda(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="texto-suave" style={{ margin: "4px 0" }}>
                            Nenhum item registrado para esta venda.
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {vendasFiltradas.length === 0 && !carregando && (
              <tr>
                <td colSpan={8} className="texto-suave" style={{ padding: "16px 8px" }}>
                  Nenhuma venda encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

