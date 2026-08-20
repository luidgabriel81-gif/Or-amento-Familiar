import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Home, Receipt, Wallet, CreditCard as CardIcon, MoreHorizontal, Plus, X,
  Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight, Users, Repeat,
  Tag, Landmark, PieChart as PieIcon, Settings, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Check, Wallet2, ChevronRight as ChevronRightSm,
  Download, Upload, FileSpreadsheet, Info
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import * as XLSX from "xlsx";

/* ============================================================
   TOKENS
============================================================ */
const C = {
  bg: "#0B0C10",
  paper: "#16181F",
  ink: "#F3F4F7",
  ink2: "#9BA1AE",
  ink3: "#5E6472",
  line: "rgba(255,255,255,0.10)",
  line2: "rgba(255,255,255,0.06)",
  brass: "#8B5CF6",
  brassSoft: "rgba(139,92,246,0.16)",
  pine: "#34D399",
  pineSoft: "rgba(52,211,153,0.14)",
  clay: "#F5A524",
  claySoft: "rgba(245,165,36,0.14)",
  brick: "#FB4E4E",
  brickSoft: "rgba(251,78,78,0.14)",
  luid: "#60A5FA",
  luidSoft: "rgba(96,165,250,0.16)",
  maria: "#F472B6",
  mariaSoft: "rgba(244,114,182,0.16)",
  family: "#FBBF24",
  familySoft: "rgba(251,191,36,0.16)",
};

const PAGE_BG =
  "radial-gradient(circle at 15% -10%, rgba(139,92,246,0.16), transparent 55%), radial-gradient(circle at 100% 0%, rgba(34,211,238,0.10), transparent 45%), #0B0C10";

const GRADIENT_PRIMARY = "linear-gradient(135deg, #8B5CF6 0%, #6366F1 55%, #22D3EE 100%)";

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');";

/* ============================================================
   HELPERS
============================================================ */
let __id = 1000;
const uid = (p) => `${p}-${(__id++).toString(36)}`;

const brl = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dmy = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const monthKey = (iso) => iso.slice(0, 7);

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
};

const shiftMonth = (key, delta) => {
  let [y, m] = key.split("-").map(Number);
  m += delta;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
};

const addMonthsToDate = (iso, n) => {
  let [y, m, d] = iso.split("-").map(Number);
  m += n;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const addDaysToDate = (iso, n) => {
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// Recorrências geram lançamentos individuais com antecedência — 5 anos a partir
// da data inicial é o horizonte usado (arquitetura pré-gera as instâncias;
// numa versão com backend real isso poderia ser calculado sob demanda).
const RECURRING_HORIZON_MONTHS = 60;

const FREQ_STEP = {
  semanal: { unit: "days", n: 7 },
  quinzenal: { unit: "days", n: 14 },
  mensal: { unit: "months", n: 1 },
  bimestral: { unit: "months", n: 2 },
  trimestral: { unit: "months", n: 3 },
  semestral: { unit: "months", n: 6 },
  anual: { unit: "months", n: 12 },
};

const stepDate = (iso, freq) => {
  const s = FREQ_STEP[freq] || FREQ_STEP.mensal;
  return s.unit === "days" ? addDaysToDate(iso, s.n) : addMonthsToDate(iso, s.n);
};

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* ============================================================
   ESTADO INICIAL (instalação nova — sem dados de demonstração)
============================================================ */
function buildInitialData() {
  // Estrutural apenas: "Família" é a opção de responsável compartilhado,
  // não uma pessoa de demonstração — precisa existir para o app funcionar.
  const persons = [{ id: "family", name: "Família", isFamily: true }];

  const categories = [
    { id: "cat-salario", name: "Salário", type: "receita" },
    { id: "cat-freelance", name: "Freelance", type: "receita" },
    { id: "cat-beneficios", name: "Benefícios", type: "receita" },
    { id: "cat-rendimentos", name: "Rendimentos", type: "receita" },
    { id: "cat-outros-r", name: "Outros", type: "receita" },
    { id: "cat-moradia", name: "Moradia", type: "despesa" },
    { id: "cat-alimentacao", name: "Alimentação", type: "despesa" },
    { id: "cat-transporte", name: "Transporte", type: "despesa" },
    { id: "cat-saude", name: "Saúde", type: "despesa" },
    { id: "cat-educacao", name: "Educação", type: "despesa" },
    { id: "cat-lazer", name: "Lazer", type: "despesa" },
    { id: "cat-compras", name: "Compras", type: "despesa" },
    { id: "cat-assinaturas", name: "Assinaturas", type: "despesa" },
    { id: "cat-contas", name: "Contas", type: "despesa" },
    { id: "cat-outros-d", name: "Outros", type: "despesa" },
  ];

  return {
    family: { id: "fam-1", name: "" },
    persons,
    categories,
    accounts: [],
    creditCards: [],
    transactions: [],
    recurring: [],
    budgets: {},
  };
}

/* ============================================================
   ARMAZENAMENTO PERSISTENTE (window.storage)
   Cada família só enxerga os próprios dados (shared = false).
   Se no futuro isso virar uma API real, esta é a única camada
   que precisa ser trocada — o resto do app já fala com `data`.
============================================================ */
const STORAGE_KEY = "orcamento-familiar:dados";

async function loadPersistedData() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) {
    // Chave ainda não existe (primeira vez usando o app) — segue com estado vazio.
  }
  return null;
}

async function persistData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), false);
    return true;
  } catch (e) {
    return false;
  }
}

/* ============================================================
   BACKUP (exportar/importar JSON)
============================================================ */
function downloadFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportBackupJSON(data) {
  const payload = { app: "Orçamento Familiar", exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  downloadFile(`Backup_Orcamento_Familiar_${stamp}.json`, blob);
}

function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const data = parsed && parsed.data ? parsed.data : parsed;
        if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
          reject(new Error("Arquivo de backup inválido."));
          return;
        }
        resolve(data);
      } catch (e) {
        reject(new Error("Não foi possível ler este arquivo."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsText(file);
  });
}

/* ============================================================
   EXPORTAÇÃO PARA EXCEL (XLSX real, gerado no navegador)
   Limitação conhecida: a biblioteca usada (SheetJS, client-side)
   não escreve gráficos nativos do Excel — por isso as abas trazem
   as tabelas de dados completas em vez de gráficos embutidos.
   Todo o restante (fórmulas, formatos, congelamento, filtros)
   é gerado de verdade.
============================================================ */
const XLSX_CURRENCY = '"R$" #,##0.00';
const XLSX_PERCENT = "0.00%";

