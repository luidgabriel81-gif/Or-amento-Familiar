import React, { useState, useMemo } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Home,
  Receipt,
  CreditCard as CardIcon,
  PieChart as PieIcon,
  MoreHorizontal,
  Plus,
  Trash2,
  Calendar,
  Search,
  CheckCircle2,
} from "lucide-react";

/* ============================================================
   CORES E GRADIENTES BASE
============================================================ */
const C = {
  ink: "#F3F4F7",
  ink2: "#9BA1AE",
  line: "rgba(255, 255, 255, 0.1)",
  line2: "rgba(255, 255, 255, 0.05)",
  brass: "#8B5CF6",
  pine: "#34D399",
  brick: "#FB4E4E",
  clay: "#F59E0B",
};

const GRADIENT_PRIMARY = "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)";

/* ============================================================
   COMPONENTES DE UI (PRIMITIVOS)
============================================================ */
const Card = ({ children, style, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl sm:rounded-3xl transition-all duration-200 ${className}`}
    style={{
      background: "rgba(22, 24, 31, 0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill = ({ children, color, soft, style }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md"
    style={{ 
      background: soft || "rgba(255, 255, 255, 0.06)", 
      color: color || C.ink, 
      border: `1px solid ${color ? `${color}33` : "transparent"}`,
      ...style 
    }}
  >
    {children}
  </span>
);

const ProgressBar = ({ pct, tone }) => {
  const color = tone === "brick" ? C.brick : tone === "clay" ? C.clay : C.pine;
  return (
    <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${C.line2}` }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ 
          width: `${Math.min(pct, 100)}%`, 
          background: `linear-gradient(90deg, ${color}, ${color}DD)`,
          boxShadow: `0 0 12px ${color}66`
        }}
      />
    </div>
  );
};

const IconBtn = ({ children, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-2.5 rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer"
    style={{ color: C.ink2, background: "rgba(255, 255, 255, 0.03)", border: `1px solid ${C.line2}` }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      e.currentTarget.style.color = C.ink;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
      e.currentTarget.style.color = C.ink2;
    }}
  >
    {children}
  </button>
);

const PrimaryBtn = ({ children, onClick, style, type = "button", full }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${full ? "w-full" : ""}`}
    style={{ 
      background: GRADIENT_PRIMARY, 
      color: "#fff", 
      boxShadow: "0 8px 20px -6px rgba(139, 92, 246, 0.5)", 
      border: "1px solid rgba(255,255,255,0.2)",
      ...style 
    }}
  >
    {children}
  </button>
);

const GhostBtn = ({ children, onClick, style, full }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl font-semibold text-sm border transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${full ? "w-full" : ""}`}
    style={{ 
      borderColor: C.line, 
      color: C.ink, 
      background: "rgba(255, 255, 255, 0.04)", 
      backdropFilter: "blur(8px)",
      ...style 
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
  >
    {children}
  </button>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">{label}</span>
    {children}
  </div>
);

const inputStyle = {
  background: "rgba(11, 12, 16, 0.7)",
  border: `1px solid ${C.line}`,
  color: C.ink,
};

const TextInput = (props) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 ${props.className || ""}`}
    style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = C.brass;
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.2)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = C.line;
      e.currentTarget.style.boxShadow = "none";
    }}
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all duration-200 cursor-pointer"
    style={{
      ...inputStyle,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239BA1AE'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "1.2em",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = C.brass;
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.2)";
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = C.line;
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {children}
  </select>
);

const SegButton = ({ options, value, onChange }) => (
  <div className="flex rounded-2xl p-1.5 gap-1.5" style={{ background: "rgba(11, 12, 16, 0.8)", border: `1px solid ${C.line}` }}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className="flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
        style={{
          background: value === o.value ? GRADIENT_PRIMARY : "transparent",
          color: value === o.value ? "#fff" : C.ink2,
          boxShadow: value === o.value ? "0 4px 14px -3px rgba(139, 92, 246, 0.5)" : "none",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-300"
    style={{ background: "rgba(4, 5, 10, 0.75)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200`}
      style={{ background: "#16181F", borderColor: C.line }}
    >
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 backdrop-blur-md" style={{ background: "rgba(22, 24, 31, 0.95)", borderBottom: `1px solid ${C.line2}` }}>
        <h3 className="font-bold text-lg tracking-tight" style={{ color: C.ink }}>{title}</h3>
        <IconBtn onClick={onClose}><X size={18} /></IconBtn>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

/* ============================================================
   FUNÇÕES AUXILIARES DE FORMATAÇÃO
============================================================ */
const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dmy = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const monthLabel = (mStr) => {
  if (!mStr) return "";
  const [y, m] = mStr.split("-");
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${months[parseInt(m, 10) - 1]} de ${y}`;
};

/* ============================================================
   DADOS INICIAIS (MOCK)
============================================================ */
const CATEGORIES = [
  { id: "1", name: "Alimentação", target: 1200 },
  { id: "2", name: "Moradia", target: 2500 },
  { id: "3", name: "Transporte", target: 500 },
  { id: "4", name: "Lazer", target: 400 },
  { id: "5", name: "Salário", target: 0 },
];

const PERSONS = [
  { id: "p1", name: "Pessoal", color: C.brass, soft: "rgba(139, 92, 246, 0.15)" },
  { id: "p2", name: "Casa / Família", color: C.pine, soft: "rgba(52, 211, 153, 0.15)" },
];

const INITIAL_TXS = [
  { id: "1", description: "Salário Mensal", amount: 6500, type: "receita", categoryId: "5", personId: "p1", date: "2026-08-01", paymentMethod: "pix" },
  { id: "2", description: "Supermercado Principal", amount: 840, type: "despesa", categoryId: "1", personId: "p2", date: "2026-08-05", paymentMethod: "cartao" },
  { id: "3", description: "Aluguel & Condomínio", amount: 2100, type: "despesa", categoryId: "2", personId: "p1", date: "2026-08-10", paymentMethod: "pix" },
  { id: "4", description: "Combustível", amount: 220, type: "despesa", categoryId: "3", personId: "p1", date: "2026-08-14", paymentMethod: "cartao" },
  { id: "5", description: "Restaurante e Lazer", amount: 180, type: "despesa", categoryId: "4", personId: "p2", date: "2026-08-18", paymentMethod: "cartao" },
];

/* ============================================================
   APLICAÇÃO PRINCIPAL (APP)
============================================================ */
export default function App() {
  const [tab, setTab] = useState("inicio");
  const [month, setMonth] = useState("2026-08");
  const [txs, setTxs] = useState(INITIAL_TXS);
  const [search, setSearch] = useState("");
  
  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailTx, setDetailTx] = useState(null);

  // Formulário de novo lançamento
  const [newTx, setNewTx] = useState({
    description: "",
    amount: "",
    type: "despesa",
    categoryId: "1",
    personId: "p1",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cartao",
  });

  // Mapeamentos rápidos
  const catById = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, c])), []);
  const personById = useMemo(() => Object.fromEntries(PERSONS.map((p) => [p.id, p])), []);

  // Totais do Mês
  const totals = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    txs.forEach((t) => {
      if (t.type === "receita") receitas += Number(t.amount);
      else despesas += Number(t.amount);
    });
    return { receitas, despesas, resultado: receitas - despesas };
  }, [txs]);

  // Filtro de Transações
  const filteredTxs = useMemo(() => {
    return txs.filter((t) =>
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [txs, search]);

  const handleAddTx = (e) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    const item = {
      ...newTx,
      id: Date.now().toString(),
      amount: parseFloat(newTx.amount),
    };

    setTxs([item, ...txs]);
    setIsAddOpen(false);
    setNewTx({
      description: "",
      amount: "",
      type: "despesa",
      categoryId: "1",
      personId: "p1",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cartao",
    });
  };

  const handleDeleteTx = (id) => {
    setTxs(txs.filter((t) => t.id !== id));
    setDetailTx(null);
  };

  return (
    <div className="min-h-screen text-slate-100 pb-28 sm:pb-12 pt-6 px-4 sm:px-8 max-w-6xl mx-auto">
      
      {/* ================= HEADER PRINCIPAL ================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: GRADIENT_PRIMARY }}>
              F
            </div>
            <h1 className="text-xl font-bold tracking-tight">Finanças Pessoais</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Gestão financeira simples e intuitiva</p>
        </div>

        {/* Seletor de Mês e Ação Rápida */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-slate-200 outline-none pr-2 font-semibold cursor-pointer"
            />
          </div>

          <PrimaryBtn onClick={() => setIsAddOpen(true)}>
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Lançamento</span>
          </PrimaryBtn>
        </div>
      </header>

      {/* ================= CONTEÚDO DAS ABAS ================= */}
      {tab === "inicio" && (
        <main className="space-y-6">
          {/* Topo: Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Saldo / Balanço */}
            <Card className="p-6 relative overflow-hidden md:col-span-1" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.1) 100%)", borderColor: "rgba(139,92,246,0.3)" }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Saldo Atual</span>
                <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight mb-2 text-white">
                {brl(totals.resultado)}
              </div>
              <p className="text-xs text-purple-200/70">
                Balanço referente a {monthLabel(month)}
              </p>
            </Card>

            {/* Receitas */}
            <Card className="p-6" style={{ background: "rgba(52, 211, 153, 0.05)", borderColor: "rgba(52, 211, 153, 0.2)" }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Receitas</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-emerald-400 mb-1">
                {brl(totals.receitas)}
              </div>
              <span className="text-xs text-slate-400">Entradas confirmadas no mês</span>
            </Card>

            {/* Despesas */}
            <Card className="p-6" style={{ background: "rgba(251, 78, 78, 0.05)", borderColor: "rgba(251, 78, 78, 0.2)" }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Despesas</span>
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ArrowDownRight size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-rose-400 mb-1">
                {brl(totals.despesas)}
              </div>
              <span className="text-xs text-slate-400">Saídas registradas no mês</span>
            </Card>
          </div>

          {/* Últimos Lançamentos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base text-slate-100">Últimas Transações</h3>
              <GhostBtn style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setTab("lancamentos")}>
                Ver Tudo
              </GhostBtn>
            </div>

            <div className="space-y-3">
              {txs.slice(0, 4).map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => setDetailTx(tx)}
                  className="flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 hover:bg-white/[0.04] cursor-pointer border border-transparent hover:border-white/10"
                  style={{ background: "rgba(22, 24, 31, 0.5)" }}
                >
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="p-3 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ 
                        background: tx.type === "receita" ? "rgba(52, 211, 153, 0.12)" : "rgba(251, 78, 78, 0.12)",
                        color: tx.type === "receita" ? C.pine : C.brick,
                        border: `1px solid ${tx.type === "receita" ? "rgba(52,211,153,0.2)" : "rgba(251,78,78,0.2)"}`
                      }}
                    >
                      {tx.type === "receita" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-slate-100 mb-0.5">{tx.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span>{dmy(tx.date)}</span>
                        <span>•</span>
                        <Pill soft="rgba(255,255,255,0.06)" color={C.ink2}>
                          {catById[tx.categoryId]?.name || "Geral"}
                        </Pill>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-bold text-sm block ${tx.type === "receita" ? "text-emerald-400" : "text-slate-100"}`}>
                      {tx.type === "receita" ? "+" : "-"} {brl(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </main>
      )}

      {tab === "lancamentos" && (
        <main className="space-y-4">
          {/* Busca e Filtro */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <TextInput
                placeholder="Buscar lançamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          {/* Lista Completa */}
          <Card className="p-6">
            <h3 className="font-bold text-base mb-4">Extrato Detalhado</h3>
            <div className="space-y-3">
              {filteredTxs.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhum lançamento encontrado.</p>
              ) : (
                filteredTxs.map((tx) => (
                  <div 
                    key={tx.id} 
                    onClick={() => setDetailTx(tx)}
                    className="flex items-center justify-between p-4 rounded-2xl transition-all duration-200 hover:scale-[1.005] cursor-pointer"
                    style={{ background: "rgba(11, 12, 16, 0.5)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="p-3 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ 
                          background: tx.type === "receita" ? "rgba(52, 211, 153, 0.12)" : "rgba(251, 78, 78, 0.12)",
                          color: tx.type === "receita" ? C.pine : C.brick,
                          border: `1px solid ${tx.type === "receita" ? "rgba(52,211,153,0.2)" : "rgba(251,78,78,0.2)"}`
                        }}
                      >
                        {tx.type === "receita" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-slate-100 mb-0.5">{tx.description}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <span>{dmy(tx.date)}</span>
                          <span>•</span>
                          <Pill soft="rgba(255,255,255,0.06)" color={C.ink2}>
                            {catById[tx.categoryId]?.name || "Outros"}
                          </Pill>
                          {tx.personId && (
                            <Pill soft={personById[tx.personId]?.soft} color={personById[tx.personId]?.color}>
                              {personById[tx.personId]?.name}
                            </Pill>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-bold text-sm block ${tx.type === "receita" ? "text-emerald-400" : "text-slate-100"}`}>
                        {tx.type === "receita" ? "+" : "-"} {brl(tx.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">{tx.paymentMethod}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      )}

      {tab === "orcamento" && (
        <main className="space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-base mb-2">Metas e Orçamentos</h3>
            <p className="text-xs text-slate-400 mb-6">Acompanhe seus limites de gastos por categoria</p>

            <div className="space-y-6">
              {CATEGORIES.filter(c => c.target > 0).map((cat) => {
                const spent = txs
                  .filter((t) => t.categoryId === cat.id && t.type === "despesa")
                  .reduce((acc, curr) => acc + Number(curr.amount), 0);
                const pct = Math.round((spent / cat.target) * 100);
                const tone = pct > 90 ? "brick" : pct > 70 ? "clay" : "pine";

                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">{cat.name}</span>
                      <span className="text-xs text-slate-400">
                        {brl(spent)} de <span className="text-slate-200 font-semibold">{brl(cat.target)}</span>
                      </span>
                    </div>
                    <ProgressBar pct={pct} tone={tone} />
                    <div className="flex justify-end text-[11px] text-slate-400">
                      <span>{pct}% utilizado</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </main>
      )}

      {/* ================= DOCK DE NAVEGAÇÃO MOBILE ================= */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
        <div 
          className="flex items-center justify-around p-2 rounded-3xl shadow-2xl backdrop-blur-xl"
          style={{ 
            background: "rgba(22, 24, 31, 0.9)", 
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
          }}
        >
          {[
            { id: "inicio", label: "Início", icon: Home },
            { id: "lancamentos", label: "Extrato", icon: Receipt },
            { id: "orcamento", label: "Metas", icon: PieIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  background: active ? GRADIENT_PRIMARY : "transparent",
                  color: active ? "#ffffff" : C.ink2,
                  boxShadow: active ? "0 4px 15px rgba(139, 92, 246, 0.4)" : "none",
                }}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= MODAL: ADICIONAR LANÇAMENTO ================= */}
      {isAddOpen && (
        <Modal title="Novo Lançamento" onClose={() => setIsAddOpen(false)}>
          <form onSubmit={handleAddTx} className="space-y-4">
            <Field label="Tipo de Transação">
              <SegButton
                options={[
                  { label: "Despesa", value: "despesa" },
                  { label: "Receita", value: "receita" },
                ]}
                value={newTx.type}
                onChange={(val) => setNewTx({ ...newTx, type: val })}
              />
            </Field>

            <Field label="Descrição">
              <TextInput
                placeholder="Ex: Mercado, Salário, Internet..."
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                required
              />
            </Field>

            <Field label="Valor (R$)">
              <TextInput
                type="number"
                step="0.01"
                placeholder="0,00"
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <Select
                  value={newTx.categoryId}
                  onChange={(e) => setNewTx({ ...newTx, categoryId: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Data">
                <TextInput
                  type="date"
                  value={newTx.date}
                  onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                />
              </Field>
            </div>

            <div className="pt-2">
              <PrimaryBtn type="submit" full>
                Salvar Lançamento
              </PrimaryBtn>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL: DETALHES DO LANÇAMENTO ================= */}
      {detailTx && (
        <Modal title="Detalhes do Lançamento" onClose={() => setDetailTx(null)}>
          <div className="space-y-4">
            <div className="text-center py-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">Valor</span>
              <span className={`text-3xl font-extrabold ${detailTx.type === "receita" ? "text-emerald-400" : "text-slate-100"}`}>
                {detailTx.type === "receita" ? "+" : "-"} {brl(detailTx.amount)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Descrição</span>
                <span className="font-semibold">{detailTx.description}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Data</span>
                <span className="font-semibold">{dmy(detailTx.date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Categoria</span>
                <span className="font-semibold">{catById[detailTx.categoryId]?.name || "Geral"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Pagamento</span>
                <span className="font-semibold capitalize">{detailTx.paymentMethod}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <GhostBtn full onClick={() => handleDeleteTx(detailTx.id)} style={{ color: C.brick, borderColor: "rgba(251,78,78,0.3)" }}>
                <Trash2 size={16} /> Excluir
              </GhostBtn>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