function buildExcelWorkbook(data, month) {
  const catById = Object.fromEntries(data.categories.map((c) => [c.id, c]));
  const personById = Object.fromEntries(data.persons.map((p) => [p.id, p]));
  const cardById = Object.fromEntries(data.creditCards.map((c) => [c.id, c]));
  const accById = Object.fromEntries(data.accounts.map((a) => [a.id, a]));

  const wb = XLSX.utils.book_new();

  const addSheet = (name, ws) => XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const setCols = (ws, widths) => { ws["!cols"] = widths.map((w) => ({ wch: w })); };
  const freezeHeaderRow = (ws, row) => {
    ws["!freeze"] = { xSplit: "0", ySplit: String(row), topLeftCell: `A${row + 1}`, activePane: "bottomLeft", state: "frozen" };
  };
  const setAutofilter = (ws, ref) => { ws["!autofilter"] = { ref }; };
  const setFormat = (ws, ref, z) => { if (ws[ref]) ws[ref].z = z; };

  const monthTx = data.transactions.filter((t) => monthKey(t.date) === month);
  const budget = data.budgets[month] || { plannedIncome: 0, categoryBudgets: {} };
  const receitasMes = monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const despesasMes = monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const orcamentoTotal = Object.values(budget.categoryBudgets).reduce((s, v) => s + Number(v || 0), 0);
  const despCats = data.categories.filter((c) => c.type === "despesa");

  const budgetRowsFor = (onlyWithData) => despCats
    .map((c) => {
      const gasto = monthTx.filter((t) => t.type === "despesa" && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
      const orc = Number(budget.categoryBudgets[c.id] || 0);
      return { name: c.name, orc, gasto };
    })
    .filter((c) => (onlyWithData ? c.orc > 0 || c.gasto > 0 : true));

  const applyBudgetFormulas = (ws, startRow, rows) => {
    rows.forEach((row, idx) => {
      const r = startRow + idx;
      const disponivel = row.orc - row.gasto;
      const pct = row.orc > 0 ? row.gasto / row.orc : 0;
      const status = row.orc === 0 ? "Sem orçamento" : row.gasto > row.orc ? "Excedido" : pct >= 0.8 ? "Atenção" : "Normal";
      ws[`D${r}`] = { t: "n", v: disponivel, f: `B${r}-C${r}`, z: XLSX_CURRENCY };
      ws[`E${r}`] = { t: "n", v: pct, f: `IF(B${r}=0,0,C${r}/B${r})`, z: XLSX_PERCENT };
      ws[`F${r}`] = { t: "str", v: status, f: `IF(B${r}=0,"Sem orçamento",IF(C${r}>B${r},"Excedido",IF(C${r}/B${r}>=0.8,"Atenção","Normal")))` };
      setFormat(ws, `B${r}`, XLSX_CURRENCY);
      setFormat(ws, `C${r}`, XLSX_CURRENCY);
    });
  };

  /* ---------- 1. DASHBOARD ---------- */
  {
    const rows = budgetRowsFor(true);
    const aoa = [
      ["Orçamento Familiar"],
      [data.family?.name || "Minha família"],
      [`Período: ${monthLabel(month)}`],
      [],
      ["Indicador", "Valor"],
      ["Receitas", receitasMes],
      ["Despesas", despesasMes],
      ["Resultado", receitasMes - despesasMes],
      ["Meta / limite de despesas", orcamentoTotal],
      [],
      ["Gastos por categoria"],
      ["Categoria", "Meta / limite", "Gasto", "Abaixo/acima do limite", "% utilizado", "Status"],
    ];
    const startRow = aoa.length + 1;
    rows.forEach((r) => aoa.push([r.name, r.orc, r.gasto]));
    aoa.push([]);
    aoa.push(["Alertas"]);
    const alerts = rows.filter((r) => r.orc > 0).map((r) => {
      const pct = r.gasto / r.orc;
      if (r.gasto > r.orc) return `Você ultrapassou o orçamento de ${r.name} em ${brl(r.gasto - r.orc)}.`;
      if (pct >= 0.8) return `${r.name} está em ${(pct * 100).toFixed(0)}% do orçamento.`;
      return null;
    }).filter(Boolean);
    (alerts.length ? alerts : ["Nenhum alerta no momento."]).forEach((a) => aoa.push([a]));

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (rows.length) applyBudgetFormulas(ws, startRow, rows);
    ["B6", "B7", "B8", "B9", "B10"].forEach((ref) => setFormat(ws, ref, XLSX_CURRENCY));
    setCols(ws, [32, 16, 16, 16, 14, 16]);
    addSheet("Dashboard", ws);
  }

  /* ---------- 2. ORÇAMENTO ---------- */
  {
    const rows = budgetRowsFor(false);
    const aoa = [
      [`Metas e limites — ${monthLabel(month)}`],
      [],
      ["Categoria", "Meta / limite", "Gasto realizado", "Abaixo/acima do limite", "% utilizado", "Status"],
    ];
    const startRow = aoa.length + 1;
    rows.forEach((r) => aoa.push([r.name, r.orc, r.gasto]));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (rows.length) applyBudgetFormulas(ws, startRow, rows);
    freezeHeaderRow(ws, 3);
    setCols(ws, [24, 16, 18, 16, 14, 16]);
    addSheet("Metas e Limites", ws);
  }

  /* ---------- helpers para lançamentos ---------- */
  const txRow = (t) => [
    t.id, dmy(t.date), t.type === "receita" ? "Receita" : "Despesa", t.description, t.amount,
    catById[t.categoryId]?.name || "", personById[t.personId]?.name || "", t.paymentMethod,
    t.accountId ? accById[t.accountId]?.name || "" : "", t.creditCardId ? cardById[t.creditCardId]?.name || "" : "",
    t.recurringId ? "Sim" : "Não", t.installmentGroupId ? "Sim" : "Não",
    t.installmentNumber || "", t.installmentTotal || "", t.note || "",
    monthKey(t.date).split("-")[1], monthKey(t.date).split("-")[0],
  ];
  const TX_HEADER = ["ID", "Data", "Tipo", "Descrição", "Valor", "Categoria", "Responsável", "Forma de pagamento", "Conta", "Cartão", "Recorrência", "Parcelamento", "Parcela atual", "Total de parcelas", "Observação", "Mês", "Ano"];
  const TX_COLS = [12, 12, 10, 26, 14, 16, 14, 16, 14, 12, 12, 12, 12, 14, 24, 6, 6];

  const makeTxSheet = (name, list) => {
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    const aoa = [TX_HEADER, ...sorted.map(txRow)];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    for (let r = 2; r <= aoa.length; r++) setFormat(ws, `E${r}`, XLSX_CURRENCY);
    freezeHeaderRow(ws, 1);
    setAutofilter(ws, `A1:Q${aoa.length}`);
    setCols(ws, TX_COLS);
    addSheet(name, ws);
  };

  /* ---------- 3-5. LANÇAMENTOS / RECEITAS / DESPESAS ---------- */
  makeTxSheet("Lançamentos", data.transactions);
  makeTxSheet("Receitas", data.transactions.filter((t) => t.type === "receita"));
  makeTxSheet("Despesas", data.transactions.filter((t) => t.type === "despesa"));

  /* ---------- 6. PESSOAS ---------- */
  {
    const aoa = [["ID", "Nome", "Receitas no período", "Despesas no período", "Resultado"]];
    const rows = data.persons.map((p) => {
      const own = monthTx.filter((t) => t.personId === p.id);
      const rec = own.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
      const desp = own.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
      aoa.push([p.id, p.isFamily ? `${p.name} (compartilhado)` : p.name, rec, desp]);
      return { rec, desp };
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    rows.forEach(({ rec, desp }, idx) => {
      const r = idx + 2;
      setFormat(ws, `C${r}`, XLSX_CURRENCY);
      setFormat(ws, `D${r}`, XLSX_CURRENCY);
      ws[`E${r}`] = { t: "n", v: rec - desp, f: `C${r}-D${r}`, z: XLSX_CURRENCY };
    });
    freezeHeaderRow(ws, 1);
    setCols(ws, [14, 26, 18, 18, 16]);
    addSheet("Pessoas", ws);
  }

  /* ---------- 7. CATEGORIAS ---------- */
  {
    const aoa = [["ID", "Nome", "Tipo"], ...data.categories.map((c) => [c.id, c.name, c.type === "receita" ? "Receita" : "Despesa"])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    freezeHeaderRow(ws, 1);
    setCols(ws, [16, 22, 12]);
    addSheet("Categorias", ws);
  }

  /* ---------- 8. RECORRÊNCIAS ---------- */
  {
    const aoa = [["Descrição", "Tipo", "Valor", "Categoria", "Responsável", "Frequência", "Data inicial", "Data final", "Valor variável", "Ativa"],
      ...data.recurring.map((r) => [
        r.description, r.type === "receita" ? "Receita" : "Despesa", r.amount,
        catById[r.categoryId]?.name || "", personById[r.personId]?.name || "", r.frequency,
        dmy(r.startDate), r.endDate ? dmy(r.endDate) : "", r.variableAmount ? "Sim" : "Não", "Sim",
      ])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    for (let r = 2; r <= aoa.length; r++) setFormat(ws, `C${r}`, XLSX_CURRENCY);
    freezeHeaderRow(ws, 1);
    setCols(ws, [22, 10, 14, 16, 14, 12, 14, 14, 14, 8]);
    addSheet("Recorrências", ws);
  }

  /* ---------- 9. CARTÕES ---------- */
  {
    const aoa = [["Nome", "Titular", "Limite", "Fechamento", "Vencimento", "Status"],
      ...data.creditCards.map((c) => [c.name, personById[c.personId]?.name || "", c.limit, c.closingDay, c.dueDay, c.active ? "Ativo" : "Inativo"])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    for (let r = 2; r <= aoa.length; r++) setFormat(ws, `C${r}`, XLSX_CURRENCY);
    freezeHeaderRow(ws, 1);
    setCols(ws, [16, 16, 14, 12, 12, 10]);
    addSheet("Cartões", ws);
  }

  /* ---------- 10. FATURAS ---------- */
  {
    const invoices = {};
    data.transactions.forEach((t) => {
      if (!t.creditCardId) return;
      const mk = monthKey(t.date);
      const key = `${t.creditCardId}__${mk}`;
      if (!invoices[key]) invoices[key] = { cardId: t.creditCardId, period: mk, total: 0 };
      invoices[key].total += t.amount;
    });
    const list = Object.values(invoices).sort((a, b) => (a.period < b.period ? -1 : 1));
    const aoa = [["Cartão", "Titular", "Período", "Fechamento", "Vencimento", "Valor", "Status"]];
    list.forEach((inv) => {
      const card = cardById[inv.cardId];
      const status = inv.period < month ? "Fechada" : inv.period === month ? "Aberta" : "Futura";
      aoa.push([card?.name || "", personById[card?.personId]?.name || "", monthLabel(inv.period), card?.closingDay || "", card?.dueDay || "", inv.total, status]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    for (let r = 2; r <= aoa.length; r++) setFormat(ws, `F${r}`, XLSX_CURRENCY);
    freezeHeaderRow(ws, 1);
    setCols(ws, [16, 16, 18, 12, 12, 14, 12]);
    addSheet("Faturas", ws);
  }

  /* ---------- 11. PARCELAMENTOS ---------- */
  {
    const groups = {};
    data.transactions.forEach((t) => {
      if (!t.installmentGroupId) return;
      if (!groups[t.installmentGroupId]) groups[t.installmentGroupId] = [];
      groups[t.installmentGroupId].push(t);
    });
    const aoaSummary = [["Compra", "Valor total", "Cartão", "Responsável", "Categoria", "Data da compra", "Qtd. parcelas", "Valor da parcela"]];
    const aoaDetail = [["Compra", "Parcela", "Total de parcelas", "Valor", "Data", "Cartão"]];
    Object.values(groups).forEach((list) => {
      const sorted = [...list].sort((a, b) => a.installmentNumber - b.installmentNumber);
      const first = sorted[0];
      const total = sorted.reduce((s, t) => s + t.amount, 0);
      aoaSummary.push([
        first.description, total, cardById[first.creditCardId]?.name || "", personById[first.personId]?.name || "",
        catById[first.categoryId]?.name || "", dmy(first.date), first.installmentTotal, total / first.installmentTotal,
      ]);
      sorted.forEach((t) => aoaDetail.push([t.description, t.installmentNumber, t.installmentTotal, t.amount, dmy(t.date), cardById[t.creditCardId]?.name || ""]));
    });
    const summaryEnd = aoaSummary.length;
    const detailStart = summaryEnd + 3;
    const full = [...aoaSummary, [], ["Parcelas individuais"], ...aoaDetail];
    const ws = XLSX.utils.aoa_to_sheet(full);
    for (let r = 2; r <= summaryEnd; r++) { setFormat(ws, `B${r}`, XLSX_CURRENCY); setFormat(ws, `H${r}`, XLSX_CURRENCY); }
    for (let r = detailStart + 1; r <= full.length; r++) setFormat(ws, `D${r}`, XLSX_CURRENCY);
    setCols(ws, [24, 16, 16, 16, 16, 14, 12, 14]);
    addSheet("Parcelamentos", ws);
  }

  /* ---------- 12. CONTAS ---------- */
  {
    const aoa = [["ID", "Nome"], ...data.accounts.map((a) => [a.id, a.name])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    freezeHeaderRow(ws, 1);
    setCols(ws, [16, 24]);
    addSheet("Contas", ws);
  }

  /* ---------- 13. RELATÓRIOS ---------- */
  {
    const byCategory = {};
    const byPerson = {};
    const byCard = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => {
      const cn = catById[t.categoryId]?.name || "Outros";
      byCategory[cn] = (byCategory[cn] || 0) + t.amount;
      const pn = personById[t.personId]?.name || "—";
      byPerson[pn] = (byPerson[pn] || 0) + t.amount;
      if (t.creditCardId) {
        const cardName = cardById[t.creditCardId]?.name || "—";
        byCard[cardName] = (byCard[cardName] || 0) + t.amount;
      }
    });
    const aoa = [
      [`Relatórios — ${monthLabel(month)}`],
      ["Nota: o Dashboard e os relatórios são construídos a partir dos dados reais do aplicativo; as tabelas abaixo preservam os dados-base para consulta e auditoria."],
      [],
      ["Gastos por categoria"], ["Categoria", "Valor"],
      ...Object.entries(byCategory).map(([k, v]) => [k, v]),
      [],
      ["Gastos por pessoa"], ["Pessoa", "Valor"],
      ...Object.entries(byPerson).map(([k, v]) => [k, v]),
      [],
      ["Receitas x despesas"], ["Tipo", "Valor"], ["Receitas", receitasMes], ["Despesas", despesasMes],
      [],
      ["Gastos com cartão"], ["Cartão", "Valor"],
      ...(Object.keys(byCard).length ? Object.entries(byCard).map(([k, v]) => [k, v]) : [["Nenhuma compra no cartão neste período.", ""]]),
      [],
      ["Evolução mensal (6 meses)"], ["Mês", "Meta / limite", "Despesa"],
      ...(() => {
        const out = [];
        for (let i = 5; i >= 0; i--) {
          const mk = shiftMonth(month, -i);
          const b = data.budgets[mk];
          const orc = b ? Object.values(b.categoryBudgets).reduce((s, v) => s + Number(v || 0), 0) : 0;
          const gasto = data.transactions.filter((t) => monthKey(t.date) === mk && t.type === "despesa").reduce((s, t) => s + t.amount, 0);
          out.push([monthLabel(mk), orc, gasto]);
        }
        return out;
      })(),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    setCols(ws, [26, 16, 16]);
    addSheet("Relatórios", ws);
  }

  /* ---------- 14. CONFIGURAÇÕES ---------- */
  {
    const aoa = [
      ["Configurações e metadados do backup"],
      [],
      ["Família", data.family?.name || "(sem nome definido)"],
      ["Mês de referência da exportação", monthLabel(month)],
      ["Data da exportação", dmy(new Date().toISOString().slice(0, 10))],
      ["Total de lançamentos", data.transactions.length],
      ["Total de pessoas", data.persons.length],
      ["Total de categorias", data.categories.length],
      ["Total de cartões", data.creditCards.length],
      ["Total de contas", data.accounts.length],
      ["Total de recorrências", data.recurring.length],
      [],
      ["Este arquivo é um retrato (snapshot) dos dados no momento da exportação."],
      ["Alterações feitas depois no aplicativo não atualizam este arquivo automaticamente."],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    setCols(ws, [40, 24]);
    addSheet("Configurações", ws);
  }

  return wb;
}

function exportToExcel(data, month) {
  const wb = buildExcelWorkbook(data, month);
  const [y, m] = month.split("-");
  XLSX.writeFile(wb, `Orcamento_Familiar_${y}_${m}.xlsx`);
}

/* ============================================================
   SMALL UI PRIMITIVES
============================================================ */
const Card = ({ children, style, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-3xl ${className}`}
    style={{
      background: C.paper,
      border: `1px solid ${C.line}`,
      boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px -18px rgba(0,0,0,0.6)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill = ({ children, color, soft, style }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: soft, color, ...style }}
  >
    {children}
  </span>
);

const PERSON_PALETTE = [
  { c: "#60A5FA", s: "rgba(96,165,250,0.16)" },
  { c: "#F472B6", s: "rgba(244,114,182,0.16)" },
  { c: "#2DD4BF", s: "rgba(45,212,191,0.16)" },
  { c: "#FB7185", s: "rgba(251,113,133,0.16)" },
  { c: "#A78BFA", s: "rgba(167,139,250,0.16)" },
  { c: "#A3E635", s: "rgba(163,230,53,0.16)" },
];
const hashId = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
};
const personColor = (id) =>
  id === "family" ? C.family : PERSON_PALETTE[hashId(id) % PERSON_PALETTE.length].c;
const personSoft = (id) =>
  id === "family" ? C.familySoft : PERSON_PALETTE[hashId(id) % PERSON_PALETTE.length].s;

const ProgressBar = ({ pct, tone }) => {
  const color = tone === "brick" ? C.brick : tone === "clay" ? C.clay : C.pine;
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.line2 }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
};

const IconBtn = ({ children, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 rounded-full transition-colors"
    style={{ color: C.ink2 }}
    onMouseEnter={(e) => (e.currentTarget.style.background = C.line2)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {children}
  </button>
);

const PrimaryBtn = ({ children, onClick, style, type = "button", full }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-4 py-3 rounded-2xl font-semibold text-sm transition-transform active:scale-[0.98] ${full ? "w-full" : ""}`}
    style={{ background: GRADIENT_PRIMARY, color: "#fff", boxShadow: "0 10px 24px -10px rgba(139,92,246,0.65)", border: "none", ...style }}
  >
    {children}
  </button>
);

const GhostBtn = ({ children, onClick, style, full }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 rounded-2xl font-semibold text-sm border transition-colors ${full ? "w-full" : ""}`}
    style={{ borderColor: C.line, color: C.ink, background: "rgba(255,255,255,0.03)", ...style }}
  >
    {children}
  </button>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.ink3 }}>{label}</span>
    {children}
  </div>
);

const inputStyle = {
  background: C.bg,
  border: `1px solid ${C.line}`,
  color: C.ink,
};

const TextInput = (props) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 ${props.className || ""}`}
    style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={(e) => (e.currentTarget.style.borderColor = C.brass)}
    onBlur={(e) => (e.currentTarget.style.borderColor = C.line)}
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none"
    style={inputStyle}
  >
    {children}
  </select>
);

const SegButton = ({ options, value, onChange }) => (
  <div className="flex rounded-lg p-1 gap-1" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className="flex-1 py-2 rounded-md text-sm font-semibold transition-colors"
        style={{
          background: value === o.value ? GRADIENT_PRIMARY : "transparent",
          color: value === o.value ? "#fff" : C.ink2,
          boxShadow: value === o.value ? "0 6px 16px -8px rgba(139,92,246,0.7)" : "none",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    style={{ background: "rgba(4,5,10,0.7)", backdropFilter: "blur(4px)" }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto`}
      style={{ background: C.paper, border: `1px solid ${C.line}` }}
    >
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10" style={{ background: C.paper, borderBottom: `1px solid ${C.line2}` }}>
        <h3 className="font-semibold text-lg" style={{ fontFamily: "Fraunces, serif", color: C.ink }}>{title}</h3>
        <IconBtn onClick={onClose}><X size={20} /></IconBtn>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center" style={{ color: C.ink3 }}>
    {icon}
    <p className="text-sm max-w-xs">{text}</p>
  </div>
);

/* ============================================================
   APP
============================================================ */
export default function App() {
  const [data, setData] = useState(buildInitialData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("inicio");
  const [moreScreen, setMoreScreen] = useState(null);
  const [month, setMonth] = useState(currentMonthKey);
  const [personFilter, setPersonFilter] = useState("all");
  const [txModal, setTxModal] = useState(null); // { editing: tx|null, defaultType }
  const [detailTx, setDetailTx] = useState(null);
  const [cardDetail, setCardDetail] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* ---------- carregar dados salvos ao abrir o app ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadPersistedData();
      if (!cancelled && saved) setData((d) => ({ ...d, ...saved }));
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---------- salvar automaticamente a cada alteração ---------- */
  useEffect(() => {
    if (!loaded) return;
    persistData(data);
  }, [data, loaded]);

  /* ---------- derived lookups ---------- */
  const catById = useMemo(() => Object.fromEntries(data.categories.map((c) => [c.id, c])), [data.categories]);
  const personById = useMemo(() => Object.fromEntries(data.persons.map((p) => [p.id, p])), [data.persons]);
  const cardById = useMemo(() => Object.fromEntries(data.creditCards.map((c) => [c.id, c])), [data.creditCards]);
  const accById = useMemo(() => Object.fromEntries(data.accounts.map((a) => [a.id, a])), [data.accounts]);

  const monthTx = useMemo(
    () => data.transactions.filter((t) => monthKey(t.date) === month),
    [data.transactions, month]
  );

  const visibleTx = useMemo(() => {
    if (personFilter === "all") return monthTx;
    return monthTx.filter((t) => t.personId === personFilter);
  }, [monthTx, personFilter]);

  const totals = useMemo(() => {
    const receitas = visibleTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
    const despesas = visibleTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
    const resultado = receitas - despesas;
    return { receitas, despesas, resultado };
  }, [visibleTx]);

  const budget = data.budgets[month] || { plannedIncome: 0, categoryBudgets: {} };
  const orcamentoTotal = Object.values(budget.categoryBudgets).reduce((s, v) => s + Number(v || 0), 0);
  const disponivel = orcamentoTotal - totals.despesas;

  const categorySummary = useMemo(() => {
    const despCats = data.categories.filter((c) => c.type === "despesa");
    return despCats.map((c) => {
      const gasto = visibleTx.filter((t) => t.type === "despesa" && t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
      const orc = Number(budget.categoryBudgets[c.id] || 0);
      const pct = orc > 0 ? (gasto / orc) * 100 : gasto > 0 ? 100 : 0;
      return { ...c, gasto, orcamento: orc, pct, disponivel: orc - gasto };
    }).filter((c) => c.orcamento > 0 || c.gasto > 0);
  }, [data.categories, visibleTx, budget]);

  const alerts = useMemo(() => {
    const list = [];
    categorySummary.forEach((c) => {
      if (c.orcamento <= 0) return;
      if (c.gasto > c.orcamento) {
        list.push({ tone: "brick", text: `Você ultrapassou o orçamento de ${c.name} em ${brl(c.gasto - c.orcamento)}.` });
      } else if (c.pct >= 90) {
        list.push({ tone: "clay", text: `${c.name} está em ${c.pct.toFixed(0)}% do orçamento.` });
      } else if (c.pct >= 70) {
        list.push({ tone: "ink2", text: `${c.name} está em ${c.pct.toFixed(0)}% do orçamento.` });
      }
    });
    return list;
  }, [categorySummary]);

  /* ---------- mutations ---------- */
  const setFamilyName = (name) => {
    setData((d) => ({ ...d, family: { ...d.family, name } }));
  };

  const addPerson = (name) => {
    setData((d) => ({ ...d, persons: [...d.persons.filter(p=>!p.isFamily), { id: uid("p"), name, isFamily: false }, ...d.persons.filter(p=>p.isFamily)] }));
    showToast("Pessoa adicionada");
  };

  const addCategory = (name, type) => {
    setData((d) => ({ ...d, categories: [...d.categories, { id: uid("cat"), name, type }] }));
    showToast("Categoria criada");
  };

  const deleteCategory = (id) => {
    const emUsoPorLancamento = data.transactions.some((t) => t.categoryId === id);
    const emUsoPorRecorrencia = data.recurring.some((r) => r.categoryId === id);
    const emUsoPorOrcamento = Object.values(data.budgets).some((b) => Number(b.categoryBudgets?.[id] || 0) > 0);
    if (emUsoPorLancamento || emUsoPorRecorrencia || emUsoPorOrcamento) {
      showToast("Categoria em uso — edite ou remova os lançamentos relacionados antes de excluir.");
      return;
    }
    setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
    showToast("Categoria excluída");
  };

  const addAccount = (name) => {
    setData((d) => ({ ...d, accounts: [...d.accounts, { id: uid("acc"), name }] }));
    showToast("Conta adicionada");
  };

  const deleteAccount = (id) => setData((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== id) }));

  const addCard = (card) => {
    setData((d) => ({ ...d, creditCards: [...d.creditCards, { id: uid("card"), active: true, ...card }] }));
    showToast("Cartão cadastrado");
  };

  const setCategoryBudget = (catId, value) => {
    setData((d) => {
      const cur = d.budgets[month] || { plannedIncome: 0, categoryBudgets: {} };
      return {
        ...d,
        budgets: {
          ...d.budgets,
          [month]: { ...cur, categoryBudgets: { ...cur.categoryBudgets, [catId]: Number(value) || 0 } },
        },
      };
    });
  };

  const setPlannedIncome = (value) => {
    setData((d) => {
      const cur = d.budgets[month] || { plannedIncome: 0, categoryBudgets: {} };
      return { ...d, budgets: { ...d.budgets, [month]: { ...cur, plannedIncome: Number(value) || 0 } } };
    });
  };

  const saveTransaction = (form) => {
    setData((d) => {
      let txs = [...d.transactions];
      let recurringList = [...d.recurring];

      if (form.editingId) {
        txs = txs.map((t) => (t.id === form.editingId ? { ...t, ...form.base, date: form.date, amount: Number(form.amount) } : t));
        return { ...d, transactions: txs };
      }

      if (form.isRecurring) {
        const rec = {
          id: uid("rec"),
          personId: form.personId,
          categoryId: form.categoryId,
          type: form.type,
          description: form.description,
          amount: Number(form.amount),
          frequency: form.frequency,
          startDate: form.date,
          endDate: "",
          variableAmount: false,
        };
        recurringList.push(rec);
        let date = rec.startDate;
        const cap = addMonthsToDate(rec.startDate, RECURRING_HORIZON_MONTHS);
        while (date <= cap) {
          txs.push({
            id: uid("t"), personId: rec.personId, categoryId: rec.categoryId,
            accountId: form.accountId || null, creditCardId: form.creditCardId || null,
            type: rec.type, description: rec.description, amount: rec.amount, date,
            paymentMethod: form.paymentMethod, recurringId: rec.id,
            installmentGroupId: null, installmentNumber: null, installmentTotal: null, note: form.note || "",
          });
          date = stepDate(date, rec.frequency);
        }
      } else if (form.isInstallment && form.installments > 1) {
        const groupId = uid("grp");
        const n = Number(form.installments);
        const total = Number(form.amount);
        const base = Math.floor((total / n) * 100) / 100;
        let acc = 0;
        for (let i = 0; i < n; i++) {
          const isLast = i === n - 1;
          const val = isLast ? Math.round((total - acc) * 100) / 100 : base;
          acc += val;
          txs.push({
            id: uid("t"), personId: form.personId, categoryId: form.categoryId,
            accountId: null, creditCardId: form.creditCardId,
            type: form.type, description: form.description, amount: val,
            date: addMonthsToDate(form.date, i), paymentMethod: "Crédito",
            recurringId: null, installmentGroupId: groupId, installmentNumber: i + 1,
            installmentTotal: n, note: form.note || "",
          });
        }
      } else {
        txs.push({
          id: uid("t"), personId: form.personId, categoryId: form.categoryId,
          accountId: form.accountId || null, creditCardId: form.creditCardId || null,
          type: form.type, description: form.description, amount: Number(form.amount),
          date: form.date, paymentMethod: form.paymentMethod, recurringId: null,
          installmentGroupId: null, installmentNumber: null, installmentTotal: null, note: form.note || "",
        });
      }
      return { ...d, transactions: txs, recurring: recurringList };
    });
    showToast(form.editingId ? "Lançamento atualizado" : "Lançamento adicionado");
  };

  const deleteTransaction = (id) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
    setDetailTx(null);
    showToast("Lançamento excluído");
  };

  const deleteRecurring = (id) => {
    setData((d) => ({ ...d, recurring: d.recurring.filter((r) => r.id !== id) }));
    showToast("Recorrência removida (lançamentos já gerados permanecem)");
  };

  /* ---------- backup e exportação ---------- */
  const handleExportBackup = () => {
    exportBackupJSON(data);
    showToast("Backup exportado");
  };

  const handleImportBackup = async (file) => {
    try {
      const imported = await parseBackupFile(file);
      setData(imported);
      showToast("Backup importado com sucesso");
    } catch (e) {
      showToast(e.message || "Não foi possível importar o backup");
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(data, month);
      showToast("Excel exportado");
    } catch (e) {
      showToast("Não foi possível gerar o Excel");
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  if (!loaded) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
        <style>{`${FONT_IMPORT} * { font-family: 'Inter', sans-serif; }`}</style>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: GRADIENT_PRIMARY }} />
          <p className="text-sm" style={{ color: C.ink2 }}>Carregando seus dados…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex justify-center" style={{ background: PAGE_BG }}>
      <style>{`
        ${FONT_IMPORT}
        * { font-family: 'Inter', sans-serif; }
        .ff-serif { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.01em; }
        .tnum { font-variant-numeric: tabular-nums; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
      `}</style>

      <div className="w-full max-w-6xl flex">
        {/* SIDEBAR (desktop) */}
        <aside
          className="hidden md:flex flex-col w-60 shrink-0 min-h-screen px-4 py-6 gap-1"
          style={{ borderRight: `1px solid ${C.line}` }}
        >
          <div className="px-2 mb-6 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: GRADIENT_PRIMARY, boxShadow: "0 6px 20px -6px rgba(139,92,246,0.7)" }} />
            <div>
              <p className="ff-serif text-lg font-semibold leading-tight" style={{ color: C.ink }}>{data.family.name || "Minha família"}</p>
              <p className="text-xs" style={{ color: C.ink3 }}>Controle financeiro familiar</p>
            </div>
          </div>
          <NavItem icon={<Home size={18} />} label="Início" active={tab === "inicio"} onClick={() => { setTab("inicio"); setMoreScreen(null); }} />
          <NavItem icon={<Receipt size={18} />} label="Lançamentos" active={tab === "lancamentos"} onClick={() => { setTab("lancamentos"); setMoreScreen(null); }} />
          <NavItem icon={<Wallet size={18} />} label="Metas" active={tab === "orcamento"} onClick={() => { setTab("orcamento"); setMoreScreen(null); }} />
          <NavItem icon={<CardIcon size={18} />} label="Cartões" active={tab === "cartoes"} onClick={() => { setTab("cartoes"); setMoreScreen(null); }} />
          <div className="h-px my-3" style={{ background: C.line2 }} />
          <NavItem icon={<Users size={18} />} label="Pessoas" active={moreScreen === "pessoas"} onClick={() => { setTab("mais"); setMoreScreen("pessoas"); }} />
          <NavItem icon={<Repeat size={18} />} label="Recorrências" active={moreScreen === "recorrencias"} onClick={() => { setTab("mais"); setMoreScreen("recorrencias"); }} />
          <NavItem icon={<Tag size={18} />} label="Categorias" active={moreScreen === "categorias"} onClick={() => { setTab("mais"); setMoreScreen("categorias"); }} />
          <NavItem icon={<Landmark size={18} />} label="Contas" active={moreScreen === "contas"} onClick={() => { setTab("mais"); setMoreScreen("contas"); }} />
          <NavItem icon={<PieIcon size={18} />} label="Relatórios" active={moreScreen === "relatorios"} onClick={() => { setTab("mais"); setMoreScreen("relatorios"); }} />
          <NavItem icon={<Settings size={18} />} label="Configurações" active={moreScreen === "config"} onClick={() => { setTab("mais"); setMoreScreen("config"); }} />
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-h-screen pb-24 md:pb-10">
          <div className="px-4 sm:px-6 pt-6 max-w-2xl md:max-w-none mx-auto">
            {tab === "inicio" && (
              <Dashboard
                month={month} setMonth={setMonth}
                personFilter={personFilter} setPersonFilter={setPersonFilter}
                persons={data.persons} totals={totals} orcamentoTotal={orcamentoTotal}
                disponivel={disponivel} categorySummary={categorySummary} alerts={alerts}
                onAdd={(type) => setTxModal({ editing: null, defaultType: type })}
                onOpenTx={(t) => setDetailTx(t)}
                monthTx={visibleTx} catById={catById} personById={personById}
              />
            )}
            {tab === "lancamentos" && (
              <TransactionsScreen
                month={month} setMonth={setMonth}
                personFilter={personFilter} setPersonFilter={setPersonFilter}
                persons={data.persons} txs={visibleTx} catById={catById} personById={personById}
                onAdd={(type) => setTxModal({ editing: null, defaultType: type })}
                onOpenTx={(t) => setDetailTx(t)}
              />
            )}
            {tab === "orcamento" && (
              <BudgetScreen
                month={month} setMonth={setMonth}
                budget={budget} categorySummary={categorySummary}
                orcamentoTotal={orcamentoTotal} totals={totals} disponivel={disponivel}
                categories={data.categories}
                onSetCatBudget={setCategoryBudget} onSetIncome={setPlannedIncome}
              />
            )}
            {tab === "cartoes" && (
              <CardsScreen
                cards={data.creditCards} personById={personById}
                transactions={data.transactions} month={month}
                onOpen={(c) => setCardDetail(c)}
                onAddCard={() => setTxModal({ addCard: true })}
              />
            )}
            {tab === "mais" && !moreScreen && (
              <MoreMenu onSelect={setMoreScreen} />
            )}
            {tab === "mais" && moreScreen === "pessoas" && (
              <PeopleScreen persons={data.persons} transactions={data.transactions} month={month} catById={catById} onBack={() => setMoreScreen(null)} onAddPerson={addPerson} />
            )}
            {tab === "mais" && moreScreen === "recorrencias" && (
              <RecurringScreen recurring={data.recurring} catById={catById} personById={personById} onBack={() => setMoreScreen(null)} onDelete={deleteRecurring} />
            )}
            {tab === "mais" && moreScreen === "categorias" && (
              <CategoriesScreen categories={data.categories} onBack={() => setMoreScreen(null)} onAdd={addCategory} onDelete={deleteCategory} />
            )}
            {tab === "mais" && moreScreen === "contas" && (
              <AccountsScreen accounts={data.accounts} onBack={() => setMoreScreen(null)} onAdd={addAccount} onDelete={deleteAccount} />
            )}
            {tab === "mais" && moreScreen === "relatorios" && (
              <ReportsScreen transactions={data.transactions} month={month} setMonth={setMonth} catById={catById} personById={personById} categories={data.categories} budgets={data.budgets} onBack={() => setMoreScreen(null)} onExportExcel={handleExportExcel} />
            )}
            {tab === "mais" && moreScreen === "config" && (
              <SettingsScreen
                family={data.family} onBack={() => setMoreScreen(null)}
                onSetFamilyName={setFamilyName}
                onExportBackup={handleExportBackup} onImportBackup={handleImportBackup}
                onExportExcel={handleExportExcel}
              />
            )}
          </div>
        </main>
      </div>

      {/* BOTTOM NAV mobile */}
      <nav
        className="md:hidden fixed left-3 right-3 z-30 flex items-stretch justify-around px-2 py-1.5 rounded-[28px]"
        style={{
          background: "rgba(22,24,31,0.85)",
          border: `1px solid ${C.line}`,
          boxShadow: "0 16px 40px -14px rgba(0,0,0,0.7)",
          backdropFilter: "blur(10px)",
          bottom: "calc(env(safe-area-inset-bottom) + 12px)",
        }}
      >
        <BottomTab icon={<Home size={20} />} label="Início" active={tab === "inicio"} onClick={() => { setTab("inicio"); setMoreScreen(null); }} />
        <BottomTab icon={<Receipt size={20} />} label="Lançamentos" active={tab === "lancamentos"} onClick={() => { setTab("lancamentos"); setMoreScreen(null); }} />
        <BottomTab icon={<Wallet size={20} />} label="Metas" active={tab === "orcamento"} onClick={() => { setTab("orcamento"); setMoreScreen(null); }} />
        <BottomTab icon={<CardIcon size={20} />} label="Cartões" active={tab === "cartoes"} onClick={() => { setTab("cartoes"); setMoreScreen(null); }} />
        <BottomTab icon={<MoreHorizontal size={20} />} label="Mais" active={tab === "mais"} onClick={() => setTab("mais")} />
      </nav>

      {/* FLOATING ADD (lançamentos) */}
      {tab === "lancamentos" && (
        <button
          onClick={() => setTxModal({ editing: null, defaultType: "despesa" })}
          className="md:hidden fixed right-5 bottom-24 z-30 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: GRADIENT_PRIMARY, color: "#fff", boxShadow: "0 14px 30px -10px rgba(139,92,246,0.75)" }}
        >
          <Plus size={26} />
        </button>
      )}

      {/* TX MODAL */}
      {txModal && !txModal.addCard && (
        <TransactionForm
          data={data} month={month}
          initial={txModal.editing}
          defaultType={txModal.defaultType}
          onClose={() => setTxModal(null)}
          onSave={(form) => { saveTransaction(form); setTxModal(null); }}
        />
      )}
      {txModal && txModal.addCard && (
        <AddCardModal persons={data.persons} onClose={() => setTxModal(null)} onSave={(c) => { addCard(c); setTxModal(null); }} />
      )}

      {/* DETAIL MODAL */}
      {detailTx && (
        <TransactionDetail
          tx={detailTx} catById={catById} personById={personById} accById={accById} cardById={cardById}
          onClose={() => setDetailTx(null)}
          onEdit={() => { setTxModal({ editing: detailTx }); setDetailTx(null); }}
          onDelete={() => deleteTransaction(detailTx.id)}
        />
      )}

      {/* CARD DETAIL */}
      {cardDetail && (
        <CardDetail
          card={cardDetail} transactions={data.transactions} month={month} personById={personById} catById={catById}
          onClose={() => setCardDetail(null)}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2"
          style={{ background: "#1B1E27", color: C.ink, border: `1px solid ${C.line}`, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.7)" }}
        >
          <Check size={16} color={C.pine} /> {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NAV COMPONENTS
============================================================ */
const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
    style={{ background: active ? C.brassSoft : "transparent", color: active ? C.brass : C.ink2 }}
  >
    {icon}{label}
  </button>
);

const BottomTab = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center gap-0.5 py-1.5" style={{ color: active ? C.ink : C.ink3 }}>
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const MonthSwitcher = ({ month, setMonth }) => (
  <div className="flex items-center gap-2">
    <IconBtn onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></IconBtn>
    <span className="ff-serif text-base font-semibold w-40 text-center" style={{ color: C.ink }}>{monthLabel(month)}</span>
    <IconBtn onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></IconBtn>
  </div>
);

const PersonFilterBar = ({ persons, value, onChange }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
    {[{ id: "all", name: "Todos" }, ...persons].map((p) => {
      const active = value === p.id;
      const color = p.id === "all" ? C.ink : personColor(p.id);
      const soft = p.id === "all" ? C.line2 : personSoft(p.id);
      return (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0"
          style={{ background: active ? color : soft, color: active ? "#fff" : color }}
        >
          {p.name}
        </button>
      );
    })}
  </div>
);

/* ============================================================
   DASHBOARD
============================================================ */
function Dashboard({ month, setMonth, personFilter, setPersonFilter, persons, totals, orcamentoTotal, disponivel, categorySummary, alerts, onAdd, onOpenTx, monthTx, catById, personById }) {
  const recentTx = [...monthTx].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <MonthSwitcher month={month} setMonth={setMonth} />
        <div className="hidden sm:flex gap-2">
          <GhostBtn onClick={() => onAdd("receita")}>+ Receita</GhostBtn>
          <PrimaryBtn onClick={() => onAdd("despesa")}>+ Despesa</PrimaryBtn>
        </div>
      </div>

      <PersonFilterBar persons={persons} value={personFilter} onChange={setPersonFilter} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Receitas" value={totals.receitas} color={C.pine} icon={<ArrowUpRight size={16} />} />
        <StatCard label="Despesas" value={totals.despesas} color={C.brick} icon={<ArrowDownRight size={16} />} />
        <StatCard label="Resultado" value={totals.resultado} color={totals.resultado < 0 ? C.brick : C.pine} icon={<Wallet2 size={16} />} big />
        <StatCard label="Meta de despesas" value={orcamentoTotal} color={C.ink} icon={<Wallet size={16} />} />
      </div>

      <Card style={{ padding: 16 }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} color={C.clay} />
          <h3 className="font-semibold text-sm" style={{ color: C.ink }}>Atenção</h3>
        </div>
        {alerts.length === 0 ? (
          <p className="text-sm" style={{ color: C.ink3 }}>Nenhum alerta no momento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: C.ink2 }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.tone === "brick" ? C.brick : a.tone === "clay" ? C.clay : C.ink3 }} />
                {a.text}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div>
        <h3 className="ff-serif font-semibold text-lg mb-3" style={{ color: C.ink }}>Despesas e metas por categoria</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {categorySummary.length === 0 && (
            <p className="text-sm" style={{ color: C.ink3 }}>Nenhuma meta ou limite definido ainda. Você pode definir limites por categoria na aba Metas.</p>
          )}
          {categorySummary.map((c) => {
            const tone = c.gasto > c.orcamento ? "brick" : c.pct >= 90 ? "clay" : "pine";
            return (
              <Card key={c.id} style={{ padding: 16 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm" style={{ color: C.ink }}>{c.name}</span>
                  <span className="text-xs tnum" style={{ color: C.ink3 }}>{brl(c.gasto)} / {brl(c.orcamento)}</span>
                </div>
                <ProgressBar pct={c.pct} tone={tone} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold" style={{ color: tone === "brick" ? C.brick : tone === "clay" ? C.clay : C.ink3 }}>
                    {c.gasto > c.orcamento ? "Limite excedido" : `${c.pct.toFixed(0)}% do limite`}
                  </span>
                  <span className="text-xs" style={{ color: C.ink3 }}>{brl(Math.max(c.disponivel, 0))} abaixo do limite</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="ff-serif font-semibold text-lg" style={{ color: C.ink }}>Lançamentos recentes</h3>
        </div>
        <Card>
          {recentTx.length === 0 ? (
            <EmptyState icon={<Receipt size={28} />} text="Nenhum lançamento neste mês para este filtro." />
          ) : (
            recentTx.map((t, i) => <TxRow key={t.id} t={t} catById={catById} personById={personById} onClick={() => onOpenTx(t)} last={i === recentTx.length - 1} />)
          )}
        </Card>
      </div>

      <div className="sm:hidden h-2" />
    </div>
  );
}

const StatCard = ({ label, value, color, icon, big }) => (
  <Card
    style={
      big
        ? { padding: 16, background: GRADIENT_PRIMARY, border: "none", boxShadow: "0 16px 36px -12px rgba(139,92,246,0.6)" }
        : { padding: 16 }
    }
  >
    <div className="flex items-center gap-1.5 mb-2" style={{ color: big ? "rgba(255,255,255,0.85)" : C.ink3 }}>
      {icon}
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p className={`ff-serif font-semibold tnum ${big ? "text-2xl" : "text-xl"}`} style={{ color: big ? "#fff" : color }}>{brl(value)}</p>
  </Card>
);

const TxRow = ({ t, catById, personById, onClick, last }) => {
  const cat = catById[t.categoryId];
  const person = personById[t.personId];
  const isReceita = t.type === "receita";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{ borderBottom: last ? "none" : `1px solid ${C.line2}` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.line2)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isReceita ? C.pineSoft : C.brickSoft }}>
        {isReceita ? <ArrowUpRight size={16} color={C.pine} /> : <ArrowDownRight size={16} color={C.brick} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: C.ink }}>
          {t.description}
          {t.installmentTotal ? <span className="text-xs font-normal ml-1" style={{ color: C.ink3 }}>({t.installmentNumber}/{t.installmentTotal})</span> : null}
        </p>
        <p className="text-xs" style={{ color: C.ink3 }}>{cat?.name} · {dmy(t.date)}</p>
      </div>
      <Pill color={personColor(t.personId)} soft={personSoft(t.personId)}>{person?.name}</Pill>
      <span className="text-sm font-semibold tnum shrink-0" style={{ color: isReceita ? C.pine : C.ink }}>
        {isReceita ? "+" : "-"}{brl(t.amount)}
      </span>
    </button>
  );
};

/* ============================================================
   LANÇAMENTOS
============================================================ */
function TransactionsScreen({ month, setMonth, personFilter, setPersonFilter, persons, txs, catById, personById, onAdd, onOpenTx }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");

  const filtered = useMemo(() => {
    return txs
      .filter((t) => (typeFilter === "todos" ? true : t.type === typeFilter))
      .filter((t) => t.description.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [txs, typeFilter, query]);

  const receitas = filtered.filter((t) => t.type === "receita");
  const despesas = filtered.filter((t) => t.type === "despesa");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <MonthSwitcher month={month} setMonth={setMonth} />
        <div className="hidden sm:block">
          <PrimaryBtn onClick={() => onAdd("despesa")}><span className="flex items-center gap-1.5"><Plus size={16} /> Adicionar</span></PrimaryBtn>
        </div>
      </div>

      <PersonFilterBar persons={persons} value={personFilter} onChange={setPersonFilter} />

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 rounded-lg" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
          <Search size={16} color={C.ink3} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar lançamentos"
            className="flex-1 py-2.5 text-sm outline-none bg-transparent" style={{ color: C.ink }}
          />
        </div>
      </div>

      <SegButton
        value={typeFilter}
        onChange={setTypeFilter}
        options={[{ value: "todos", label: "Todos" }, { value: "receita", label: "Receitas" }, { value: "despesa", label: "Despesas" }]}
      />

      {typeFilter !== "receita" && (
        <Section title="Despesas" count={despesas.length}>
          {despesas.length === 0 ? <EmptyStateCard text="Nenhuma despesa encontrada." /> :
            <Card>{despesas.map((t, i) => <TxRow key={t.id} t={t} catById={catById} personById={personById} onClick={() => onOpenTx(t)} last={i === despesas.length - 1} />)}</Card>}
        </Section>
      )}

      {typeFilter !== "despesa" && (
        <Section title="Receitas" count={receitas.length}>
          {receitas.length === 0 ? <EmptyStateCard text="Nenhuma receita encontrada." /> :
            <Card>{receitas.map((t, i) => <TxRow key={t.id} t={t} catById={catById} personById={personById} onClick={() => onOpenTx(t)} last={i === receitas.length - 1} />)}</Card>}
        </Section>
      )}

      <div className="h-16 sm:h-0" />
    </div>
  );
}

const Section = ({ title, count, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <h3 className="ff-serif font-semibold text-base" style={{ color: C.ink }}>{title}</h3>
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.line2, color: C.ink3 }}>{count}</span>
    </div>
    {children}
  </div>
);

const EmptyStateCard = ({ text }) => (
  <Card><EmptyState icon={<Filter size={26} />} text={text} /></Card>
);

/* ============================================================
   ORÇAMENTO
============================================================ */
function BudgetScreen({ month, setMonth, budget, categorySummary, orcamentoTotal, totals, disponivel, categories, onSetCatBudget, onSetIncome }) {
  const despCats = categories.filter((c) => c.type === "despesa");
  return (
    <div className="flex flex-col gap-5">
      <MonthSwitcher month={month} setMonth={setMonth} />

      <Card style={{ padding: 20 }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.ink3 }}>Planejamento de receitas — {monthLabel(month)}</p>
        <div className="flex items-center gap-3">
          <span className="ff-serif text-2xl font-semibold tnum" style={{ color: C.ink }}>R$</span>
          <input
            type="number" value={budget.plannedIncome} onChange={(e) => onSetIncome(e.target.value)}
            className="ff-serif text-2xl font-semibold tnum bg-transparent outline-none w-40"
            style={{ color: C.ink }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Receitas" value={totals.receitas} color={C.pine} icon={<ArrowUpRight size={14} />} />
        <StatCard label="Despesas" value={totals.despesas} color={C.brick} icon={<ArrowDownRight size={14} />} />
        <StatCard label="Resultado" value={totals.resultado} color={totals.resultado < 0 ? C.brick : C.pine} icon={<Wallet2 size={14} />} />
      </div>

      <Card style={{ padding: 0 }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <h3 className="ff-serif font-semibold text-base" style={{ color: C.ink }}>Metas e limites por categoria</h3>
          <p className="text-xs mt-0.5" style={{ color: C.ink3 }}>Os gastos são calculados automaticamente. Os valores abaixo funcionam apenas como metas ou limites de planejamento e não alteram o resultado financeiro.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: C.ink3 }}>
                <th className="text-left font-medium px-4 py-2 text-xs uppercase tracking-wide">Categoria</th>
                <th className="text-right font-medium px-4 py-2 text-xs uppercase tracking-wide">Meta / limite</th>
                <th className="text-right font-medium px-4 py-2 text-xs uppercase tracking-wide">Gasto</th>
                <th className="text-right font-medium px-4 py-2 text-xs uppercase tracking-wide">Diferença para o limite</th>
              </tr>
            </thead>
            <tbody>
              {despCats.map((c) => {
                const gasto = categorySummary.find((cs) => cs.id === c.id)?.gasto || 0;
                const orc = Number(budget.categoryBudgets[c.id] || 0);
                const disp = orc - gasto;
                return (
                  <tr key={c.id} style={{ borderTop: `1px solid ${C.line2}` }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: C.ink }}>{c.name}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number" value={orc === 0 ? "" : orc} placeholder="0"
                        onChange={(e) => onSetCatBudget(c.id, e.target.value)}
                        className="w-24 text-right bg-transparent outline-none tnum px-1 py-1 rounded"
                        style={{ color: C.ink }}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right tnum" style={{ color: C.ink2 }}>{brl(gasto)}</td>
                    <td className="px-4 py-2.5 text-right tnum font-semibold" style={{ color: disp < 0 ? C.brick : C.pine }}>{brl(disp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   CARTÕES
============================================================ */
function CardsScreen({ cards, personById, transactions, month, onOpen, onAddCard }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="ff-serif text-xl font-semibold" style={{ color: C.ink }}>Cartões de crédito</h2>
        <GhostBtn onClick={onAddCard}><span className="flex items-center gap-1.5"><Plus size={16} /> Novo cartão</span></GhostBtn>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.length === 0 && (
          <div className="sm:col-span-2">
            <Card><EmptyState icon={<CardIcon size={26} />} text="Nenhum cartão cadastrado. Toque em “Novo cartão” para adicionar o primeiro." /></Card>
          </div>
        )}
        {cards.map((card) => {
          const faturaAtual = transactions.filter((t) => t.creditCardId === card.id && monthKey(t.date) === month).reduce((s, t) => s + t.amount, 0);
          const proximaFatura = transactions.filter((t) => t.creditCardId === card.id && monthKey(t.date) === shiftMonth(month, 1)).reduce((s, t) => s + t.amount, 0);
          const disponivel = Math.max(card.limit - faturaAtual, 0);
          const usedPct = card.limit > 0 ? (faturaAtual / card.limit) * 100 : 0;
          return (
            <Card key={card.id} onClick={() => onOpen(card)} style={{ padding: 20, cursor: "pointer" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="ff-serif text-lg font-semibold" style={{ color: C.ink }}>{card.name}</p>
                  <p className="text-xs" style={{ color: C.ink3 }}>Titular: {personById[card.personId]?.name}</p>
                </div>
                <CardIcon size={22} color={C.brass} />
              </div>
              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: C.ink3 }}>Fatura atual</p>
              <p className="ff-serif text-2xl font-semibold tnum mb-3" style={{ color: C.ink }}>{brl(faturaAtual)}</p>
              <ProgressBar pct={usedPct} tone={usedPct > 90 ? "brick" : usedPct > 70 ? "clay" : "pine"} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: C.ink3 }}>
                <span>Limite disponível: <b style={{ color: C.ink2 }}>{brl(disponivel)}</b></span>
                <span>Limite: {brl(card.limit)}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 text-xs" style={{ borderTop: `1px solid ${C.line2}`, color: C.ink3 }}>
                <span>Fecha dia {card.closingDay}</span>
                <span>Vence dia {card.dueDay}</span>
                <span>Próxima: {brl(proximaFatura)}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

function CardDetail({ card, transactions, month, personById, catById, onClose }) {
  const [viewMonth, setViewMonth] = useState(month);
  const txs = transactions.filter((t) => t.creditCardId === card.id && monthKey(t.date) === viewMonth).sort((a, b) => (a.date < b.date ? 1 : -1));
  const faturaAtual = txs.reduce((s, t) => s + t.amount, 0);
  return (
    <Modal title={`Fatura · ${card.name}`} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <MonthSwitcher month={viewMonth} setMonth={setViewMonth} />
        <span className="ff-serif text-xl font-semibold tnum" style={{ color: C.ink }}>{brl(faturaAtual)}</span>
      </div>
      <div className="flex flex-col gap-2 mb-4 text-xs" style={{ color: C.ink3 }}>
        <span>Titular: {personById[card.personId]?.name} · Limite {brl(card.limit)} · Fecha dia {card.closingDay} · Vence dia {card.dueDay}</span>
      </div>
      <Card style={{ padding: 0 }}>
        {txs.length === 0 ? <EmptyState icon={<CardIcon size={26} />} text="Nenhum lançamento nesta fatura." /> :
          txs.map((t, i) => <TxRow key={t.id} t={t} catById={catById} personById={personById} onClick={() => {}} last={i === txs.length - 1} />)}
      </Card>
    </Modal>
  );
}

function AddCardModal({ persons, onClose, onSave }) {
  const real = persons.filter((p) => !p.isFamily);
  const [name, setName] = useState("");
  const [personId, setPersonId] = useState(real[0]?.id || "");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");

  if (real.length === 0) {
    return (
      <Modal title="Novo cartão" onClose={onClose}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: C.claySoft, color: C.clay }}>
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            Cadastre pelo menos uma pessoa em Mais → Pessoas antes de adicionar um cartão — todo cartão precisa de um titular.
          </div>
          <GhostBtn full onClick={onClose}>Entendi</GhostBtn>
        </div>
      </Modal>
    );
  }

  const canSave = name.trim() && personId;

  return (
    <Modal title="Novo cartão" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Nome do cartão"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bradesco" /></Field>
        <Field label="Titular">
          <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            {real.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Limite"><TextInput type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0" /></Field>
          <Field label="Fechamento"><TextInput type="number" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} placeholder="Dia" /></Field>
          <Field label="Vencimento"><TextInput type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Dia" /></Field>
        </div>
        <PrimaryBtn full style={{ opacity: canSave ? 1 : 0.5 }} onClick={() => canSave && onSave({ name, personId, limit: Number(limit) || 0, closingDay: Number(closingDay) || 1, dueDay: Number(dueDay) || 1 })}>
          Salvar cartão
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

/* ============================================================
   MAIS — MENU
============================================================ */
function MoreMenu({ onSelect }) {
  const items = [
    { id: "pessoas", label: "Pessoas", icon: <Users size={18} />, desc: "Membros da família e seus valores" },
    { id: "recorrencias", label: "Recorrências", icon: <Repeat size={18} />, desc: "Receitas e despesas fixas" },
    { id: "categorias", label: "Categorias", icon: <Tag size={18} />, desc: "Organize receitas e despesas" },
    { id: "contas", label: "Contas", icon: <Landmark size={18} />, desc: "Formas de pagamento" },
    { id: "relatorios", label: "Relatórios", icon: <PieIcon size={18} />, desc: "Gráficos e evolução" },
    { id: "config", label: "Configurações", icon: <Settings size={18} />, desc: "Preferências do app" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <h2 className="ff-serif text-xl font-semibold mb-1" style={{ color: C.ink }}>Mais</h2>
      {items.map((it) => (
        <Card key={it.id} onClick={() => onSelect(it.id)} style={{ padding: 14, cursor: "pointer" }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.brassSoft, color: C.brass }}>{it.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{it.label}</p>
            <p className="text-xs" style={{ color: C.ink3 }}>{it.desc}</p>
          </div>
          <ChevronRightSm size={18} color={C.ink3} />
        </Card>
      ))}
      <div className="h-16 sm:h-0" />
    </div>
  );
}

const BackHeader = ({ title, onBack }) => (
  <div className="flex items-center gap-2 mb-1">
    <IconBtn onClick={onBack}><ChevronLeft size={20} /></IconBtn>
    <h2 className="ff-serif text-xl font-semibold" style={{ color: C.ink }}>{title}</h2>
  </div>
);

/* ============================================================
   PESSOAS
============================================================ */
function PeopleScreen({ persons, transactions, month, catById, onBack, onAddPerson }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const monthTx = transactions.filter((t) => monthKey(t.date) === month);

  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Pessoas da família" onBack={onBack} />
      {persons.map((p) => {
        const own = monthTx.filter((t) => t.personId === p.id);
        const receitas = own.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
        const despesas = own.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
        return (
          <Card key={p.id} style={{ padding: 16 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ background: personSoft(p.id), color: personColor(p.id) }}>
                {p.name.slice(0, 1)}
              </div>
              <p className="font-semibold" style={{ color: C.ink }}>{p.name}{p.isFamily ? " (compartilhado)" : ""}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: C.ink3 }}>{p.isFamily ? "Despesas compartilhadas" : "Receitas no mês"}</p>
                {!p.isFamily && <p className="tnum font-semibold" style={{ color: C.pine }}>{brl(receitas)}</p>}
                {p.isFamily && <p className="tnum font-semibold" style={{ color: C.brick }}>{brl(despesas)}</p>}
              </div>
              {!p.isFamily && (
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: C.ink3 }}>Despesas no mês</p>
                  <p className="tnum font-semibold" style={{ color: C.brick }}>{brl(despesas)}</p>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {adding ? (
        <Card style={{ padding: 16 }}>
          <Field label="Nome da pessoa">
            <div className="flex gap-2 mt-1.5">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João" />
              <PrimaryBtn onClick={() => { if (name.trim()) { onAddPerson(name.trim()); setName(""); setAdding(false); } }}>Salvar</PrimaryBtn>
            </div>
          </Field>
        </Card>
      ) : (
        <GhostBtn full onClick={() => setAdding(true)}><span className="flex items-center justify-center gap-1.5"><Plus size={16} /> Adicionar pessoa</span></GhostBtn>
      )}
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   RECORRÊNCIAS
============================================================ */
function RecurringScreen({ recurring, catById, personById, onBack, onDelete }) {
  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Recorrências" onBack={onBack} />
      <p className="text-sm -mt-2" style={{ color: C.ink3 }}>
        Editar um lançamento específico não altera esta regra. Cada recorrência gera lançamentos com até 5 anos de antecedência a partir da data inicial.
      </p>
      <Card style={{ padding: 0 }}>
        {recurring.length === 0 ? <EmptyState icon={<Repeat size={26} />} text="Nenhuma recorrência cadastrada." /> :
          recurring.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i === recurring.length - 1 ? "none" : `1px solid ${C.line2}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: r.type === "receita" ? C.pineSoft : C.brickSoft }}>
                <Repeat size={15} color={r.type === "receita" ? C.pine : C.brick} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{r.description}</p>
                <p className="text-xs" style={{ color: C.ink3 }}>
                  {catById[r.categoryId]?.name} · {r.frequency} · desde {dmy(r.startDate)}{r.variableAmount ? " · valor variável" : ""}
                </p>
              </div>
              <Pill color={personColor(r.personId)} soft={personSoft(r.personId)}>{personById[r.personId]?.name}</Pill>
              <span className="text-sm font-semibold tnum" style={{ color: r.type === "receita" ? C.pine : C.ink }}>{brl(r.amount)}</span>
              <IconBtn onClick={() => onDelete(r.id)}><Trash2 size={16} /></IconBtn>
            </div>
          ))}
      </Card>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   CATEGORIAS
============================================================ */
function CategoriesScreen({ categories, onBack, onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("despesa");
  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  const List = ({ items }) => (
    <Card style={{ padding: 0 }}>
      {items.map((c, i) => (
        <div key={c.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i === items.length - 1 ? "none" : `1px solid ${C.line2}` }}>
          <span className="text-sm font-medium" style={{ color: C.ink }}>{c.name}</span>
          <IconBtn onClick={() => onDelete(c.id)}><Trash2 size={15} /></IconBtn>
        </div>
      ))}
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Categorias" onBack={onBack} />
      <Card style={{ padding: 16 }}>
        <Field label="Nova categoria">
          <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" />
            <Select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 140 }}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
            <PrimaryBtn onClick={() => { if (name.trim()) { onAdd(name.trim(), type); setName(""); } }}>Adicionar</PrimaryBtn>
          </div>
        </Field>
      </Card>
      <Section title="Despesas" count={despesas.length}><List items={despesas} /></Section>
      <Section title="Receitas" count={receitas.length}><List items={receitas} /></Section>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   CONTAS
============================================================ */
function AccountsScreen({ accounts, onBack, onAdd, onDelete }) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Contas" onBack={onBack} />
      <p className="text-sm -mt-2" style={{ color: C.ink3 }}>Usadas apenas para identificar a origem do lançamento — não representam controle patrimonial.</p>
      <Card style={{ padding: 16 }}>
        <Field label="Nova conta">
          <div className="flex gap-2 mt-1.5">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banco Inter" />
            <PrimaryBtn onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}>Adicionar</PrimaryBtn>
          </div>
        </Field>
      </Card>
      <Card style={{ padding: 0 }}>
        {accounts.map((a, i) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i === accounts.length - 1 ? "none" : `1px solid ${C.line2}` }}>
            <div className="flex items-center gap-2.5">
              <Landmark size={16} color={C.ink3} />
              <span className="text-sm font-medium" style={{ color: C.ink }}>{a.name}</span>
            </div>
            <IconBtn onClick={() => onDelete(a.id)}><Trash2 size={15} /></IconBtn>
          </div>
        ))}
      </Card>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   RELATÓRIOS
============================================================ */
const PIE_COLORS = [C.brass, C.pine, C.luid, C.maria, C.clay, C.brick, C.ink3, C.ink2, "#7C6A9C", "#4E8B7C"];

function ReportsScreen({ transactions, month, setMonth, catById, personById, categories, budgets, onBack, onExportExcel }) {
  const monthTx = transactions.filter((t) => monthKey(t.date) === month);

  const byCategory = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: catById[id]?.name || id, value }));
  }, [monthTx, catById]);

  const byPerson = useMemo(() => {
    const map = {};
    monthTx.filter((t) => t.type === "despesa").forEach((t) => { map[t.personId] = (map[t.personId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: personById[id]?.name || id, value }));
  }, [monthTx, personById]);

  const receitaDespesa = [
    { name: "Receitas", valor: monthTx.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0) },
    { name: "Despesas", valor: monthTx.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0) },
  ];

  const evolution = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const mk = shiftMonth(month, -i);
      const b = budgets[mk];
      const orc = b ? Object.values(b.categoryBudgets).reduce((s, v) => s + Number(v || 0), 0) : 0;
      const gasto = transactions.filter((t) => monthKey(t.date) === mk && t.type === "despesa").reduce((s, t) => s + t.amount, 0);
      out.push({ name: mk.slice(5), orcamento: orc, gasto });
    }
    return out;
  }, [month, budgets, transactions]);

  return (
    <div className="flex flex-col gap-5">
      <BackHeader title="Relatórios" onBack={onBack} />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <MonthSwitcher month={month} setMonth={setMonth} />
        <GhostBtn onClick={onExportExcel}>
          <span className="flex items-center gap-1.5"><FileSpreadsheet size={16} /> Exportar Excel</span>
        </GhostBtn>
      </div>

      <Card style={{ padding: 16 }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>Gastos por categoria</h3>
        {byCategory.length === 0 ? <EmptyState icon={<PieIcon size={26} />} text="Sem despesas neste mês." /> : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={85} innerRadius={50} paddingAngle={2}>
                {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1B1E27", border: `1px solid ${C.line}`, borderRadius: 10, color: C.ink }} formatter={(v) => brl(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.ink2 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card style={{ padding: 16 }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>Gastos por pessoa</h3>
        {byPerson.length === 0 ? <EmptyState icon={<Users size={26} />} text="Sem despesas neste mês." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPerson}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line2} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1B1E27", border: `1px solid ${C.line}`, borderRadius: 10, color: C.ink }} cursor={{ fill: C.line2 }} formatter={(v) => brl(v)} />
              <Bar dataKey="value" fill={C.brass} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card style={{ padding: 16 }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>Receitas x despesas</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={receitaDespesa}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line2} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1B1E27", border: `1px solid ${C.line}`, borderRadius: 10, color: C.ink }} cursor={{ fill: C.line2 }} formatter={(v) => brl(v)} />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              <Cell fill={C.pine} /><Cell fill={C.brick} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: 16 }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: C.ink }}>Evolução de despesas e limites (6 meses)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={evolution}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line2} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: C.ink3 }} axisLine={{ stroke: C.line }} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1B1E27", border: `1px solid ${C.line}`, borderRadius: 10, color: C.ink }} formatter={(v) => brl(v)} />
            <Legend wrapperStyle={{ fontSize: 12, color: C.ink2 }} />
            <Line type="monotone" dataKey="orcamento" name="Meta / limite" stroke={C.brass} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="gasto" name="Gasto" stroke={C.brick} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   CONFIGURAÇÕES
============================================================ */
function SettingsScreen({ family, onBack, onSetFamilyName, onExportBackup, onImportBackup, onExportExcel }) {
  const fileRef = useRef(null);
  const [confirmImport, setConfirmImport] = useState(null); // File pendente de confirmação

  return (
    <div className="flex flex-col gap-4">
      <BackHeader title="Configurações" onBack={onBack} />

      <Card style={{ padding: 16 }}>
        <Field label="Nome da família">
          <TextInput
            value={family.name}
            onChange={(e) => onSetFamilyName(e.target.value)}
            placeholder="Ex: Família Silva"
          />
        </Field>
      </Card>

      <Card style={{ padding: 16 }}>
        <p className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Exportar para Excel</p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: C.ink3 }}>
          Gera um arquivo .xlsx completo (Dashboard, Metas e Limites, Lançamentos, Pessoas, Cartões, Faturas, Parcelamentos, Relatórios e mais) com os dados do mês selecionado e o histórico completo de lançamentos.
        </p>
        <PrimaryBtn full onClick={onExportExcel}>
          <span className="flex items-center justify-center gap-1.5"><FileSpreadsheet size={16} /> Exportar para Excel</span>
        </PrimaryBtn>
      </Card>

      <Card style={{ padding: 16 }}>
        <p className="text-sm font-semibold mb-1" style={{ color: C.ink }}>Backup dos dados</p>
        <p className="text-xs leading-relaxed mb-3" style={{ color: C.ink3 }}>
          O backup é um arquivo .json com todos os dados do aplicativo — use para restaurar em caso de problema ou migrar de dispositivo. Recomendado antes de qualquer alteração importante.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <GhostBtn full onClick={onExportBackup}>
            <span className="flex items-center justify-center gap-1.5"><Download size={16} /> Exportar backup</span>
          </GhostBtn>
          <GhostBtn full onClick={() => fileRef.current?.click()}>
            <span className="flex items-center justify-center gap-1.5"><Upload size={16} /> Importar backup</span>
          </GhostBtn>
          <input
            ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setConfirmImport(f); e.target.value = ""; }}
          />
        </div>
      </Card>

      {confirmImport && (
        <Card style={{ padding: 16, background: C.brickSoft, border: `1px solid ${C.brick}` }}>
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} color={C.brick} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium" style={{ color: C.brick }}>
              Importar "{confirmImport.name}" vai substituir todos os dados atuais do aplicativo. Essa ação não pode ser desfeita. Deseja continuar?
            </p>
          </div>
          <div className="flex gap-2">
            <GhostBtn full onClick={() => setConfirmImport(null)}>Cancelar</GhostBtn>
            <PrimaryBtn full style={{ background: C.brick }} onClick={() => { onImportBackup(confirmImport); setConfirmImport(null); }}>
              Confirmar importação
            </PrimaryBtn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 16 }}>
        <div className="flex items-start gap-2">
          <Info size={16} color={C.ink3} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: C.ink3 }}>
            Seus dados ficam salvos automaticamente neste aplicativo — não é preciso clicar em "salvar". A arquitetura
            (Family, Person, Category, Budget, Account, CreditCard, Transaction, RecurringTransaction) foi organizada
            para permitir, no futuro, a substituição do armazenamento local por uma API e banco de dados real, sem
            precisar refazer as telas.
          </p>
        </div>
      </Card>
      <div className="h-16 sm:h-0" />
    </div>
  );
}

/* ============================================================
   FORM: NOVO / EDITAR LANÇAMENTO
============================================================ */
function TransactionForm({ data, month, initial, defaultType, onClose, onSave }) {
  const editing = !!initial;
  const [type, setType] = useState(initial?.type || defaultType || "despesa");
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [date, setDate] = useState(initial?.date || `${month}-01`);
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [personId, setPersonId] = useState(initial?.personId || "family");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod || "Pix");
  const [accountId, setAccountId] = useState(initial?.accountId || data.accounts[0]?.id || "");
  const [creditCardId, setCreditCardId] = useState(initial?.creditCardId || data.creditCards[0]?.id || "");
  const [isRecurring, setIsRecurring] = useState(!!initial?.recurringId);
  const [frequency, setFrequency] = useState("mensal");
  const [isInstallment, setIsInstallment] = useState(!!initial?.installmentTotal);
  const [installments, setInstallments] = useState(initial?.installmentTotal || 2);
  const [note, setNote] = useState(initial?.note || "");

  const cats = data.categories.filter((c) => c.type === type);
  React.useEffect(() => { if (!editing) setCategoryId(cats[0]?.id || ""); }, [type]); // eslint-disable-line

  const needsCard = paymentMethod === "Crédito";
  const canSave = description.trim() && Number(amount) > 0 && categoryId && date && (!needsCard || creditCardId);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      editingId: initial?.id,
      base: { description: description.trim(), categoryId, personId, paymentMethod, accountId: paymentMethod === "Crédito" ? null : accountId, creditCardId: paymentMethod === "Crédito" ? creditCardId : null, note, type },
      type, description: description.trim(), amount, date, categoryId, personId, paymentMethod,
      accountId: paymentMethod === "Crédito" ? null : accountId,
      creditCardId: paymentMethod === "Crédito" ? creditCardId : null,
      isRecurring: !editing && isRecurring, frequency,
      isInstallment: !editing && isInstallment && paymentMethod === "Crédito", installments,
      note,
    });
  };

  return (
    <Modal title={editing ? "Editar lançamento" : "Adicionar lançamento"} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {!editing && (
          <SegButton
            value={type} onChange={setType}
            options={[{ value: "despesa", label: "Nova despesa" }, { value: "receita", label: "Nova receita" }]}
          />
        )}

        <Field label="Descrição"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Supermercado" /></Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor">
            <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Data"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Responsável">
            <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {data.persons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Forma de pagamento">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Débito">Débito</option>
            <option value="Crédito">Crédito</option>
          </Select>
        </Field>

        {paymentMethod === "Crédito" ? (
          data.creditCards.length === 0 ? (
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: C.claySoft, color: C.clay }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              Nenhum cartão cadastrado ainda. Cadastre um cartão na aba "Cartões" antes de lançar uma compra no crédito.
            </div>
          ) : (
            <Field label="Cartão">
              <Select value={creditCardId} onChange={(e) => setCreditCardId(e.target.value)}>
                {data.creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )
        ) : (
          <Field label="Conta (opcional)">
            {data.accounts.length === 0 ? (
              <p className="text-xs" style={{ color: C.ink3 }}>Nenhuma conta cadastrada. Você pode adicionar uma em Mais → Contas, se quiser identificar a origem do lançamento.</p>
            ) : (
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            )}
          </Field>
        )}

        {!editing && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium" style={{ color: C.ink }}>É recorrente?</span>
              <SegButton
                value={isRecurring ? "sim" : "nao"}
                onChange={(v) => { setIsRecurring(v === "sim"); if (v === "sim") setIsInstallment(false); }}
                options={[{ value: "nao", label: "Não" }, { value: "sim", label: "Sim" }]}
              />
            </div>
            {isRecurring && (
              <Field label="Frequência">
                <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </Select>
              </Field>
            )}

            {paymentMethod === "Crédito" && !isRecurring && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium" style={{ color: C.ink }}>É parcelado?</span>
                  <SegButton
                    value={isInstallment ? "sim" : "nao"} onChange={(v) => setIsInstallment(v === "sim")}
                    options={[{ value: "nao", label: "Não" }, { value: "sim", label: "Sim" }]}
                  />
                </div>
                {isInstallment && (
                  <Field label="Número de parcelas">
                    <TextInput type="number" min={2} value={installments} onChange={(e) => setInstallments(e.target.value)} />
                    {Number(amount) > 0 && Number(installments) > 1 && (
                      <p className="text-xs mt-1" style={{ color: C.ink3 }}>
                        {installments}x de {brl(Number(amount) / Number(installments))}
                      </p>
                    )}
                  </Field>
                )}
              </>
            )}
          </>
        )}

        <Field label="Observação (opcional)"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicione um comentário" /></Field>

        <PrimaryBtn full onClick={handleSave} style={{ opacity: canSave ? 1 : 0.5 }}>
          {editing ? "Salvar alterações" : "Adicionar lançamento"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

/* ============================================================
   DETALHE DO LANÇAMENTO
============================================================ */
function TransactionDetail({ tx, catById, personById, accById, cardById, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isReceita = tx.type === "receita";
  return (
    <Modal title="Detalhes do lançamento" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="text-center py-3">
          <p className="text-sm" style={{ color: C.ink3 }}>{tx.description}</p>
          <p className="ff-serif text-3xl font-semibold tnum mt-1" style={{ color: isReceita ? C.pine : C.ink }}>
            {isReceita ? "+" : "-"}{brl(tx.amount)}
          </p>
          {tx.installmentTotal && <p className="text-xs mt-1" style={{ color: C.ink3 }}>Parcela {tx.installmentNumber} de {tx.installmentTotal}</p>}
          {tx.recurringId && <Pill color={C.brass} soft={C.brassSoft} style={{ marginTop: 8 }}><Repeat size={12} /> Recorrente</Pill>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailField label="Data" value={dmy(tx.date)} />
          <DetailField label="Categoria" value={catById[tx.categoryId]?.name} />
          <DetailField label="Responsável" value={personById[tx.personId]?.name} />
          <DetailField label="Pagamento" value={tx.paymentMethod} />
          {tx.accountId && <DetailField label="Conta" value={accById[tx.accountId]?.name} />}
          {tx.creditCardId && <DetailField label="Cartão" value={cardById[tx.creditCardId]?.name} />}
        </div>
        {tx.note && <DetailField label="Observação" value={tx.note} full />}

        {!confirmDelete ? (
          <div className="flex gap-2 mt-2">
            <GhostBtn full onClick={onEdit}><span className="flex items-center justify-center gap-1.5"><Pencil size={15} /> Editar</span></GhostBtn>
            <GhostBtn full onClick={() => setConfirmDelete(true)} style={{ color: C.brick, borderColor: C.brickSoft }}>
              <span className="flex items-center justify-center gap-1.5"><Trash2 size={15} /> Excluir</span>
            </GhostBtn>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2 p-3 rounded-xl" style={{ background: C.brickSoft }}>
            <p className="text-sm font-medium" style={{ color: C.brick }}>Excluir este lançamento? O orçamento será recalculado.</p>
            <div className="flex gap-2">
              <GhostBtn full onClick={() => setConfirmDelete(false)}>Cancelar</GhostBtn>
              <PrimaryBtn full onClick={onDelete} style={{ background: C.brick }}>Confirmar exclusão</PrimaryBtn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

const DetailField = ({ label, value, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.ink3 }}>{label}</p>
    <p className="text-sm font-medium mt-0.5" style={{ color: C.ink }}>{value}</p>
  </div>
);
