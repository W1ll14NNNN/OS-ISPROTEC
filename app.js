const STORAGE_KEY = "isprotec-management-v1";
const SESSION_KEY = "isprotec-session-v1";
const CLOUD_STATE_ID_DEFAULT = "isprotec-main";
const SUPABASE_CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const DEFAULT_COMPANY_LOGO = "assets/isprotec-logo.svg";
const MAX_LOGO_FILE_SIZE = 1024 * 1024;

const cloud = {
  client: null,
  enabled: false,
  ready: false,
  loading: false,
  saving: false,
  saveTimer: null,
  user: null,
  scriptPromise: null,
};

const orderStatuses = [
  "Entrada",
  "Diagnóstico",
  "Orçamento",
  "Aguardando aprovação",
  "Em reparo",
  "Pronto",
  "Entregue",
  "Cancelada",
];

const productiveStatuses = ["Em reparo", "Pronto", "Entregue"];

const state = {
  activeView: "dashboard",
  search: "",
  orderFilter: "Todos",
  financeMonth: localMonthISO(),
  reportMonth: localMonthISO(),
  selectedOrderIds: new Set(),
  selectedCustomerIds: new Set(),
  selectedEquipmentIds: new Set(),
  selectedPartIds: new Set(),
  selectedProductIds: new Set(),
  selectedTransactionIds: new Set(),
  selectedUserIds: new Set(),
  currentUserId: localStorage.getItem(SESSION_KEY) || "",
  data: loadData(),
  cloud,
};

const dom = {
  appShell: document.getElementById("appShell"),
  loginScreen: document.getElementById("loginScreen"),
  title: document.getElementById("viewTitle"),
  todayLabel: document.getElementById("todayLabel"),
  globalSearch: document.getElementById("globalSearch"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalTitle: document.getElementById("modalTitle"),
  modalKicker: document.getElementById("modalKicker"),
  modalBody: document.getElementById("modalBody"),
  toast: document.getElementById("toast"),
  importDataInput: document.getElementById("importDataInput"),
  importOrdersInput: document.getElementById("importOrdersInput"),
  currentUserInitial: document.getElementById("currentUserInitial"),
  currentUserName: document.getElementById("currentUserName"),
  currentUserRole: document.getElementById("currentUserRole"),
};

function seedData() {
  const today = new Date();
  const addDays = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return localDateISO(date);
  };

  return {
    settings: {
      companyName: "Isprotec Assistência Técnica em Impressoras",
      document: "00.000.000/0001-00",
      phone: "(00) 00000-0000",
      email: "atendimento@isprotec.com.br",
      address: "Rua da Assistência, 100 - Centro",
      logo: DEFAULT_COMPANY_LOGO,
      pixKey: "",
      pixName: "ISPROTEC",
      pixCity: "TRINDADE",
      bankInfo: "",
      defaultWarranty: 90,
      nextOrderNumber: 1054,
    },
    customers: [
      {
        id: "cus-1",
        name: "Gráfica Prisma",
        type: "Empresa",
        document: "12.345.678/0001-90",
        phone: "(11) 98888-1010",
        email: "contato@graficaprisma.com.br",
        address: "Av. Paulista, 1200",
        notes: "Contrato mensal de manutenção.",
      },
      {
        id: "cus-2",
        name: "Mercado São Jorge",
        type: "Empresa",
        document: "43.210.987/0001-15",
        phone: "(11) 97777-2020",
        email: "financeiro@saojorge.com.br",
        address: "Rua das Flores, 44",
        notes: "Atendimento prioritário para impressora do caixa.",
      },
      {
        id: "cus-3",
        name: "Ana Ribeiro",
        type: "Pessoa física",
        document: "123.456.789-00",
        phone: "(11) 96666-3030",
        email: "ana@email.com",
        address: "Rua Azul, 27",
        notes: "Prefere contato por WhatsApp.",
      },
    ],
    equipment: [
      {
        id: "eq-1",
        customerId: "cus-1",
        brand: "Brother",
        model: "DCP-L5652DN",
        serial: "BR5652-2024-889",
        type: "Laser mono",
        location: "Recepção",
        counter: 128540,
      },
      {
        id: "eq-2",
        customerId: "cus-2",
        brand: "Epson",
        model: "EcoTank L4260",
        serial: "EPS4260-7721",
        type: "Jato de tinta",
        location: "Escritório",
        counter: 22410,
      },
      {
        id: "eq-3",
        customerId: "cus-3",
        brand: "HP",
        model: "LaserJet M1132",
        serial: "HP1132-A91",
        type: "Laser mono",
        location: "Residência",
        counter: 39080,
      },
    ],
    parts: [
      {
        id: "part-1",
        sku: "TON-BR-1060",
        name: "Toner compatível Brother TN-1060",
        category: "Suprimento",
        stock: 8,
        minStock: 4,
        cost: 48,
        price: 95,
        supplier: "Distribuidora PrintMais",
      },
      {
        id: "part-2",
        sku: "ROL-HP-M1132",
        name: "Roletes HP M1132",
        category: "Peça",
        stock: 3,
        minStock: 3,
        cost: 28,
        price: 68,
        supplier: "Peças Laser Sul",
      },
      {
        id: "part-3",
        sku: "CAB-USB-2M",
        name: "Cabo USB 2 metros",
        category: "Acessório",
        stock: 12,
        minStock: 5,
        cost: 9,
        price: 25,
        supplier: "Eletro Atacado",
      },
      {
        id: "part-4",
        sku: "TINT-EPS-BLK",
        name: "Refil tinta Epson preta",
        category: "Suprimento",
        stock: 2,
        minStock: 4,
        cost: 24,
        price: 55,
        supplier: "Distribuidora PrintMais",
      },
    ],
    products: [
      {
        id: "prod-1",
        sku: "PRD-IMP-01",
        name: "Impressora Epson EcoTank L3250",
        category: "Impressoras",
        price: 899,
        cost: 740,
        stock: 4,
        minStock: 1,
        active: true,
        image: "assets/isprotec-products.png",
        description: "Modelo para escritório e uso doméstico.",
      },
      {
        id: "prod-2",
        sku: "PRD-TON-01",
        name: "Toner compatível Brother TN-1060",
        category: "Toners e cartuchos",
        price: 95,
        cost: 48,
        stock: 8,
        minStock: 3,
        active: true,
        image: "assets/isprotec-products.png",
        description: "Linha de reposição para impressoras laser.",
      },
      {
        id: "prod-3",
        sku: "PRD-REF-01",
        name: "Refil de tinta Epson preta",
        category: "Refis de tinta",
        price: 55,
        cost: 24,
        stock: 2,
        minStock: 4,
        active: true,
        image: "assets/isprotec-products.png",
        description: "Refil para tanque de tinta e recarga.",
      },
    ],
    services: [
      {
        id: "svc-1",
        name: "Limpeza cabeça impressão",
        category: "Limpeza",
        cost: 35,
        price: 120,
      },
      {
        id: "svc-2",
        name: "Manutenção preventiva",
        category: "Preventiva",
        cost: 45,
        price: 150,
      },
      {
        id: "svc-3",
        name: "Diagnóstico técnico",
        category: "Diagnóstico",
        cost: 20,
        price: 80,
      },
    ],
    users: [
      {
        id: "usr-1",
        name: "Willian",
        login: "willian",
        email: "willian@isprotec.com.br",
        role: "Administrador",
        phone: "(00) 00000-0000",
        status: "Ativo",
        password: "1234",
      },
      {
        id: "usr-2",
        name: "Carlos",
        login: "carlos",
        email: "carlos@isprotec.com.br",
        role: "Técnico",
        phone: "",
        status: "Ativo",
        password: "1234",
      },
      {
        id: "usr-3",
        name: "Marina",
        login: "marina",
        email: "marina@isprotec.com.br",
        role: "Atendente",
        phone: "",
        status: "Ativo",
        password: "1234",
      },
      {
        id: "usr-4",
        name: "Rafael",
        login: "rafael",
        email: "rafael@isprotec.com.br",
        role: "Técnico",
        phone: "",
        status: "Inativo",
        password: "1234",
      },
    ],
    orders: [
      {
        id: "os-1",
        number: 1051,
        customerId: "cus-1",
        equipmentId: "eq-1",
        title: "Falha de impressão e atolamento",
        issue: "Cliente relata atolamento constante e manchas no lado direito.",
        diagnosis: "Rolo de tração gasto e unidade suja.",
        solution: "Limpeza geral, troca de roletes e teste de 50 páginas.",
        status: "Em reparo",
        priority: "Alta",
        technician: "Willian",
        createdAt: addDays(-5),
        deadline: addDays(1),
        scheduledAt: addDays(0),
        labor: 180,
        discount: 0,
        parts: [{ partId: "part-2", qty: 1, price: 68 }],
        paid: 0,
        paymentStatus: "Pendente",
        warrantyDays: 90,
        partsReserved: true,
        history: [{ date: addDays(-5), text: "Equipamento recebido e triado." }],
      },
      {
        id: "os-2",
        number: 1052,
        customerId: "cus-2",
        equipmentId: "eq-2",
        title: "Não puxa papel",
        issue: "Impressora liga, mas não alimenta folhas na bandeja.",
        diagnosis: "Sistema de alimentação com sujeira e rolete ressecado.",
        solution: "Limpeza do caminho de papel e regulagem.",
        status: "Orçamento",
        priority: "Média",
        technician: "Carlos",
        createdAt: addDays(-3),
        deadline: addDays(2),
        scheduledAt: addDays(2),
        labor: 140,
        discount: 10,
        parts: [],
        paid: 0,
        paymentStatus: "Pendente",
        warrantyDays: 90,
        partsReserved: false,
        history: [{ date: addDays(-3), text: "Diagnóstico concluído, aguardando aprovação." }],
      },
      {
        id: "os-3",
        number: 1053,
        customerId: "cus-3",
        equipmentId: "eq-3",
        title: "Manutenção preventiva",
        issue: "Impressora com ruído alto e cópias claras.",
        diagnosis: "Necessária limpeza e troca de toner.",
        solution: "Limpeza interna, toner novo e calibração.",
        status: "Pronto",
        priority: "Baixa",
        technician: "Willian",
        createdAt: addDays(-6),
        deadline: addDays(-1),
        scheduledAt: addDays(-2),
        labor: 120,
        discount: 0,
        parts: [{ partId: "part-1", qty: 1, price: 95 }],
        paid: 100,
        paymentStatus: "Parcial",
        warrantyDays: 90,
        partsReserved: true,
        history: [{ date: addDays(-6), text: "Preventiva aberta no balcão." }],
      },
    ],
    transactions: [
      {
        id: "tx-1",
        type: "income",
        description: "Entrada OS 1053 - Ana Ribeiro",
        category: "Serviços",
        amount: 100,
        dueDate: addDays(-4),
        paidDate: addDays(-4),
        status: "Pago",
        method: "Pix",
        orderId: "os-3",
      },
      {
        id: "tx-2",
        type: "expense",
        description: "Compra de toners e refis",
        category: "Estoque",
        amount: 530,
        dueDate: addDays(-2),
        paidDate: addDays(-2),
        status: "Pago",
        method: "Transferência",
        orderId: "",
      },
      {
        id: "tx-3",
        type: "expense",
        description: "Aluguel da oficina",
        category: "Fixo",
        amount: 1200,
        dueDate: addDays(5),
        paidDate: "",
        status: "Pendente",
        method: "Boleto",
        orderId: "",
      },
    ],
  };
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seeded = seedData();
    saveData(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(stored);
    return migrateData(parsed);
  } catch (error) {
    console.error(error);
    return seedData();
  }
}

function migrateData(data) {
  const fallback = seedData();
  return {
    settings: { ...fallback.settings, ...(data.settings || {}) },
    customers: data.customers || [],
    equipment: data.equipment || [],
    parts: data.parts || [],
    products: data.products || fallback.products || [],
    services: data.services || fallback.services || [],
    users: normalizeUsers(data.users || fallback.users || []),
    orders: (data.orders || []).map((order) => ({
      warrantyDays: 90,
      discount: 0,
      paid: 0,
      paymentStatus: "Pendente",
      partsReserved: false,
      storeTag: defaultOrderTag(order),
      storeLocation: "",
      services: legacyOrderServices(order),
      history: [],
      ...order,
    })),
    transactions: data.transactions || [],
  };
}

function normalizeUsers(users) {
  return users.map((user, index) => {
    const login = user.login || normalizeText(user.name || `usuario${index + 1}`).replace(/\s+/g, ".") || `usuario${index + 1}`;
    return {
      id: user.id || uid("usr"),
      name: user.name || `Usuário ${index + 1}`,
      login,
      email: user.email || `${login}@isprotec.local`,
      role: user.role || "Técnico",
      phone: user.phone || "",
      status: user.status || "Ativo",
      password: user.password || "1234",
    };
  });
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveData(data = state.data) {
  saveLocalData(data);
  scheduleCloudSave(data);
}

function cloudStateId() {
  return window.ISPROTEC_TENANT_ID || CLOUD_STATE_ID_DEFAULT;
}

function supabaseConfigured() {
  const url = String(window.ISPROTEC_SUPABASE_URL || "").trim();
  const anonKey = String(window.ISPROTEC_SUPABASE_ANON_KEY || "").trim();
  return Boolean(url && anonKey && !url.includes("SEU-PROJETO") && !anonKey.includes("SUA_CHAVE"));
}

function validSupabaseUrl() {
  const url = String(window.ISPROTEC_SUPABASE_URL || "").trim();
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
}

function loadSupabaseScript() {
  if (window.supabase) return Promise.resolve(true);
  if (cloud.scriptPromise) return cloud.scriptPromise;

  cloud.scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SUPABASE_CDN_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return cloud.scriptPromise;
}

async function getSupabaseClient() {
  if (!supabaseConfigured()) return null;
  if (!validSupabaseUrl()) {
    showToast("URL do Supabase incorreta. Ela precisa comecar com https:// e terminar com .supabase.co");
    return null;
  }
  const loaded = await loadSupabaseScript();
  if (!loaded || !window.supabase) {
    showToast("Supabase nao carregou. Verifique a internet.");
    return null;
  }
  if (!cloud.client) {
    cloud.client = window.supabase.createClient(window.ISPROTEC_SUPABASE_URL, window.ISPROTEC_SUPABASE_ANON_KEY);
  }
  cloud.enabled = true;
  return cloud.client;
}

function ensureCloudUserProfile(authUser, roleOverride = "") {
  if (!authUser?.email) return null;
  const email = normalizeText(authUser.email);
  let user = state.data.users.find((item) => normalizeText(item.email) === email);
  if (user) {
    user.status = user.status || "Ativo";
    return user;
  }

  user = {
    id: uid("usr"),
    name: authUser.user_metadata?.name || authUser.email.split("@")[0],
    login: authUser.email.split("@")[0],
    email: authUser.email,
    role: roleOverride || (state.data.users.length ? "Atendente" : "Administrador"),
    phone: "",
    status: "Ativo",
    password: "",
  };
  state.data.users.push(user);
  saveLocalData(state.data);
  return user;
}

async function loadCloudData(authUser) {
  const client = await getSupabaseClient();
  if (!client || !authUser) return false;

  cloud.loading = true;
  try {
    const { data: row, error } = await client
      .from("app_state")
      .select("data")
      .eq("id", cloudStateId())
      .maybeSingle();

    if (error) throw error;

    if (row?.data) {
      state.data = migrateData(row.data);
      ensureCloudUserProfile(authUser);
      saveLocalData(state.data);
    } else {
      ensureCloudUserProfile(authUser, "Administrador");
      const { error: insertError } = await client.from("app_state").upsert({
        id: cloudStateId(),
        data: state.data,
        updated_at: new Date().toISOString(),
        updated_by: authUser.id,
      });
      if (insertError) throw insertError;
    }

    cloud.user = authUser;
    cloud.ready = true;
    await saveCloudData(state.data);
    return true;
  } catch (error) {
    console.error(error);
    showToast("NÃ£o foi possÃ­vel carregar os dados online.");
    return false;
  } finally {
    cloud.loading = false;
  }
}

function scheduleCloudSave(data) {
  if (!cloud.enabled || !cloud.ready || cloud.loading || !cloud.user) return;
  window.clearTimeout(cloud.saveTimer);
  cloud.saveTimer = window.setTimeout(() => saveCloudData(data), 500);
}

async function saveCloudData(data = state.data) {
  const client = await getSupabaseClient();
  if (!client || !cloud.ready || cloud.loading || !cloud.user || cloud.saving) return;

  cloud.saving = true;
  try {
    const { error } = await client.from("app_state").upsert({
      id: cloudStateId(),
      data,
      updated_at: new Date().toISOString(),
      updated_by: cloud.user.id,
    });
    if (error) throw error;
  } catch (error) {
    console.error(error);
    showToast("Dados salvos localmente. Falha ao sincronizar online.");
  } finally {
    cloud.saving = false;
  }
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayISO() {
  return localDateISO();
}

function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localMonthISO(date = new Date()) {
  return localDateISO(date).slice(0, 7);
}

function monthOf(value) {
  return (value || "").slice(0, 7);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function companyLogoSrc() {
  return state.data.settings?.logo || DEFAULT_COMPANY_LOGO;
}

function updateCompanyLogos() {
  document.querySelectorAll(".company-logo").forEach((logo) => {
    logo.src = companyLogoSrc();
  });
}

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function customerName(id) {
  return state.data.customers.find((customer) => customer.id === id)?.name || "Cliente removido";
}

function normalizePhoneForWhatsApp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function openOrderWhatsApp(orderId) {
  const order = state.data.orders.find((item) => item.id === orderId);
  if (!order) return;
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const phone = normalizePhoneForWhatsApp(customer?.phone);
  if (!phone) {
    showToast("Este cliente não tem telefone cadastrado.");
    return;
  }

  const lines = [
    `Olá, ${customer?.name || "cliente"}!`,
    `Segue a OS ${order.number} da Isprotec.`,
    `Status: ${order.status}`,
    `Equipamento: ${equipmentLabel(order.equipmentId)}`,
    `Defeito: ${order.issue || order.title || "-"}`,
    `Prazo: ${formatDate(order.deadline)}`,
    `Total: ${formatCurrency(orderTotal(order))}`,
  ];

  const equipment = state.data.equipment.find((item) => item.id === order.equipmentId);
  const services = orderServices(order);
  const parts = order.parts || [];
  lines.push(
    "",
    "Resumo técnico completo:",
    "Cliente: " + (customer?.name || "-"),
    "Documento: " + (customer?.document || "-"),
    "Telefone: " + (customer?.phone || "-"),
    "E-mail: " + (customer?.email || "-"),
    "Endereço: " + (customer?.address || "-"),
    "Tag: " + orderStoreTag(order),
    "Prioridade: " + order.priority,
    "Técnico: " + (order.technician || "-"),
    "Entrada: " + formatDate(order.createdAt),
    "Agendada: " + (formatDate(order.scheduledAt) || "-"),
    "Local da OS: " + (order.storeLocation || "-"),
    "Equipamento: " + equipmentLabel(order.equipmentId),
    "Série: " + (equipment?.serial || "-"),
    "Tipo: " + (equipment?.type || "-"),
    "Local do equipamento: " + (equipment?.location || "-"),
    "Contador: " + Number(equipment?.counter || 0).toLocaleString("pt-BR"),
    "Serviços: " + (services.length ? services.map((item) => item.qty + "x " + item.name).join(" | ") : "Nenhum"),
    "Peças: " + (parts.length ? parts.map((item) => {
      const part = partById(item.partId);
      return item.qty + "x " + (part?.name || "Peça removida");
    }).join(" | ") : "Nenhuma"),
    "Mão de obra: " + formatCurrency(serviceTotal(order)),
    "Peças total: " + formatCurrency(parts.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0)),
    "Desconto: " + formatCurrency(order.discount),
    "Total geral: " + formatCurrency(orderTotal(order)),
    "Pago: " + formatCurrency(order.paid),
    "Saldo: " + formatCurrency(balanceOfOrder(order)),
    "Pagamento: " + paymentStatus(order),
    "Garantia: " + Number(order.warrantyDays || 0) + " dias"
  );

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
}

function equipmentLabel(id) {
  const equipment = state.data.equipment.find((item) => item.id === id);
  if (!equipment) return "Equipamento removido";
  return `${equipment.brand} ${equipment.model}`;
}

function partById(id) {
  return state.data.parts.find((part) => part.id === id);
}

function productById(id) {
  return state.data.products.find((product) => product.id === id);
}

function serviceById(id) {
  return state.data.services.find((service) => service.id === id);
}

function userById(id) {
  return state.data.users.find((user) => user.id === id);
}

function activeTechnicians() {
  return state.data.users.filter((user) => user.status === "Ativo" && ["Técnico", "Administrador"].includes(user.role));
}

function legacyOrderServices(order) {
  if (order?.services?.length) return order.services;
  if (Number(order?.labor || 0) <= 0) return [];
  return [
    {
      serviceId: "",
      name: "Mão de obra técnica",
      qty: 1,
      cost: 0,
      price: Number(order.labor || 0),
    },
  ];
}

function orderServices(order) {
  return legacyOrderServices(order).map((item) => {
    const service = serviceById(item.serviceId);
    return {
      serviceId: item.serviceId || "",
      name: item.name || service?.name || "Serviço técnico",
      qty: Number(item.qty || 1),
      cost: Number(item.cost ?? service?.cost ?? 0),
      price: Number(item.price ?? service?.price ?? 0),
    };
  });
}

function serviceTotal(order) {
  return orderServices(order).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
}

function serviceCost(order) {
  return orderServices(order).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.cost || 0), 0);
}

function orderTotal(order) {
  const partsTotal = (order.parts || []).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
  return Math.max(0, serviceTotal(order) + partsTotal - Number(order.discount || 0));
}

function orderCost(order) {
  const partsCost = (order.parts || []).reduce((sum, item) => {
    const part = partById(item.partId);
    return sum + Number(item.qty || 0) * Number(part?.cost || 0);
  }, 0);
  return partsCost + serviceCost(order);
}

function balanceOfOrder(order) {
  return Math.max(0, orderTotal(order) - Number(order.paid || 0));
}

function paymentStatus(order) {
  if (balanceOfOrder(order) <= 0 && orderTotal(order) > 0) return "Pago";
  if (Number(order.paid || 0) > 0) return "Parcial";
  return "Pendente";
}

function defaultOrderTag(order) {
  const number = order?.number || "";
  return number ? `TAG-${number}` : "";
}

function orderStoreTag(order) {
  return order.storeTag || defaultOrderTag(order);
}

function statusClass(status) {
  if (status === "Pronto" || status === "Entregue") return "ready";
  if (status === "Aguardando aprovação" || status === "Orçamento") return "alert";
  if (status === "Cancelada") return "closed";
  return "";
}

function priorityClass(priority) {
  const key = normalizeText(priority);
  if (key.includes("alta")) return "high";
  if (key.includes("media")) return "medium";
  return "low";
}

function getFilteredOrders() {
  const query = normalizeText(state.search);
  return state.data.orders
    .filter((order) => state.orderFilter === "Todos" || order.status === state.orderFilter)
    .filter((order) => {
      if (!query) return true;
      const haystack = [
        order.number,
        order.title,
        order.issue,
        order.status,
        order.technician,
        customerName(order.customerId),
        equipmentLabel(order.equipmentId),
      ].join(" ");
      return normalizeText(haystack).includes(query);
    })
    .sort((a, b) => Number(b.number) - Number(a.number));
}

function getDashboardMetrics() {
  const openOrders = state.data.orders.filter((order) => !["Entregue", "Cancelada"].includes(order.status));
  const readyOrders = state.data.orders.filter((order) => order.status === "Pronto");
  const overdueOrders = openOrders.filter((order) => order.deadline && order.deadline < todayISO());
  const receivable = state.data.orders.reduce((sum, order) => sum + balanceOfOrder(order), 0);
  const paidInMonth = state.data.transactions
    .filter((tx) => tx.type === "income" && tx.status === "Pago" && monthOf(tx.paidDate || tx.dueDate) === state.financeMonth)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return { openOrders, readyOrders, overdueOrders, receivable, paidInMonth };
}

function currentMonthTransactions(month = state.financeMonth) {
  return state.data.transactions.filter((tx) => monthOf(tx.paidDate || tx.dueDate) === month);
}

function financeTotals(month = state.financeMonth) {
  const txs = currentMonthTransactions(month);
  return txs.reduce(
    (acc, tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.type === "income") {
        acc.income += tx.status === "Pago" ? amount : 0;
        acc.receivable += tx.status !== "Pago" ? amount : 0;
      } else {
        acc.expense += tx.status === "Pago" ? amount : 0;
        acc.payable += tx.status !== "Pago" ? amount : 0;
      }
      return acc;
    },
    { income: 0, expense: 0, receivable: 0, payable: 0 }
  );
}

function setView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.getElementById(`${viewName}View`).classList.add("active");
  dom.title.textContent = viewTitle(viewName);
  render();
}

function viewTitle(view) {
  return {
    dashboard: "Painel",
    orders: "Ordens de Serviço",
    schedule: "Agenda Técnica",
    customers: "Clientes e Equipamentos",
    inventory: "Estoque",
    products: "Produtos",
    finance: "Fluxo de Caixa",
    reports: "Relatórios",
    settings: "Configurações",
  }[view];
}

function render() {
  if (!currentUser()) return;
  const renderers = {
    dashboard: renderDashboard,
    orders: renderOrders,
    schedule: renderSchedule,
    customers: renderCustomers,
    inventory: renderInventory,
    products: renderProducts,
    finance: renderFinance,
    reports: renderReports,
    settings: renderSettings,
  };
  try {
    renderers[state.activeView]();
  } catch (error) {
    console.error(error);
    const view = document.getElementById(`${state.activeView}View`);
    if (view) {
      view.innerHTML = `
        <div class="panel">
          <div class="empty-state">
            Nao foi possivel carregar esta tela. Atualize a pagina ou clique em Sair e entre novamente.
          </div>
        </div>
      `;
    }
    showToast("Erro ao carregar a tela atual.");
  }
}

function renderDashboard() {
  const metrics = getDashboardMetrics();
  const lowStock = state.data.parts.filter((part) => Number(part.stock || 0) <= Number(part.minStock || 0));
  const pendingApprovals = state.data.orders.filter((order) => order.status === "Aguardando aprovação" || order.status === "Orçamento");
  const monthTotals = financeTotals();

  document.getElementById("dashboardView").innerHTML = `
    <div class="page-grid">
      <div class="grid-4">
        <article class="metric-card accent-cyan">
          <small>OS abertas</small>
          <strong>${metrics.openOrders.length}</strong>
          <em>${metrics.overdueOrders.length} atrasada(s)</em>
        </article>
        <article class="metric-card accent-blue">
          <small>Prontas para entrega</small>
          <strong>${metrics.readyOrders.length}</strong>
          <em>${pendingApprovals.length} em orçamento</em>
        </article>
        <article class="metric-card accent-magenta">
          <small>A receber</small>
          <strong>${formatCurrency(metrics.receivable)}</strong>
          <em>Pendente, fora do resultado</em>
        </article>
        <article class="metric-card accent-yellow">
          <small>Resultado do mês</small>
          <strong>${formatCurrency(monthTotals.income - monthTotals.expense)}</strong>
          <em>${formatCurrency(monthTotals.income)} recebido</em>
        </article>
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-header">
            <h3>Fila técnica</h3>
            <button class="btn secondary" data-action="view-orders">Ver OS</button>
          </div>
          ${renderTechnicalCharts(metrics)}
        </section>

        <section class="panel">
          <div class="panel-header">
            <h3>Alertas operacionais</h3>
            <button class="btn secondary" data-action="new-cash">Lançar conta</button>
          </div>
          <div class="alert-list">
            ${renderDashboardAlerts(metrics, lowStock, pendingApprovals)}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderTechnicalCharts(metrics) {
  const queueStatuses = ["Entrada", "Diagnóstico", "Orçamento", "Aguardando aprovação", "Em reparo", "Pronto"];
  const statusColors = ["#18b9c3", "#256edb", "#f6c311", "#d98619", "#e1008e", "#15936d"];
  const activeOrders = metrics.openOrders;
  const statusData = queueStatuses.map((status, index) => ({
    label: status,
    count: activeOrders.filter((order) => order.status === status).length,
    color: statusColors[index],
  }));
  const priorityData = ["Alta", "Média", "Baixa"].map((priority) => ({
    label: priority,
    count: activeOrders.filter((order) => order.priority === priority).length,
    color: priority === "Alta" ? "#ca3f3f" : priority === "Média" ? "#d98619" : "#15936d",
  }));
  const technicianData = Object.entries(
    activeOrders.reduce((acc, order) => {
      const tech = order.technician || "Sem técnico";
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  const criticalOrders = activeOrders
    .slice()
    .sort((a, b) => criticalScore(b) - criticalScore(a))
    .slice(0, 5);

  return `
    <div class="tech-charts">
      <article class="chart-card status-overview">
        <div>
          <p class="chart-label">Distribuição por etapa</p>
          <strong>${activeOrders.length} OS ativas</strong>
        </div>
        ${renderDonutChart(statusData, activeOrders.length)}
      </article>
      <article class="chart-card">
        <p class="chart-label">Prioridade</p>
        ${renderMiniBars(priorityData)}
      </article>
      <article class="chart-card">
        <p class="chart-label">Carga por técnico</p>
        ${technicianData.length ? renderMiniBars(technicianData.map((item, index) => ({ ...item, color: ["#256edb", "#18b9c3", "#e1008e", "#f6c311"][index % 4] }))) : `<div class="empty-state small">Sem OS ativas</div>`}
      </article>
      <article class="chart-card">
        <p class="chart-label">OS críticas</p>
        ${criticalOrders.length ? renderCriticalOrders(criticalOrders) : `<div class="empty-state small">Sem OS críticas</div>`}
      </article>
    </div>
  `;
}

function renderDonutChart(data, total) {
  let cursor = 0;
  const segments = total
    ? data
        .map((item) => {
          const start = cursor;
          const size = (item.count / total) * 100;
          cursor += size;
          return `${item.color} ${start}% ${cursor}%`;
        })
        .join(", ")
    : "#e4ebf1 0% 100%";

  return `
    <div class="donut-layout">
      <div class="donut-chart" style="--donut:${segments}">
        <div class="donut-center">
          <strong>${total}</strong>
          <span>ativas</span>
        </div>
      </div>
      <div class="chart-legend">
        ${data
          .map(
            (item) => `
              <div class="legend-item">
                <span class="legend-dot" style="background:${item.color}"></span>
                <span>${escapeHtml(item.label)}</span>
                <strong>${item.count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderMiniBars(data) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return `
    <div class="mini-bars">
      ${data
        .map(
          (item) => `
            <div class="mini-bar-row">
              <div class="mini-bar-top">
                <span>${escapeHtml(item.label)}</span>
                <strong>${item.count}</strong>
              </div>
              <div class="mini-bar-track">
                <div class="mini-bar-fill" style="width:${(item.count / max) * 100}%; background:${item.color}"></div>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderCriticalOrders(orders) {
  return `
    <div class="critical-list">
      ${orders
        .map(
          (order) => `
            <button class="critical-item" type="button" data-action="edit-order" data-id="${order.id}">
              <span class="critical-rank">${order.priority === "Alta" ? "!" : order.status === "Pronto" ? "✓" : "•"}</span>
              <span>
                <strong>OS ${order.number}</strong>
                <em>${escapeHtml(customerName(order.customerId))}</em>
              </span>
              <small>${formatDate(order.deadline)}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function criticalScore(order) {
  let score = 0;
  if (order.deadline && order.deadline < todayISO()) score += 100;
  if (order.priority === "Alta") score += 60;
  if (order.status === "Pronto") score += 35;
  if (order.status === "Aguardando aprovação" || order.status === "Orçamento") score += 20;
  return score;
}

function renderDashboardAlerts(metrics, lowStock, pendingApprovals) {
  const alerts = [];
  metrics.overdueOrders.forEach((order) => {
    alerts.push({
      color: "red",
      title: `OS ${order.number} atrasada`,
      text: `${customerName(order.customerId)} - prazo ${formatDate(order.deadline)}`,
      action: `<button class="mini-btn primary" data-action="edit-order" data-id="${order.id}">Abrir</button>`,
    });
  });
  lowStock.forEach((part) => {
    alerts.push({
      color: "red",
      title: `Estoque baixo: ${part.name}`,
      text: `${part.stock} unidade(s), mínimo ${part.minStock}`,
      action: `<button class="mini-btn" data-action="edit-part" data-id="${part.id}">Repor</button>`,
    });
  });
  pendingApprovals.slice(0, 3).forEach((order) => {
    alerts.push({
      color: "green",
      title: `Aprovação pendente OS ${order.number}`,
      text: `${customerName(order.customerId)} - ${formatCurrency(orderTotal(order))}`,
      action: `<button class="mini-btn primary" data-action="edit-order" data-id="${order.id}">Abrir</button>`,
    });
  });

  if (!alerts.length) {
    return `<div class="empty-state">Sem alertas críticos no momento</div>`;
  }

  return alerts
    .map(
      (alert) => `
        <div class="alert-item">
          <span class="alert-marker ${alert.color}"></span>
          <div>
            <strong>${escapeHtml(alert.title)}</strong>
            <div class="muted">${escapeHtml(alert.text)}</div>
          </div>
          ${alert.action}
        </div>
      `
    )
    .join("");
}

function renderOrderCard(order) {
  return `
    <article class="order-card">
      <strong>OS ${order.number} - ${escapeHtml(order.title)}</strong>
      <small>${escapeHtml(customerName(order.customerId))}</small>
      <small><strong>${escapeHtml(orderStoreTag(order))}</strong> ${escapeHtml(order.storeLocation || "")}</small>
      <div class="split-actions">
        <span class="priority-pill ${priorityClass(order.priority)}">${escapeHtml(order.priority)}</span>
        <span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <div class="actions-row">
        <button class="mini-btn primary" data-action="edit-order" data-id="${order.id}">Abrir</button>
        <button class="mini-btn" data-action="print-order" data-id="${order.id}">Imprimir</button>
        <button class="mini-btn success" data-action="whatsapp-order" data-id="${order.id}">WhatsApp</button>
        <button class="mini-btn" data-action="print-tag" data-id="${order.id}">Etiqueta</button>
      </div>
    </article>
  `;
}

function renderOrders() {
  const orders = getFilteredOrders();
  pruneSelectedOrders();
  const selectedCount = state.selectedOrderIds.size;
  document.getElementById("ordersView").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <button class="btn primary" data-action="new-order"><span>+</span>Nova OS</button>
        <button class="btn secondary" data-action="import-orders">Importar OS JSON</button>
        <button class="btn danger" data-action="delete-selected-orders" ${selectedCount ? "" : "disabled"}>Excluir selecionadas (${selectedCount})</button>
        <label class="field">
          <label>Status</label>
          <select id="orderStatusFilter">
            ${["Todos", ...orderStatuses].map((status) => `<option ${state.orderFilter === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
      </div>
      ${orders.length ? renderOrdersTable(orders) : `<div class="empty-state">Nenhuma ordem de serviço encontrada</div>`}
    </section>
  `;
}

function renderOrdersTable(orders) {
  const allVisibleSelected = orders.length > 0 && orders.every((order) => state.selectedOrderIds.has(order.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllOrders" ${allVisibleSelected ? "checked" : ""} title="Selecionar todas as OS visíveis" /></th>
            <th>OS</th>
            <th>Tag</th>
            <th>Cliente</th>
            <th>Equipamento</th>
            <th>Status</th>
            <th>Prazo</th>
            <th>Total</th>
            <th>Pagamento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (order) => `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-order-select value="${order.id}" ${state.selectedOrderIds.has(order.id) ? "checked" : ""} title="Selecionar OS ${order.number}" /></td>
                  <td class="nowrap"><strong>${order.number}</strong><br><span class="muted">${escapeHtml(order.priority)}</span></td>
                  <td class="nowrap"><strong>${escapeHtml(orderStoreTag(order))}</strong><br><span class="muted">${escapeHtml(order.storeLocation || "Sem local")}</span></td>
                  <td>${escapeHtml(customerName(order.customerId))}<br><span class="muted">${escapeHtml(order.title)}</span></td>
                  <td>${escapeHtml(equipmentLabel(order.equipmentId))}</td>
                  <td><span class="status-pill ${statusClass(order.status)}">${escapeHtml(order.status)}</span></td>
                  <td class="nowrap">${formatDate(order.deadline)}</td>
                  <td class="nowrap">${formatCurrency(orderTotal(order))}</td>
                  <td>${escapeHtml(paymentStatus(order))}<br><span class="muted">${formatCurrency(balanceOfOrder(order))} restante</span></td>
                  <td>
                    <div class="actions-row">
                      <button class="mini-btn primary" data-action="edit-order" data-id="${order.id}">Editar</button>
                      <button class="mini-btn" data-action="print-order" data-id="${order.id}">Imprimir</button>
                      <button class="mini-btn" data-action="print-receipt" data-id="${order.id}" ${Number(order.paid || 0) <= 0 ? "disabled" : ""}>Recibo</button>
                      <button class="mini-btn" data-action="print-tag" data-id="${order.id}">Etiqueta</button>
                      <button class="mini-btn success" data-action="whatsapp-order" data-id="${order.id}">WhatsApp</button>
                      <button class="mini-btn success" data-action="receive-order" data-id="${order.id}" ${balanceOfOrder(order) <= 0 ? "disabled" : ""}>Receber</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function pruneSelectedOrders() {
  const validIds = new Set(state.data.orders.map((order) => order.id));
  [...state.selectedOrderIds].forEach((id) => {
    if (!validIds.has(id)) state.selectedOrderIds.delete(id);
  });
}

function toggleVisibleOrdersSelection(checked) {
  getFilteredOrders().forEach((order) => {
    if (checked) state.selectedOrderIds.add(order.id);
    else state.selectedOrderIds.delete(order.id);
  });
  renderOrders();
}

function deleteSelectedOrders() {
  pruneSelectedOrders();
  const ids = [...state.selectedOrderIds];
  if (!ids.length) {
    showToast("Selecione pelo menos uma OS.");
    return;
  }

  const message = `Excluir ${ids.length} OS selecionada(s)? Os lançamentos financeiros vinculados a elas também serão removidos.`;
  if (!window.confirm(message)) return;

  const idsSet = new Set(ids);
  state.data.orders.forEach((order) => {
    if (idsSet.has(order.id) && order.partsReserved) restoreParts(order.parts || []);
  });
  state.data.orders = state.data.orders.filter((order) => !idsSet.has(order.id));
  state.data.transactions = state.data.transactions.filter((tx) => !idsSet.has(tx.orderId));
  state.selectedOrderIds.clear();
  saveData();
  render();
  showToast(`${ids.length} OS excluida(s).`);
}

function pruneSelectedCustomers() {
  pruneSelectionSet(state.selectedCustomerIds, state.data.customers);
}

function pruneSelectedEquipment() {
  pruneSelectionSet(state.selectedEquipmentIds, state.data.equipment);
}

function pruneSelectedParts() {
  pruneSelectionSet(state.selectedPartIds, state.data.parts);
}

function pruneSelectedProducts() {
  pruneSelectionSet(state.selectedProductIds, state.data.products);
}

function pruneSelectedTransactions() {
  pruneSelectionSet(state.selectedTransactionIds, state.data.transactions);
}

function pruneSelectionSet(selection, records) {
  const validIds = new Set(records.map((record) => record.id));
  [...selection].forEach((id) => {
    if (!validIds.has(id)) selection.delete(id);
  });
}

function toggleSelectionSet(selection, records, checked) {
  records.forEach((record) => {
    if (checked) selection.add(record.id);
    else selection.delete(record.id);
  });
}

function deleteSelectedCustomers() {
  pruneSelectedCustomers();
  const ids = [...state.selectedCustomerIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um cliente.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} cliente(s) selecionado(s)? Clientes com OS ou equipamentos vinculados serão preservados.`)) return;

  const linkedCustomerIds = new Set([
    ...state.data.orders.map((order) => order.customerId),
    ...state.data.equipment.map((equipment) => equipment.customerId),
  ]);
  const removableIds = ids.filter((id) => !linkedCustomerIds.has(id));
  state.data.customers = state.data.customers.filter((customer) => !removableIds.includes(customer.id));
  state.selectedCustomerIds.clear();
  saveData();
  render();
  showToast(`${removableIds.length} cliente(s) excluido(s). ${ids.length - removableIds.length} preservado(s) por vínculo.`);
}

function deleteSelectedEquipment() {
  pruneSelectedEquipment();
  const ids = [...state.selectedEquipmentIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um equipamento.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} equipamento(s) selecionado(s)? Equipamentos com OS vinculada serão preservados.`)) return;

  const linkedEquipmentIds = new Set(state.data.orders.map((order) => order.equipmentId));
  const removableIds = ids.filter((id) => !linkedEquipmentIds.has(id));
  state.data.equipment = state.data.equipment.filter((equipment) => !removableIds.includes(equipment.id));
  state.selectedEquipmentIds.clear();
  saveData();
  render();
  showToast(`${removableIds.length} equipamento(s) excluido(s). ${ids.length - removableIds.length} preservado(s) por vínculo.`);
}

function deleteSelectedParts() {
  pruneSelectedParts();
  const ids = [...state.selectedPartIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um item.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} item(ns) selecionado(s)? Itens usados em OS serão preservados.`)) return;

  const linkedPartIds = new Set(state.data.orders.flatMap((order) => (order.parts || []).map((part) => part.partId)));
  const removableIds = ids.filter((id) => !linkedPartIds.has(id));
  state.data.parts = state.data.parts.filter((part) => !removableIds.includes(part.id));
  state.selectedPartIds.clear();
  saveData();
  render();
  showToast(`${removableIds.length} item(ns) excluido(s). ${ids.length - removableIds.length} preservado(s) por vínculo.`);
}

function deleteSelectedProducts() {
  pruneSelectedProducts();
  const ids = [...state.selectedProductIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um produto.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} produto(s) selecionado(s)?`)) return;

  state.data.products = state.data.products.filter((product) => !state.selectedProductIds.has(product.id));
  state.selectedProductIds.clear();
  saveData();
  renderProducts();
  showToast(`${ids.length} produto(s) excluido(s).`);
}

function deleteSelectedTransactions() {
  pruneSelectedTransactions();
  const ids = [...state.selectedTransactionIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um lançamento.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} lançamento(s) selecionado(s)?`)) return;

  const idsSet = new Set(ids);
  state.data.transactions
    .filter((tx) => idsSet.has(tx.id) && tx.type === "income" && tx.orderId)
    .forEach((tx) => {
      const order = state.data.orders.find((item) => item.id === tx.orderId);
      if (order) {
        order.paid = Math.max(0, Number(order.paid || 0) - Number(tx.amount || 0));
        order.paymentStatus = paymentStatus(order);
        order.history = [...(order.history || []), { date: todayISO(), text: `Lançamento financeiro removido: ${formatCurrency(tx.amount)}.` }];
      }
    });
  state.data.transactions = state.data.transactions.filter((tx) => !idsSet.has(tx.id));
  state.selectedTransactionIds.clear();
  saveData();
  render();
  showToast(`${ids.length} lançamento(s) excluido(s).`);
}

function pruneSelectedUsers() {
  pruneSelectionSet(state.selectedUserIds, state.data.users);
}

function deleteSelectedUsers() {
  pruneSelectedUsers();
  const ids = [...state.selectedUserIds];
  if (!ids.length) {
    showToast("Selecione pelo menos um usuário.");
    return;
  }
  if (!window.confirm(`Excluir ${ids.length} usuário(s) selecionado(s)?`)) return;

  const selected = new Set(ids);
  const adminsOutsideSelection = state.data.users.filter((user) => user.role === "Administrador" && !selected.has(user.id));
  const selectedAdmins = state.data.users.filter((user) => user.role === "Administrador" && selected.has(user.id));
  const protectedAdminId = adminsOutsideSelection.length ? "" : selectedAdmins[0]?.id || "";
  const removableIds = ids.filter((id) => id !== protectedAdminId);

  state.data.users = state.data.users.filter((user) => !removableIds.includes(user.id));
  state.selectedUserIds.clear();
  saveData();
  if (renderAuthState()) render();
  showToast(`${removableIds.length} usuário(s) excluido(s). ${protectedAdminId ? "Um administrador foi preservado." : ""}`);
}

function renderSchedule() {
  pruneSelectedOrders();
  const scheduled = state.data.orders
    .filter((order) => order.scheduledAt && !["Entregue", "Cancelada"].includes(order.status))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const allScheduledSelected = scheduled.length > 0 && scheduled.every((order) => state.selectedOrderIds.has(order.id));

  document.getElementById("scheduleView").innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-header">
          <h3>Agenda de atendimentos</h3>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-orders" ${state.selectedOrderIds.size ? "" : "disabled"}>Excluir selecionadas (${state.selectedOrderIds.size})</button>
            <button class="btn primary" data-action="new-order"><span>+</span>Nova OS</button>
          </div>
        </div>
        ${
          scheduled.length
            ? `<label class="select-line"><input type="checkbox" id="selectAllScheduledOrders" ${allScheduledSelected ? "checked" : ""} /> Selecionar todas as OS agendadas</label>`
            : ""
        }
        <div class="timeline">
          ${
            scheduled.length
              ? scheduled
                  .map(
                    (order) => `
                      <div class="timeline-item">
                        <span class="check-cell"><input type="checkbox" data-order-select value="${order.id}" ${state.selectedOrderIds.has(order.id) ? "checked" : ""} title="Selecionar OS ${order.number}" /></span>
                        <strong>${formatDate(order.scheduledAt)}</strong>
                        <span>
                          OS ${order.number} - ${escapeHtml(customerName(order.customerId))}
                          <br><span class="muted">${escapeHtml(order.technician || "Sem técnico")} · ${escapeHtml(order.title)}</span>
                        </span>
                        <button class="mini-btn primary" data-action="edit-order" data-id="${order.id}">Abrir</button>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state">Nenhum atendimento agendado</div>`
          }
        </div>
      </section>

      <section class="panel">
        <h3>Carga por técnico</h3>
        <div class="chart">
          ${renderTechnicianLoad()}
        </div>
      </section>
    </div>
  `;
}

function renderTechnicianLoad() {
  const activeOrders = state.data.orders.filter((order) => !["Entregue", "Cancelada"].includes(order.status));
  const grouped = activeOrders.reduce((acc, order) => {
    const tech = order.technician || "Sem técnico";
    acc[tech] = (acc[tech] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(grouped));

  if (!Object.keys(grouped).length) return `<div class="empty-state">Sem OS ativas</div>`;

  return Object.entries(grouped)
    .map(
      ([tech, count]) => `
        <div class="bar-row">
          <strong>${escapeHtml(tech)}</strong>
          <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
          <span>${count} OS</span>
        </div>
      `
    )
    .join("");
}

function renderCustomers() {
  pruneSelectedCustomers();
  pruneSelectedEquipment();
  const customerCount = state.selectedCustomerIds.size;
  const equipmentCount = state.selectedEquipmentIds.size;
  document.getElementById("customersView").innerHTML = `
    <div class="grid-2">
      <section class="panel">
        <div class="panel-header">
          <h3>Clientes</h3>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-customers" ${customerCount ? "" : "disabled"}>Excluir selecionados (${customerCount})</button>
            <button class="btn primary" data-action="new-customer"><span>+</span>Novo cliente</button>
          </div>
        </div>
        ${renderCustomersTable()}
      </section>
      <section class="panel">
        <div class="panel-header">
          <h3>Equipamentos</h3>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-equipment" ${equipmentCount ? "" : "disabled"}>Excluir selecionados (${equipmentCount})</button>
            <button class="btn primary" data-action="new-equipment"><span>+</span>Novo equipamento</button>
          </div>
        </div>
        ${renderEquipmentTable()}
      </section>
    </div>
  `;
}

function renderCustomersTable() {
  if (!state.data.customers.length) return `<div class="empty-state">Nenhum cliente cadastrado</div>`;
  const allSelected = state.data.customers.length > 0 && state.data.customers.every((customer) => state.selectedCustomerIds.has(customer.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllCustomers" ${allSelected ? "checked" : ""} title="Selecionar todos os clientes" /></th>
            <th>Cliente</th>
            <th>Contato</th>
            <th>Documento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.customers
            .map(
              (customer) => `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-customer-select value="${customer.id}" ${state.selectedCustomerIds.has(customer.id) ? "checked" : ""} title="Selecionar cliente" /></td>
                  <td><strong>${escapeHtml(customer.name)}</strong><br><span class="muted">${escapeHtml(customer.type)}</span></td>
                  <td>${escapeHtml(customer.phone)}<br><span class="muted">${escapeHtml(customer.email)}</span></td>
                  <td>${escapeHtml(customer.document || "-")}</td>
                  <td><button class="mini-btn primary" data-action="edit-customer" data-id="${customer.id}">Editar</button></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEquipmentTable() {
  if (!state.data.equipment.length) return `<div class="empty-state">Nenhum equipamento cadastrado</div>`;
  const allSelected = state.data.equipment.length > 0 && state.data.equipment.every((equipment) => state.selectedEquipmentIds.has(equipment.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllEquipment" ${allSelected ? "checked" : ""} title="Selecionar todos os equipamentos" /></th>
            <th>Equipamento</th>
            <th>Cliente</th>
            <th>Série</th>
            <th>Contador</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.equipment
            .map(
              (equipment) => `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-equipment-select value="${equipment.id}" ${state.selectedEquipmentIds.has(equipment.id) ? "checked" : ""} title="Selecionar equipamento" /></td>
                  <td><strong>${escapeHtml(equipment.brand)} ${escapeHtml(equipment.model)}</strong><br><span class="muted">${escapeHtml(equipment.type || "-")}</span></td>
                  <td>${escapeHtml(customerName(equipment.customerId))}</td>
                  <td>${escapeHtml(equipment.serial || "-")}</td>
                  <td>${Number(equipment.counter || 0).toLocaleString("pt-BR")}</td>
                  <td><button class="mini-btn primary" data-action="edit-equipment" data-id="${equipment.id}">Editar</button></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderInventory() {
  pruneSelectedParts();
  const partCount = state.selectedPartIds.size;
  const stockValue = state.data.parts.reduce((sum, part) => sum + Number(part.stock || 0) * Number(part.cost || 0), 0);
  const lowStock = state.data.parts.filter((part) => Number(part.stock || 0) <= Number(part.minStock || 0)).length;

  document.getElementById("inventoryView").innerHTML = `
    <div class="page-grid">
      <div class="grid-3">
        <article class="metric-card accent-blue">
          <small>Itens cadastrados</small>
          <strong>${state.data.parts.length}</strong>
          <em>Peças, toners e acessórios</em>
        </article>
        <article class="metric-card accent-yellow">
          <small>Valor em estoque</small>
          <strong>${formatCurrency(stockValue)}</strong>
          <em>Baseado no custo de compra</em>
        </article>
        <article class="metric-card accent-magenta">
          <small>Reposição necessária</small>
          <strong>${lowStock}</strong>
          <em>Itens no mínimo ou abaixo</em>
        </article>
      </div>

      <section class="panel">
        <div class="panel-header">
          <h3>Controle de estoque</h3>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-parts" ${partCount ? "" : "disabled"}>Excluir selecionados (${partCount})</button>
            <button class="btn primary" data-action="new-part"><span>+</span>Novo item</button>
          </div>
        </div>
        ${renderPartsTable()}
      </section>
    </div>
  `;
}

function renderPartsTable() {
  if (!state.data.parts.length) return `<div class="empty-state">Nenhum item cadastrado no estoque</div>`;
  const allSelected = state.data.parts.length > 0 && state.data.parts.every((part) => state.selectedPartIds.has(part.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllParts" ${allSelected ? "checked" : ""} title="Selecionar todos os itens" /></th>
            <th>SKU</th>
            <th>Item</th>
            <th>Categoria</th>
            <th>Estoque</th>
            <th>Custo</th>
            <th>Venda</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.parts
            .map((part) => {
              const low = Number(part.stock || 0) <= Number(part.minStock || 0);
              return `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-stock-part-select value="${part.id}" ${state.selectedPartIds.has(part.id) ? "checked" : ""} title="Selecionar item" /></td>
                  <td>${escapeHtml(part.sku)}</td>
                  <td><strong>${escapeHtml(part.name)}</strong><br><span class="muted">${escapeHtml(part.supplier || "-")}</span></td>
                  <td>${escapeHtml(part.category || "-")}</td>
                  <td><span class="status-pill ${low ? "alert" : "ready"}">${Number(part.stock || 0)} / min. ${Number(part.minStock || 0)}</span></td>
                  <td>${formatCurrency(part.cost)}</td>
                  <td>${formatCurrency(part.price)}</td>
                  <td>
                    <div class="actions-row">
                      <button class="mini-btn primary" data-action="edit-part" data-id="${part.id}">Editar</button>
                      <button class="mini-btn success" data-action="stock-in" data-id="${part.id}">Entrada</button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderProducts() {
  pruneSelectedProducts();
  const productCount = state.selectedProductIds.size;
  const activeProducts = state.data.products.filter((product) => product.active !== false).length;
  const stockValue = state.data.products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.cost || 0), 0);
  const lowStock = state.data.products.filter((product) => Number(product.stock || 0) <= Number(product.minStock || 0)).length;

  document.getElementById("productsView").innerHTML = `
    <div class="page-grid">
      <div class="grid-3">
        <article class="metric-card accent-blue">
          <small>Produtos cadastrados</small>
          <strong>${state.data.products.length}</strong>
          <em>Itens da vitrine e venda</em>
        </article>
        <article class="metric-card accent-yellow">
          <small>Ativos no site</small>
          <strong>${activeProducts}</strong>
          <em>Disponiveis para solicitacao</em>
        </article>
        <article class="metric-card accent-magenta">
          <small>Reposicao necessaria</small>
          <strong>${lowStock}</strong>
          <em>Produtos no minimo ou abaixo</em>
        </article>
      </div>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Produtos da loja</h3>
            <p>Cadastre produtos, fotos, valores e disponibilidade para vender pelo site.</p>
          </div>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-products" ${productCount ? "" : "disabled"}>Excluir selecionados (${productCount})</button>
            <button class="btn primary" data-action="new-product"><span>+</span>Novo produto</button>
          </div>
        </div>
        ${renderProductsTable()}
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Resumo da vitrine</h3>
            <p>Valor em estoque: <strong>${formatCurrency(stockValue)}</strong></p>
          </div>
        </div>
        <div class="empty-state">Depois desta tela, a vitrine publica pode ser conectada para ler estes produtos automaticamente.</div>
      </section>
    </div>
  `;
}

function renderProductsTable() {
  if (!state.data.products.length) return `<div class="empty-state">Nenhum produto cadastrado</div>`;
  const allSelected = state.data.products.length > 0 && state.data.products.every((product) => state.selectedProductIds.has(product.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllProducts" ${allSelected ? "checked" : ""} title="Selecionar todos os produtos" /></th>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Estoque</th>
            <th>Custo</th>
            <th>Venda</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.products
            .map((product) => {
              const low = Number(product.stock || 0) <= Number(product.minStock || 0);
              const image = product.image || "assets/isprotec-products.png";
              return `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-product-select value="${product.id}" ${state.selectedProductIds.has(product.id) ? "checked" : ""} title="Selecionar produto" /></td>
                  <td>
                    <div class="product-cell">
                      <img class="product-thumb" src="${escapeHtml(image)}" alt="" />
                      <div>
                        <strong>${escapeHtml(product.name)}</strong><br>
                        <span class="muted">${escapeHtml(product.sku || "-")}</span>
                      </div>
                    </div>
                  </td>
                  <td>${escapeHtml(product.category || "-")}</td>
                  <td><span class="status-pill ${low ? "alert" : "ready"}">${Number(product.stock || 0)} / min. ${Number(product.minStock || 0)}</span></td>
                  <td>${formatCurrency(product.cost)}</td>
                  <td>${formatCurrency(product.price)}</td>
                  <td><span class="status-pill ${product.active === false ? "closed" : "ready"}">${product.active === false ? "Inativo" : "Ativo"}</span></td>
                  <td><button class="mini-btn primary" data-action="edit-product" data-id="${product.id}">Editar</button></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderFinance() {
  pruneSelectedTransactions();
  const transactionCount = state.selectedTransactionIds.size;
  const totals = financeTotals();
  const txs = currentMonthTransactions().sort((a, b) => (b.paidDate || b.dueDate).localeCompare(a.paidDate || a.dueDate));

  document.getElementById("financeView").innerHTML = `
    <div class="page-grid">
      <div class="toolbar">
        <label class="field">
          <label>Mês</label>
          <input type="month" id="financeMonth" value="${state.financeMonth}" />
        </label>
        <button class="btn primary" data-action="new-cash"><span>+</span>Novo lançamento</button>
        <button class="btn danger" data-action="delete-selected-transactions" ${transactionCount ? "" : "disabled"}>Excluir selecionados (${transactionCount})</button>
      </div>

      <div class="grid-4">
        <article class="metric-card accent-cyan">
          <small>Recebido</small>
          <strong>${formatCurrency(totals.income)}</strong>
          <em>Entradas pagas no mês</em>
        </article>
        <article class="metric-card accent-magenta">
          <small>Pago</small>
          <strong>${formatCurrency(totals.expense)}</strong>
          <em>Saídas pagas no mês</em>
        </article>
        <article class="metric-card accent-blue">
          <small>Saldo</small>
          <strong>${formatCurrency(totals.income - totals.expense)}</strong>
          <em>Resultado realizado</em>
        </article>
        <article class="metric-card accent-yellow">
          <small>Pendências</small>
          <strong>${formatCurrency(totals.receivable - totals.payable)}</strong>
          <em>A receber menos a pagar</em>
        </article>
      </div>

      <section class="panel">
        <div class="panel-header">
          <h3>Lançamentos</h3>
          <button class="btn secondary" data-action="export-data">Exportar backup</button>
        </div>
        ${renderTransactionsTable(txs)}
      </section>
    </div>
  `;
}

function renderTransactionsTable(txs) {
  if (!txs.length) return `<div class="empty-state">Nenhum lançamento neste mês</div>`;
  const allVisibleSelected = txs.length > 0 && txs.every((tx) => state.selectedTransactionIds.has(tx.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllTransactions" ${allVisibleSelected ? "checked" : ""} title="Selecionar todos os lançamentos visíveis" /></th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${txs
            .map(
              (tx) => `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-transaction-select value="${tx.id}" ${state.selectedTransactionIds.has(tx.id) ? "checked" : ""} title="Selecionar lançamento" /></td>
                  <td><span class="money-pill ${tx.type}">${tx.type === "income" ? "Entrada" : "Saída"}</span></td>
                  <td><strong>${escapeHtml(tx.description)}</strong><br><span class="muted">${escapeHtml(tx.method || "-")}</span></td>
                  <td>${escapeHtml(tx.category || "-")}</td>
                  <td>${formatDate(tx.dueDate)}</td>
                  <td><span class="status-pill ${tx.status === "Pago" ? "ready" : "alert"}">${escapeHtml(tx.status)}</span></td>
                  <td class="nowrap">${formatCurrency(tx.amount)}</td>
                  <td>
                    <div class="actions-row">
                      <button class="mini-btn primary" data-action="edit-cash" data-id="${tx.id}">Editar</button>
                      <button class="mini-btn success" data-action="pay-cash" data-id="${tx.id}" ${tx.status === "Pago" ? "disabled" : ""}>Baixar</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReports() {
  const totals = financeTotals(state.reportMonth);
  const ordersInMonth = state.data.orders.filter((order) => monthOf(order.createdAt) === state.reportMonth);
  const delivered = ordersInMonth.filter((order) => order.status === "Entregue");
  const paidIncomeTransactions = paidTransactions("income", state.reportMonth);
  const paidOrderIncome = paidIncomeTransactions.filter((tx) => tx.orderId);
  const paidOrderIds = new Set(paidOrderIncome.map((tx) => tx.orderId));
  const paidOrderRevenue = paidOrderIncome.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const averagePaidTicket = paidOrderRevenue / Math.max(1, paidOrderIds.size);
  const margin = totals.income ? ((totals.income - totals.expense) / totals.income) * 100 : 0;

  document.getElementById("reportsView").innerHTML = `
    <div class="page-grid">
      <div class="toolbar">
        <label class="field">
          <label>Mês analisado</label>
          <input type="month" id="reportMonth" value="${state.reportMonth}" />
        </label>
        <button class="btn secondary" data-action="print-report">Imprimir relatório</button>
      </div>

      <div class="grid-4">
        <article class="metric-card accent-cyan">
          <small>OS abertas no mês</small>
          <strong>${ordersInMonth.length}</strong>
          <em>${delivered.length} entregue(s)</em>
        </article>
        <article class="metric-card accent-blue">
          <small>Ticket médio pago</small>
          <strong>${formatCurrency(averagePaidTicket)}</strong>
          <em>${paidOrderIds.size} OS com recebimento pago</em>
        </article>
        <article class="metric-card accent-magenta">
          <small>Margem do caixa</small>
          <strong>${margin.toFixed(1)}%</strong>
          <em>Recebido x despesas pagas</em>
        </article>
        <article class="metric-card accent-yellow">
          <small>Lucro realizado</small>
          <strong>${formatCurrency(totals.income - totals.expense)}</strong>
          <em>No mês selecionado</em>
        </article>
      </div>

      <div class="grid-2">
        <section class="panel">
          <h3>Receita paga por categoria</h3>
          <div class="chart">${renderCategoryChart("income", state.reportMonth)}</div>
        </section>
        <section class="panel">
          <h3>Despesas pagas por categoria</h3>
          <div class="chart">${renderCategoryChart("expense", state.reportMonth)}</div>
        </section>
      </div>

      <section class="panel">
        <h3>Etapas das OS</h3>
        <div class="chart">${renderStatusChart()}</div>
      </section>
    </div>
  `;
}

function renderCategoryChart(type, month) {
  const grouped = paidTransactions(type, month)
    .reduce((acc, tx) => {
      acc[tx.category || "Sem categoria"] = (acc[tx.category || "Sem categoria"] || 0) + Number(tx.amount || 0);
      return acc;
    }, {});
  const max = Math.max(1, ...Object.values(grouped));

  if (!Object.keys(grouped).length) return `<div class="empty-state">Sem dados para o mês</div>`;

  return Object.entries(grouped)
    .map(
      ([category, amount]) => `
        <div class="bar-row">
          <strong>${escapeHtml(category)}</strong>
          <div class="bar-track"><div class="bar-fill ${type === "expense" ? "expense" : ""}" style="width:${(amount / max) * 100}%"></div></div>
          <span>${formatCurrency(amount)}</span>
        </div>
      `
    )
    .join("");
}

function paidTransactions(type, month) {
  return state.data.transactions.filter((tx) => tx.type === type && tx.status === "Pago" && monthOf(tx.paidDate || tx.dueDate) === month);
}

function renderStatusChart() {
  const grouped = orderStatuses.reduce((acc, status) => {
    acc[status] = state.data.orders.filter((order) => order.status === status).length;
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(grouped));

  return Object.entries(grouped)
    .map(
      ([status, count]) => `
        <div class="bar-row">
          <strong>${escapeHtml(status)}</strong>
          <div class="bar-track"><div class="bar-fill stock" style="width:${(count / max) * 100}%"></div></div>
          <span>${count} OS</span>
        </div>
      `
    )
    .join("");
}

function renderSettings() {
  pruneSelectedUsers();
  const settings = state.data.settings;
  const userCount = state.selectedUserIds.size;
  document.getElementById("settingsView").innerHTML = `
    <div class="page-grid">
      <div class="grid-2">
        <section class="panel">
          <h3>Dados da empresa</h3>
          <form id="settingsForm" class="form-grid">
            ${field("companyName", "Nome da empresa", settings.companyName)}
            ${field("document", "CNPJ", settings.document)}
            ${field("phone", "Telefone", settings.phone)}
            ${field("email", "E-mail", settings.email)}
            ${field("address", "Endereço", settings.address, "text", "full")}
            ${field("defaultWarranty", "Garantia padrão (dias)", settings.defaultWarranty, "number")}
            ${field("pixKey", "Chave Pix", settings.pixKey || "", "text", "full")}
            ${field("pixName", "Nome no Pix", settings.pixName || settings.companyName || "")}
            ${field("pixCity", "Cidade do Pix", settings.pixCity || "TRINDADE")}
            <label class="field full">
              <label>Conta bancaria</label>
              <textarea name="bankInfo" rows="4" placeholder="Banco, agencia, conta e favorecido">${escapeHtml(settings.bankInfo || "")}</textarea>
            </label>
            <label class="field full">
              <label>Logo da empresa</label>
              <div class="logo-upload-control">
                <img id="companyLogoPreview" src="${escapeHtml(companyLogoSrc())}" alt="Prévia da logo da empresa" />
                <div class="logo-upload-content">
                  <input id="companyLogoInput" name="companyLogo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
                  <small>PNG, JPG, WEBP ou SVG. Tamanho máximo: 1 MB.</small>
                </div>
                <button class="btn secondary" type="button" data-action="reset-company-logo">Restaurar padrão</button>
              </div>
            </label>
            <div class="form-actions field full">
              <button class="btn primary" type="submit">Salvar empresa</button>
            </div>
          </form>
        </section>

        <section class="panel">
          <h3>Backup e dados</h3>
          <p class="muted">Exporte um backup antes de trocar de computador ou limpar o navegador. A importação substitui os dados atuais pelo arquivo escolhido.</p>
          <div class="actions-row">
            <button class="btn primary" data-action="export-data">Exportar backup</button>
            <button class="btn secondary" data-action="import-data">Importar backup</button>
            <button class="btn warning" data-action="seed-demo">Recriar dados exemplo</button>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          <h3>Usuários e permissões</h3>
          <div class="actions-row">
            <button class="btn danger" data-action="delete-selected-users" ${userCount ? "" : "disabled"}>Excluir selecionados (${userCount})</button>
            <button class="btn primary" data-action="new-user"><span>+</span>Novo usuário</button>
          </div>
        </div>
        ${renderUsersTable()}
      </section>
    </div>
  `;
}

async function saveSettings(settingsForm) {
  const values = Object.fromEntries(new FormData(settingsForm).entries());
  delete values.companyLogo;

  const logoFile = settingsForm.elements.companyLogo?.files?.[0];
  let logo = state.data.settings.logo || DEFAULT_COMPANY_LOGO;
  if (logoFile) {
    if (!logoFile.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem válido.");
      return;
    }
    if (logoFile.size > MAX_LOGO_FILE_SIZE) {
      showToast("A logo deve ter no máximo 1 MB.");
      return;
    }
    try {
      logo = await readLogoFile(logoFile);
    } catch (error) {
      console.error(error);
      showToast("Não foi possível carregar a logo.");
      return;
    }
  }

  state.data.settings = {
    ...state.data.settings,
    ...values,
    logo,
    defaultWarranty: Number(settingsForm.elements.defaultWarranty.value || 90),
  };
  saveData();
  updateCompanyLogos();
  render();
  showToast("Dados da empresa salvos.");
}

function resetCompanyLogo() {
  state.data.settings.logo = DEFAULT_COMPANY_LOGO;
  saveData();
  updateCompanyLogos();
  renderSettings();
  showToast("Logo padrão restaurada.");
}

async function previewCompanyLogo(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    input.value = "";
    showToast("Selecione um arquivo de imagem válido.");
    return;
  }
  if (file.size > MAX_LOGO_FILE_SIZE) {
    input.value = "";
    showToast("A logo deve ter no máximo 1 MB.");
    return;
  }
  try {
    const preview = document.getElementById("companyLogoPreview");
    if (preview) preview.src = await readLogoFile(file);
  } catch (error) {
    console.error(error);
    showToast("Não foi possível carregar a logo.");
  }
}

function renderUsersTable() {
  if (!state.data.users.length) return `<div class="empty-state">Nenhum usuário cadastrado</div>`;
  const allSelected = state.data.users.length > 0 && state.data.users.every((user) => state.selectedUserIds.has(user.id));
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="check-cell"><input type="checkbox" id="selectAllUsers" ${allSelected ? "checked" : ""} title="Selecionar todos os usuários" /></th>
            <th>Usuário</th>
            <th>Função</th>
            <th>Contato</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${state.data.users
            .map(
              (user) => `
                <tr>
                  <td class="check-cell"><input type="checkbox" data-user-select value="${user.id}" ${state.selectedUserIds.has(user.id) ? "checked" : ""} title="Selecionar usuário" /></td>
                  <td><strong>${escapeHtml(user.name)}</strong><br><span class="muted">@${escapeHtml(user.login || "-")}</span></td>
                  <td><span class="status-pill ${user.role === "Administrador" ? "ready" : user.role === "Atendente" ? "alert" : ""}">${escapeHtml(user.role)}</span></td>
                  <td>${escapeHtml(user.phone || "-")}<br><span class="muted">${escapeHtml(user.email || "-")}</span></td>
                  <td><span class="status-pill ${user.status === "Ativo" ? "ready" : "closed"}">${escapeHtml(user.status)}</span></td>
                  <td><button class="mini-btn primary" data-action="edit-user" data-id="${user.id}">Editar</button></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function field(name, label, value = "", type = "text", extraClass = "") {
  return `
    <label class="field ${extraClass}">
      <label>${label}</label>
      <input name="${name}" type="${type}" value="${escapeHtml(value)}" />
    </label>
  `;
}

function openModal(title, body, kicker = "Registro") {
  dom.modalTitle.textContent = title;
  dom.modalKicker.textContent = kicker;
  dom.modalBody.innerHTML = body;
  dom.modalBackdrop.hidden = false;
}

function closeModal() {
  dom.modalBackdrop.hidden = true;
  dom.modalBody.innerHTML = "";
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  window.setTimeout(() => dom.toast.classList.remove("show"), 2600);
}

function currentUser() {
  return state.data.users.find((user) => user.id === state.currentUserId && user.status === "Ativo") || null;
}

function renderAuthState() {
  const user = currentUser();
  if (!user) {
    state.currentUserId = "";
    localStorage.removeItem(SESSION_KEY);
    dom.appShell.hidden = true;
    dom.loginScreen.hidden = false;
    return false;
  }

  dom.loginScreen.hidden = true;
  dom.appShell.hidden = false;
  dom.currentUserInitial.textContent = (user.name || "U").trim().charAt(0).toUpperCase();
  dom.currentUserName.textContent = user.name;
  dom.currentUserRole.textContent = user.role;
  return true;
}

async function handleLoginForm(form) {
  const formData = new FormData(form);
  const email = normalizeText(formData.get("email"));
  const password = String(formData.get("password") || "");
  const client = await getSupabaseClient();

  if (client) {
    const { data, error } = await client.auth.signInWithPassword({
      email: String(formData.get("email") || "").trim(),
      password,
    });

    if (error || !data?.user) {
      showToast("E-mail ou senha invÃ¡lidos no Supabase.");
      return;
    }

    await loadCloudData(data.user);
    const cloudUser = ensureCloudUserProfile(data.user);
    if (!cloudUser || cloudUser.status !== "Ativo") {
      showToast("UsuÃ¡rio inativo. Fale com o administrador.");
      return;
    }

    state.currentUserId = cloudUser.id;
    localStorage.setItem(SESSION_KEY, cloudUser.id);
    form.reset();
    if (renderAuthState()) render();
    showToast(`Bem-vindo, ${cloudUser.name}.`);
    return;
  }

  const user = state.data.users.find((item) => normalizeText(item.email) === email && item.password === password);

  if (!user) {
    showToast("E-mail ou senha inválidos.");
    return;
  }
  if (user.status !== "Ativo") {
    showToast("Usuário inativo. Fale com o administrador.");
    return;
  }

  state.currentUserId = user.id;
  localStorage.setItem(SESSION_KEY, user.id);
  form.reset();
  if (renderAuthState()) render();
  showToast(`Bem-vindo, ${user.name}.`);
}

async function logout() {
  const client = await getSupabaseClient();
  if (client) await client.auth.signOut();
  cloud.user = null;
  cloud.ready = false;
  state.currentUserId = "";
  localStorage.removeItem(SESSION_KEY);
  closeModal();
  renderAuthState();
  showToast("Sessão encerrada.");
}

async function initApp() {
  dom.todayLabel.textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  updateCompanyLogos();

  const client = await getSupabaseClient();
  if (client) {
    const { data } = await client.auth.getSession();
    const authUser = data?.session?.user;
    if (authUser) {
      await loadCloudData(authUser);
      const cloudUser = ensureCloudUserProfile(authUser);
      if (cloudUser?.status === "Ativo") {
        state.currentUserId = cloudUser.id;
        localStorage.setItem(SESSION_KEY, cloudUser.id);
      }
    }
  }

  updateCompanyLogos();
  if (renderAuthState()) render();
}

function openOrderModal(orderId = "") {
  const existing = state.data.orders.find((order) => order.id === orderId);
  const isNew = !existing;
  const order = existing || {
    id: "",
    number: state.data.settings.nextOrderNumber,
    storeTag: `TAG-${state.data.settings.nextOrderNumber}`,
    storeLocation: "Entrada",
    customerId: state.data.customers[0]?.id || "",
    equipmentId: state.data.equipment[0]?.id || "",
    title: "",
    issue: "",
    diagnosis: "",
    solution: "",
    status: "Entrada",
    priority: "Média",
    technician: "",
    createdAt: todayISO(),
    deadline: todayISO(),
    scheduledAt: "",
    labor: 0,
    discount: 0,
    parts: [],
    paid: 0,
    paymentStatus: "Pendente",
    warrantyDays: state.data.settings.defaultWarranty,
    partsReserved: false,
    services: [],
    history: [],
  };

  openModal(
    isNew ? "Nova ordem de serviço" : `OS ${order.number}`,
    `
      <form id="orderForm" data-id="${order.id}">
        <div class="form-grid">
          <label class="field">
            <span class="field-heading">
              <span>Cliente</span>
              <button class="mini-btn" type="button" data-action="toggle-inline-customer">+ Novo cliente</button>
            </span>
            <select name="customerId" id="orderCustomerSelect" required>
              ${customerOptions(order.customerId)}
            </select>
          </label>
          <label class="field">
            <span class="field-heading">
              <span>Equipamento</span>
              <button class="mini-btn" type="button" data-action="toggle-inline-equipment">+ Novo equipamento</button>
            </span>
            <select name="equipmentId" id="orderEquipmentSelect" required>
              ${equipmentOptions(order.customerId, order.equipmentId)}
            </select>
          </label>
          ${renderQuickCustomerPanel()}
          ${renderQuickEquipmentPanel()}
          ${field("storeTag", "Tag do equipamento", orderStoreTag(order), "text")}
          ${field("storeLocation", "Local na loja", order.storeLocation || "", "text")}
          ${field("title", "Resumo do defeito", order.title, "text", "full")}
          <label class="field full">
            <label>Relato do cliente</label>
            <textarea name="issue">${escapeHtml(order.issue)}</textarea>
          </label>
          <label class="field">
            <label>Status</label>
            <select name="status">${orderStatuses.map((status) => `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>
          </label>
          <label class="field">
            <label>Prioridade</label>
            <select name="priority">
              ${["Baixa", "Média", "Alta"].map((priority) => `<option ${order.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span class="field-heading">
              <span>Técnico</span>
              <button class="mini-btn" type="button" data-action="toggle-inline-technician">+ Novo técnico</button>
            </span>
            <select name="technician" id="orderTechnicianSelect">
              ${technicianOptions(order.technician)}
            </select>
          </label>
          ${renderQuickTechnicianPanel()}
          ${field("createdAt", "Entrada", order.createdAt, "date")}
          ${field("deadline", "Prazo prometido", order.deadline, "date")}
          ${field("scheduledAt", "Agendamento", order.scheduledAt, "date")}
          <label class="field full">
            <label>Diagnóstico</label>
            <textarea name="diagnosis">${escapeHtml(order.diagnosis)}</textarea>
          </label>
          <label class="field full">
            <label>Solução executada</label>
            <textarea name="solution">${escapeHtml(order.solution)}</textarea>
          </label>
          <div class="field full">
            <label>Serviços / mão de obra</label>
            <div class="parts-picker" id="orderServicesPicker">
              <input type="hidden" name="labor" id="orderLaborTotal" value="${serviceTotal(order)}" />
              <div class="actions-row">
                <button class="mini-btn primary" type="button" data-action="add-service-row">Adicionar serviço</button>
                <button class="mini-btn" type="button" data-action="toggle-inline-service">+ Cadastrar serviço</button>
                <span class="muted">Custo: <strong id="orderServiceCostPreview">${formatCurrency(serviceCost(order))}</strong></span>
                <span class="muted">Final: <strong id="orderServiceTotalPreview">${formatCurrency(serviceTotal(order))}</strong></span>
                <span class="muted">Margem: <strong id="orderServiceMarginPreview">${formatCurrency(serviceTotal(order) - serviceCost(order))}</strong></span>
              </div>
              ${renderQuickServicePanel()}
              <div id="serviceRows">
                ${orderServices(order).map(renderServiceInputRow).join("")}
              </div>
            </div>
          </div>
          ${field("discount", "Desconto", order.discount, "number")}
          <label class="field">
            <label>Valor recebido registrado</label>
            <input name="paid" type="number" value="${Number(order.paid || 0)}" readonly />
          </label>
          ${field("warrantyDays", "Garantia (dias)", order.warrantyDays, "number")}
          <div class="field full">
            <label>Peças e suprimentos</label>
            <div class="parts-picker" id="orderPartsPicker">
              <div class="actions-row">
                <button class="mini-btn primary" type="button" data-action="add-part-row">Adicionar peça</button>
                <span class="muted">Total estimado: <strong id="orderTotalPreview">${formatCurrency(orderTotal(order))}</strong></span>
              </div>
              <div id="partRows">
                ${(order.parts || []).map(renderPartInputRow).join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          ${existing ? `<button class="btn secondary" type="button" data-action="print-tag" data-id="${order.id}">Imprimir etiqueta</button>` : ""}
          ${existing ? `<button class="btn secondary" type="button" data-action="print-order" data-id="${order.id}">Imprimir</button>` : ""}
          ${existing ? `<button class="btn success" type="button" data-action="whatsapp-order" data-id="${order.id}">Enviar por WhatsApp</button>` : ""}
          <button class="btn primary" type="submit">Salvar OS</button>
        </div>
      </form>
    `,
    "Atendimento técnico"
  );

  if (!orderServices(order).length) addServiceRow();
  if (!order.parts?.length) addPartRow();
  updateOrderTotalPreview();
}

function customerOptions(selectedId) {
  if (!state.data.customers.length) return `<option value="">Cadastre um cliente</option>`;
  return state.data.customers
    .map((customer) => `<option value="${customer.id}" ${selectedId === customer.id ? "selected" : ""}>${escapeHtml(customer.name)}</option>`)
    .join("");
}

function equipmentOptions(customerId, selectedId) {
  if (!customerId) return `<option value="">Cadastre um cliente primeiro</option>`;
  const equipment = state.data.equipment.filter((item) => item.customerId === customerId);
  if (!equipment.length) return `<option value="">Cadastre um equipamento</option>`;
  return equipment
    .map((item) => `<option value="${item.id}" ${selectedId === item.id ? "selected" : ""}>${escapeHtml(item.brand)} ${escapeHtml(item.model)} · ${escapeHtml(item.serial || "sem série")}</option>`)
    .join("");
}

function technicianOptions(selectedName = "") {
  const technicians = activeTechnicians();
  const selectedExists = technicians.some((user) => user.name === selectedName);
  return `
    <option value="">Sem técnico</option>
    ${selectedName && !selectedExists ? `<option value="${escapeHtml(selectedName)}" selected>${escapeHtml(selectedName)} (antigo)</option>` : ""}
    ${technicians.map((user) => `<option value="${escapeHtml(user.name)}" ${selectedName === user.name ? "selected" : ""}>${escapeHtml(user.name)} · ${escapeHtml(user.role)}</option>`).join("")}
  `;
}

function renderQuickCustomerPanel() {
  return `
    <div class="field full inline-create-panel" id="quickCustomerPanel" hidden>
      <div class="inline-create-header">
        <strong>Novo cliente</strong>
        <button class="mini-btn" type="button" data-action="toggle-inline-customer">Fechar</button>
      </div>
      <div class="inline-form-grid">
        <label class="field">
          <label>Nome</label>
          <input id="quickCustomerName" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Tipo</label>
          <select id="quickCustomerType">
            <option>Empresa</option>
            <option>Pessoa física</option>
          </select>
        </label>
        <label class="field">
          <label>CPF/CNPJ</label>
          <input id="quickCustomerDocument" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Telefone</label>
          <input id="quickCustomerPhone" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>E-mail</label>
          <input id="quickCustomerEmail" type="email" autocomplete="off" />
        </label>
        <label class="field">
          <label>Endereço</label>
          <input id="quickCustomerAddress" type="text" autocomplete="off" />
        </label>
      </div>
      <div class="inline-create-actions">
        <button class="btn secondary" type="button" data-action="toggle-inline-customer">Cancelar</button>
        <button class="btn primary" type="button" data-action="save-inline-customer">Salvar cliente e selecionar</button>
      </div>
    </div>
  `;
}

function renderQuickEquipmentPanel() {
  return `
    <div class="field full inline-create-panel" id="quickEquipmentPanel" hidden>
      <div class="inline-create-header">
        <strong>Novo equipamento</strong>
        <span class="muted">Será vinculado ao cliente selecionado na OS.</span>
      </div>
      <div class="inline-form-grid">
        <label class="field">
          <label>Marca</label>
          <input id="quickEquipmentBrand" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Modelo</label>
          <input id="quickEquipmentModel" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Número de série</label>
          <input id="quickEquipmentSerial" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Tipo</label>
          <input id="quickEquipmentType" type="text" placeholder="Laser, jato de tinta..." autocomplete="off" />
        </label>
        <label class="field">
          <label>Local de uso</label>
          <input id="quickEquipmentLocation" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Contador</label>
          <input id="quickEquipmentCounter" type="number" min="0" value="0" />
        </label>
      </div>
      <div class="inline-create-actions">
        <button class="btn secondary" type="button" data-action="toggle-inline-equipment">Cancelar</button>
        <button class="btn primary" type="button" data-action="save-inline-equipment">Salvar equipamento e selecionar</button>
      </div>
    </div>
  `;
}

function renderQuickTechnicianPanel() {
  return `
    <div class="field full inline-create-panel" id="quickTechnicianPanel" hidden>
      <div class="inline-create-header">
        <strong>Novo técnico</strong>
        <button class="mini-btn" type="button" data-action="toggle-inline-technician">Fechar</button>
      </div>
      <div class="inline-form-grid">
        <label class="field">
          <label>Nome</label>
          <input id="quickTechnicianName" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>E-mail</label>
          <input id="quickTechnicianEmail" type="email" autocomplete="off" />
        </label>
        <label class="field">
          <label>Telefone</label>
          <input id="quickTechnicianPhone" type="text" autocomplete="off" />
        </label>
        <label class="field">
          <label>Senha/PIN inicial</label>
          <input id="quickTechnicianPassword" type="text" value="1234" autocomplete="off" />
        </label>
      </div>
      <p class="muted">Para este técnico entrar no sistema online, crie o mesmo e-mail também no Supabase.</p>
      <div class="inline-create-actions">
        <button class="btn secondary" type="button" data-action="toggle-inline-technician">Cancelar</button>
        <button class="btn primary" type="button" data-action="save-inline-technician">Salvar técnico e selecionar</button>
      </div>
    </div>
  `;
}

function toggleInlinePanel(panelId, focusSelector) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden && focusSelector) panel.querySelector(focusSelector)?.focus();
}

function refreshOrderCustomerSelect(selectedId) {
  const customerSelect = document.getElementById("orderCustomerSelect");
  if (!customerSelect) return;
  customerSelect.innerHTML = customerOptions(selectedId);
  customerSelect.value = selectedId;
}

function refreshOrderEquipmentSelect(customerId, selectedId = "") {
  const equipmentSelect = document.getElementById("orderEquipmentSelect");
  if (!equipmentSelect) return;
  equipmentSelect.innerHTML = equipmentOptions(customerId, selectedId);
  equipmentSelect.value = selectedId;
}

function refreshOrderTechnicianSelect(selectedName = "") {
  const technicianSelect = document.getElementById("orderTechnicianSelect");
  if (!technicianSelect) return;
  technicianSelect.innerHTML = technicianOptions(selectedName);
  technicianSelect.value = selectedName;
}

function saveInlineCustomer() {
  const name = document.getElementById("quickCustomerName")?.value.trim();
  if (!name) {
    showToast("Informe o nome do cliente.");
    return;
  }

  const customer = {
    id: uid("cus"),
    name,
    type: document.getElementById("quickCustomerType")?.value || "Empresa",
    document: document.getElementById("quickCustomerDocument")?.value.trim() || "",
    phone: document.getElementById("quickCustomerPhone")?.value.trim() || "",
    email: document.getElementById("quickCustomerEmail")?.value.trim() || "",
    address: document.getElementById("quickCustomerAddress")?.value.trim() || "",
    notes: "Cadastrado durante abertura de OS.",
  };

  state.data.customers.push(customer);
  saveData();
  refreshOrderCustomerSelect(customer.id);
  refreshOrderEquipmentSelect(customer.id);
  clearQuickCustomerFields();
  document.getElementById("quickCustomerPanel").hidden = true;
  showToast("Cliente cadastrado e selecionado.");
}

function saveInlineEquipment() {
  const customerId = document.getElementById("orderCustomerSelect")?.value;
  if (!customerId) {
    showToast("Selecione ou cadastre um cliente primeiro.");
    return;
  }

  const brand = document.getElementById("quickEquipmentBrand")?.value.trim();
  const model = document.getElementById("quickEquipmentModel")?.value.trim();
  if (!brand || !model) {
    showToast("Informe marca e modelo do equipamento.");
    return;
  }

  const equipment = {
    id: uid("eq"),
    customerId,
    brand,
    model,
    serial: document.getElementById("quickEquipmentSerial")?.value.trim() || "",
    type: document.getElementById("quickEquipmentType")?.value.trim() || "",
    location: document.getElementById("quickEquipmentLocation")?.value.trim() || "",
    counter: Number(document.getElementById("quickEquipmentCounter")?.value || 0),
  };

  state.data.equipment.push(equipment);
  saveData();
  refreshOrderEquipmentSelect(customerId, equipment.id);
  clearQuickEquipmentFields();
  document.getElementById("quickEquipmentPanel").hidden = true;
  showToast("Equipamento cadastrado e selecionado.");
}

function saveInlineTechnician() {
  const name = document.getElementById("quickTechnicianName")?.value.trim();
  if (!name) {
    showToast("Informe o nome do técnico.");
    return;
  }

  const emailInput = document.getElementById("quickTechnicianEmail")?.value.trim() || "";
  const baseLogin = normalizeText(emailInput ? emailInput.split("@")[0] : name).replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "tecnico";
  let login = baseLogin;
  let suffix = 2;
  while (state.data.users.some((user) => normalizeText(user.login) === normalizeText(login))) {
    login = `${baseLogin}${suffix}`;
    suffix += 1;
  }

  const email = emailInput || `${login}@isprotec.local`;
  if (state.data.users.some((user) => normalizeText(user.email) === normalizeText(email))) {
    showToast("Já existe um usuário com esse e-mail.");
    return;
  }

  const technician = {
    id: uid("usr"),
    name,
    login,
    email,
    phone: document.getElementById("quickTechnicianPhone")?.value.trim() || "",
    role: "Técnico",
    status: "Ativo",
    password: document.getElementById("quickTechnicianPassword")?.value.trim() || "1234",
  };

  state.data.users.push(technician);
  saveData();
  refreshOrderTechnicianSelect(technician.name);
  clearQuickTechnicianFields();
  document.getElementById("quickTechnicianPanel").hidden = true;
  showToast("Técnico cadastrado e selecionado.");
}

function clearQuickCustomerFields() {
  [
    "quickCustomerName",
    "quickCustomerDocument",
    "quickCustomerPhone",
    "quickCustomerEmail",
    "quickCustomerAddress",
  ].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const type = document.getElementById("quickCustomerType");
  if (type) type.value = "Empresa";
}

function clearQuickEquipmentFields() {
  [
    "quickEquipmentBrand",
    "quickEquipmentModel",
    "quickEquipmentSerial",
    "quickEquipmentType",
    "quickEquipmentLocation",
  ].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const counter = document.getElementById("quickEquipmentCounter");
  if (counter) counter.value = "0";
}

function clearQuickTechnicianFields() {
  ["quickTechnicianName", "quickTechnicianEmail", "quickTechnicianPhone"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const password = document.getElementById("quickTechnicianPassword");
  if (password) password.value = "1234";
}

function serviceOptions(selectedId) {
  if (!state.data.services.length) return `<option value="">Cadastre um serviço</option>`;
  return state.data.services
    .map((service) => `<option value="${service.id}" ${selectedId === service.id ? "selected" : ""}>${escapeHtml(service.name)} · ${formatCurrency(service.price)}</option>`)
    .join("");
}

function renderQuickServicePanel() {
  return `
    <div class="inline-create-panel" id="quickServicePanel" hidden>
      <input id="quickServiceId" type="hidden" value="" />
      <div class="inline-create-header">
        <strong id="quickServiceTitle">Novo serviço</strong>
        <span class="muted" id="quickServiceHint">Fica salvo para usar em outras OS.</span>
      </div>
      <div class="inline-form-grid">
        <label class="field">
          <label>Nome do serviço</label>
          <input id="quickServiceName" type="text" placeholder="Limpeza cabeça impressão" autocomplete="off" />
        </label>
        <label class="field">
          <label>Categoria</label>
          <input id="quickServiceCategory" type="text" placeholder="Limpeza, reparo..." autocomplete="off" />
        </label>
        <label class="field">
          <label>Valor de custo</label>
          <input id="quickServiceCost" type="number" min="0" step="0.01" value="0" />
        </label>
        <label class="field">
          <label>Valor final</label>
          <input id="quickServicePrice" type="number" min="0" step="0.01" value="0" />
        </label>
      </div>
      <div class="inline-create-actions">
        <button class="btn secondary" type="button" data-action="toggle-inline-service">Cancelar</button>
        <button class="btn primary" type="button" data-action="save-inline-service" id="quickServiceSaveBtn">Salvar serviço e adicionar</button>
      </div>
    </div>
  `;
}

function renderServiceInputRow(item = { serviceId: "", name: "", qty: 1, cost: 0, price: 0 }) {
  const selectedService = serviceById(item.serviceId);
  const cost = item.cost ?? selectedService?.cost ?? 0;
  const price = item.price ?? selectedService?.price ?? 0;
  const name = item.name || selectedService?.name || "";
  return `
    <div class="service-row" data-service-row>
      <input type="hidden" data-service-name value="${escapeHtml(name)}" />
      <label class="field">
        <label>Serviço</label>
        <select data-service-id>
          <option value="">Selecionar</option>
          ${serviceOptions(item.serviceId)}
        </select>
      </label>
      <label class="field">
        <label>Qtd.</label>
        <input data-service-qty type="number" min="1" value="${Number(item.qty || 1)}" />
      </label>
      <label class="field">
        <label>Custo</label>
        <input data-service-cost type="number" min="0" step="0.01" value="${Number(cost || 0)}" />
      </label>
      <label class="field">
        <label>Final</label>
        <input data-service-price type="number" min="0" step="0.01" value="${Number(price || 0)}" />
      </label>
      <button class="mini-btn" type="button" data-action="edit-service-row" title="Editar cadastro do serviço">Editar</button>
      <button class="icon-btn" type="button" data-action="remove-service-row" title="Remover">×</button>
    </div>
  `;
}

function addServiceRow(item) {
  const rows = document.getElementById("serviceRows");
  if (rows) rows.insertAdjacentHTML("beforeend", renderServiceInputRow(item));
  updateOrderTotalPreview();
}

function getServiceRowsFromForm() {
  return [...document.querySelectorAll("[data-service-row]")]
    .map((row) => {
      const serviceId = row.querySelector("[data-service-id]").value;
      const service = serviceById(serviceId);
      const storedName = row.querySelector("[data-service-name]")?.value || "";
      const price = Number(row.querySelector("[data-service-price]").value || 0);
      const name = service?.name || storedName || (price > 0 ? "Serviço avulso" : "");
      return {
        serviceId,
        name,
        qty: Number(row.querySelector("[data-service-qty]").value || 0),
        cost: Number(row.querySelector("[data-service-cost]").value || 0),
        price,
      };
    })
    .filter((item) => item.qty > 0 && (item.serviceId || item.price > 0 || item.name));
}

function saveInlineService() {
  const serviceId = document.getElementById("quickServiceId")?.value || "";
  const name = document.getElementById("quickServiceName")?.value.trim();
  const cost = Number(document.getElementById("quickServiceCost")?.value || 0);
  const price = Number(document.getElementById("quickServicePrice")?.value || 0);
  if (!name) {
    showToast("Informe o nome do serviço.");
    return;
  }
  if (price <= 0) {
    showToast("Informe o valor final do serviço.");
    return;
  }

  const service = {
    id: serviceId || uid("svc"),
    name,
    category: document.getElementById("quickServiceCategory")?.value.trim() || "Serviço",
    cost,
    price,
  };

  if (serviceId) {
    const index = state.data.services.findIndex((item) => item.id === serviceId);
    if (index >= 0) state.data.services[index] = service;
    else state.data.services.push(service);
  } else {
    state.data.services.push(service);
  }

  saveData();
  refreshServiceSelects();
  if (serviceId) {
    applyServiceToVisibleRows(service);
  } else {
    addServiceRow({ serviceId: service.id, name: service.name, qty: 1, cost: service.cost, price: service.price });
  }
  clearQuickServiceFields();
  document.getElementById("quickServicePanel").hidden = true;
  showToast(serviceId ? "Serviço atualizado." : "Serviço cadastrado e adicionado à OS.");
}

function refreshServiceSelects() {
  document.querySelectorAll("[data-service-id]").forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = `<option value="">Selecionar</option>${serviceOptions(currentValue)}`;
    select.value = currentValue;
  });
}

function clearQuickServiceFields() {
  const serviceId = document.getElementById("quickServiceId");
  const title = document.getElementById("quickServiceTitle");
  const hint = document.getElementById("quickServiceHint");
  const saveBtn = document.getElementById("quickServiceSaveBtn");
  if (serviceId) serviceId.value = "";
  if (title) title.textContent = "Novo serviço";
  if (hint) hint.textContent = "Fica salvo para usar em outras OS.";
  if (saveBtn) saveBtn.textContent = "Salvar serviço e adicionar";
  ["quickServiceName", "quickServiceCategory"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const cost = document.getElementById("quickServiceCost");
  const price = document.getElementById("quickServicePrice");
  if (cost) cost.value = "0";
  if (price) price.value = "0";
}

function toggleQuickServicePanel() {
  const panel = document.getElementById("quickServicePanel");
  if (!panel) return;
  if (panel.hidden) {
    clearQuickServiceFields();
    panel.hidden = false;
    document.getElementById("quickServiceName")?.focus();
  } else {
    panel.hidden = true;
    clearQuickServiceFields();
  }
}

function editServiceFromRow(row) {
  const serviceId = row?.querySelector("[data-service-id]")?.value || "";
  const service = serviceById(serviceId);
  if (!service) {
    showToast("Selecione um serviço cadastrado para editar.");
    return;
  }

  const panel = document.getElementById("quickServicePanel");
  if (!panel) return;
  document.getElementById("quickServiceId").value = service.id;
  document.getElementById("quickServiceTitle").textContent = "Editar serviço";
  document.getElementById("quickServiceHint").textContent = "Atualiza o cadastro e as linhas desta OS que usam esse serviço.";
  document.getElementById("quickServiceSaveBtn").textContent = "Salvar alterações";
  document.getElementById("quickServiceName").value = service.name || "";
  document.getElementById("quickServiceCategory").value = service.category || "";
  document.getElementById("quickServiceCost").value = Number(service.cost || 0);
  document.getElementById("quickServicePrice").value = Number(service.price || 0);
  panel.hidden = false;
  document.getElementById("quickServiceName")?.focus();
}

function applyServiceToVisibleRows(service) {
  document.querySelectorAll("[data-service-row]").forEach((row) => {
    const select = row.querySelector("[data-service-id]");
    if (select?.value !== service.id) return;
    row.querySelector("[data-service-name]").value = service.name;
    row.querySelector("[data-service-cost]").value = Number(service.cost || 0);
    row.querySelector("[data-service-price]").value = Number(service.price || 0);
  });
  updateOrderTotalPreview();
}

function renderPartInputRow(item = { partId: "", qty: 1, price: 0 }) {
  const selectedPart = partById(item.partId);
  const price = item.price || selectedPart?.price || 0;
  return `
    <div class="part-row" data-part-row>
      <label class="field">
        <label>Peça</label>
        <select data-part-id>
          <option value="">Selecionar</option>
          ${state.data.parts.map((part) => `<option value="${part.id}" ${item.partId === part.id ? "selected" : ""}>${escapeHtml(part.name)} (${part.stock})</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <label>Qtd.</label>
        <input data-part-qty type="number" min="1" value="${Number(item.qty || 1)}" />
      </label>
      <label class="field">
        <label>Venda</label>
        <input data-part-price type="number" min="0" step="0.01" value="${Number(price)}" />
      </label>
      <button class="icon-btn" type="button" data-action="remove-part-row" title="Remover">×</button>
    </div>
  `;
}

function addPartRow() {
  const rows = document.getElementById("partRows");
  if (rows) rows.insertAdjacentHTML("beforeend", renderPartInputRow());
}

function getPartRowsFromForm() {
  return [...document.querySelectorAll("[data-part-row]")]
    .map((row) => ({
      partId: row.querySelector("[data-part-id]").value,
      qty: Number(row.querySelector("[data-part-qty]").value || 0),
      price: Number(row.querySelector("[data-part-price]").value || 0),
    }))
    .filter((item) => item.partId && item.qty > 0);
}

function updateOrderTotalPreview() {
  const form = document.getElementById("orderForm");
  const preview = document.getElementById("orderTotalPreview");
  if (!form || !preview) return;
  const discount = Number(form.elements.discount?.value || 0);
  const services = getServiceRowsFromForm();
  const serviceRevenue = services.reduce((sum, item) => sum + item.qty * item.price, 0);
  const serviceCosts = services.reduce((sum, item) => sum + item.qty * item.cost, 0);
  const parts = getPartRowsFromForm();
  const total = Math.max(0, serviceRevenue + parts.reduce((sum, item) => sum + item.qty * item.price, 0) - discount);
  const laborInput = document.getElementById("orderLaborTotal");
  if (laborInput) laborInput.value = serviceRevenue;
  const costPreview = document.getElementById("orderServiceCostPreview");
  const serviceTotalPreview = document.getElementById("orderServiceTotalPreview");
  const marginPreview = document.getElementById("orderServiceMarginPreview");
  if (costPreview) costPreview.textContent = formatCurrency(serviceCosts);
  if (serviceTotalPreview) serviceTotalPreview.textContent = formatCurrency(serviceRevenue);
  if (marginPreview) marginPreview.textContent = formatCurrency(serviceRevenue - serviceCosts);
  preview.textContent = formatCurrency(total);
}

function saveOrderFromForm(form) {
  const id = form.dataset.id;
  const existingIndex = state.data.orders.findIndex((order) => order.id === id);
  const existing = state.data.orders[existingIndex];
  const formData = new FormData(form);
  const savedStatus = formData.get("status");
  const services = getServiceRowsFromForm();
  const order = {
    ...(existing || {}),
    id: id || uid("os"),
    number: existing?.number || state.data.settings.nextOrderNumber,
    storeTag: formData.get("storeTag") || `TAG-${existing?.number || state.data.settings.nextOrderNumber}`,
    storeLocation: formData.get("storeLocation") || "",
    customerId: formData.get("customerId"),
    equipmentId: formData.get("equipmentId"),
    title: formData.get("title"),
    issue: formData.get("issue"),
    diagnosis: formData.get("diagnosis"),
    solution: formData.get("solution"),
    status: savedStatus,
    priority: formData.get("priority"),
    technician: formData.get("technician"),
    createdAt: formData.get("createdAt"),
    deadline: formData.get("deadline"),
    scheduledAt: formData.get("scheduledAt"),
    services,
    labor: services.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    discount: Number(formData.get("discount") || 0),
    parts: getPartRowsFromForm(),
    paid: Number(formData.get("paid") || 0),
    warrantyDays: Number(formData.get("warrantyDays") || 0),
    partsReserved: existing?.partsReserved || false,
    history: existing?.history || [],
  };

  if (!order.customerId || !order.equipmentId) {
    showToast("Cadastre cliente e equipamento antes de salvar a OS.");
    return;
  }

  if (productiveStatuses.includes(order.status)) {
    const shortage = firstStockShortage(order.parts || [], existing);
    if (shortage) {
      showToast(`Estoque insuficiente: ${shortage.name} tem ${shortage.available} disponível.`);
      return;
    }

    if (existing && existing.partsReserved) restoreParts(existing.parts || []);
    reserveParts(order.parts || []);
    order.partsReserved = true;
  } else {
    if (existing && existing.partsReserved) restoreParts(existing.parts || []);
    order.partsReserved = false;
  }

  order.paymentStatus = paymentStatus(order);
  order.history = [...order.history, { date: todayISO(), text: `${existing ? "OS atualizada" : "OS aberta"} com status ${order.status}.` }];

  if (existingIndex >= 0) {
    state.data.orders[existingIndex] = order;
  } else {
    state.data.orders.unshift(order);
    state.data.settings.nextOrderNumber += 1;
  }

  saveData();
  closeModal();
  render();
  showToast(`OS ${order.number} salva com sucesso.`);
}

function reserveParts(parts) {
  parts.forEach((item) => {
    const part = partById(item.partId);
    if (part) part.stock = Math.max(0, Number(part.stock || 0) - Number(item.qty || 0));
  });
}

function restoreParts(parts) {
  parts.forEach((item) => {
    const part = partById(item.partId);
    if (part) part.stock = Number(part.stock || 0) + Number(item.qty || 0);
  });
}

function firstStockShortage(parts, existingOrder) {
  const requested = parts.reduce((acc, item) => {
    acc[item.partId] = (acc[item.partId] || 0) + Number(item.qty || 0);
    return acc;
  }, {});
  const reserved = existingOrder?.partsReserved
    ? (existingOrder.parts || []).reduce((acc, item) => {
        acc[item.partId] = (acc[item.partId] || 0) + Number(item.qty || 0);
        return acc;
      }, {})
    : {};

  for (const [partId, qty] of Object.entries(requested)) {
    const part = partById(partId);
    const available = Number(part?.stock || 0) + Number(reserved[partId] || 0);
    if (!part || qty > available) {
      return { name: part?.name || "Item removido", available };
    }
  }

  return null;
}

function openCustomerModal(customerId = "") {
  const customer = state.data.customers.find((item) => item.id === customerId) || {
    id: "",
    name: "",
    type: "Empresa",
    document: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  };

  openModal(
    customer.id ? "Editar cliente" : "Novo cliente",
    `
      <form id="customerForm" data-id="${customer.id}" class="form-grid">
        ${field("name", "Nome", customer.name)}
        <label class="field">
          <label>Tipo</label>
          <select name="type">
            ${["Empresa", "Pessoa física"].map((type) => `<option ${customer.type === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </label>
        ${field("document", "CPF/CNPJ", customer.document)}
        ${field("phone", "Telefone", customer.phone)}
        ${field("email", "E-mail", customer.email)}
        ${field("address", "Endereço", customer.address, "text", "full")}
        <label class="field full">
          <label>Observações</label>
          <textarea name="notes">${escapeHtml(customer.notes)}</textarea>
        </label>
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar cliente</button>
        </div>
      </form>
    `,
    "Cadastro"
  );
}

function saveCustomer(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.name.trim()) {
    showToast("Informe o nome do cliente.");
    return;
  }
  const record = { id: id || uid("cus"), ...data };
  const index = state.data.customers.findIndex((customer) => customer.id === id);
  if (index >= 0) state.data.customers[index] = record;
  else state.data.customers.push(record);
  saveData();
  closeModal();
  render();
  showToast("Cliente salvo.");
}

function openEquipmentModal(equipmentId = "") {
  const equipment = state.data.equipment.find((item) => item.id === equipmentId) || {
    id: "",
    customerId: state.data.customers[0]?.id || "",
    brand: "",
    model: "",
    serial: "",
    type: "",
    location: "",
    counter: 0,
  };

  openModal(
    equipment.id ? "Editar equipamento" : "Novo equipamento",
    `
      <form id="equipmentForm" data-id="${equipment.id}" class="form-grid">
        <label class="field">
          <label>Cliente</label>
          <select name="customerId" required>
            ${state.data.customers.map((customer) => `<option value="${customer.id}" ${equipment.customerId === customer.id ? "selected" : ""}>${escapeHtml(customer.name)}</option>`).join("")}
          </select>
        </label>
        ${field("brand", "Marca", equipment.brand)}
        ${field("model", "Modelo", equipment.model)}
        ${field("serial", "Número de série", equipment.serial)}
        ${field("type", "Tipo", equipment.type)}
        ${field("location", "Local de uso", equipment.location)}
        ${field("counter", "Contador", equipment.counter, "number")}
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar equipamento</button>
        </div>
      </form>
    `,
    "Cadastro"
  );
}

function saveEquipment(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.customerId || !data.brand.trim() || !data.model.trim()) {
    showToast("Informe cliente, marca e modelo.");
    return;
  }
  const record = { id: id || uid("eq"), ...data, counter: Number(data.counter || 0) };
  const index = state.data.equipment.findIndex((equipment) => equipment.id === id);
  if (index >= 0) state.data.equipment[index] = record;
  else state.data.equipment.push(record);
  saveData();
  closeModal();
  render();
  showToast("Equipamento salvo.");
}

function openUserModal(userId = "") {
  const user = state.data.users.find((item) => item.id === userId) || {
    id: "",
    name: "",
    login: "",
    email: "",
    role: "Técnico",
    phone: "",
    status: "Ativo",
    password: "",
  };

  openModal(
    user.id ? "Editar usuário" : "Novo usuário",
    `
      <form id="userForm" data-id="${user.id}" class="form-grid">
        ${field("name", "Nome", user.name)}
        ${field("login", "Login", user.login)}
        ${field("email", "E-mail", user.email)}
        ${field("phone", "Telefone", user.phone)}
        <label class="field">
          <label>Função</label>
          <select name="role">
            ${["Administrador", "Atendente", "Técnico"].map((role) => `<option ${user.role === role ? "selected" : ""}>${role}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <label>Status</label>
          <select name="status">
            ${["Ativo", "Inativo"].map((status) => `<option ${user.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        ${field("password", "Senha/PIN inicial", user.password, "password", "full")}
        <p class="muted field full">Este cadastro local organiza funções e técnicos da OS. Controle de login e permissões pode ser ativado em uma próxima etapa.</p>
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar usuário</button>
        </div>
      </form>
    `,
    "Usuários"
  );
}

function saveUser(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.name.trim() || !data.login.trim() || !data.email.trim() || !data.password.trim()) {
    showToast("Informe nome, login, e-mail e senha.");
    return;
  }

  const repeatedLogin = state.data.users.some((user) => user.id !== id && normalizeText(user.login) === normalizeText(data.login));
  if (repeatedLogin) {
    showToast("Já existe um usuário com esse login.");
    return;
  }
  const repeatedEmail = state.data.users.some((user) => user.id !== id && normalizeText(user.email) === normalizeText(data.email));
  if (repeatedEmail) {
    showToast("Já existe um usuário com esse e-mail.");
    return;
  }

  const record = {
    id: id || uid("usr"),
    name: data.name.trim(),
    login: data.login.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    role: data.role,
    status: data.status,
    password: data.password,
  };
  const index = state.data.users.findIndex((user) => user.id === id);
  if (index >= 0) state.data.users[index] = record;
  else state.data.users.push(record);
  saveData();
  closeModal();
  if (renderAuthState()) render();
  showToast("Usuário salvo.");
}

function openPartModal(partId = "") {
  const part = state.data.parts.find((item) => item.id === partId) || {
    id: "",
    sku: "",
    name: "",
    category: "Peça",
    stock: 0,
    minStock: 0,
    cost: 0,
    price: 0,
    supplier: "",
  };

  openModal(
    part.id ? "Editar item do estoque" : "Novo item do estoque",
    `
      <form id="partForm" data-id="${part.id}" class="form-grid">
        ${field("sku", "SKU", part.sku)}
        ${field("name", "Nome do item", part.name)}
        ${field("category", "Categoria", part.category)}
        ${field("supplier", "Fornecedor", part.supplier)}
        ${field("stock", "Estoque atual", part.stock, "number")}
        ${field("minStock", "Estoque mínimo", part.minStock, "number")}
        ${field("cost", "Custo", part.cost, "number")}
        ${field("price", "Preço de venda", part.price, "number")}
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar item</button>
        </div>
      </form>
    `,
    "Estoque"
  );
}

function savePart(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.name.trim()) {
    showToast("Informe o nome do item.");
    return;
  }
  const record = {
    id: id || uid("part"),
    ...data,
    stock: Number(data.stock || 0),
    minStock: Number(data.minStock || 0),
    cost: Number(data.cost || 0),
    price: Number(data.price || 0),
  };
  const index = state.data.parts.findIndex((part) => part.id === id);
  if (index >= 0) state.data.parts[index] = record;
  else state.data.parts.push(record);
  saveData();
  closeModal();
  render();
  showToast("Estoque atualizado.");
}

function openProductModal(productId = "") {
  const product = productById(productId) || {
    id: "",
    sku: "",
    name: "",
    category: "Impressoras",
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0,
    active: true,
    image: "assets/isprotec-products.png",
    description: "",
  };

  openModal(
    product.id ? "Editar produto" : "Novo produto",
    `
      <form id="productForm" data-id="${product.id}" class="form-grid">
        ${field("sku", "SKU", product.sku)}
        ${field("name", "Nome do produto", product.name)}
        <label class="field">
          <label>Categoria</label>
          <select name="category">
            ${["Impressoras", "Toners e cartuchos", "Refis de tinta", "Pecas e acessorios", "Outros"]
              .map((category) => `<option value="${category}" ${product.category === category ? "selected" : ""}>${category}</option>`)
              .join("")}
          </select>
        </label>
        <label class="field">
          <label>Status no site</label>
          <select name="active">
            <option value="true" ${product.active !== false ? "selected" : ""}>Ativo</option>
            <option value="false" ${product.active === false ? "selected" : ""}>Inativo</option>
          </select>
        </label>
        ${field("stock", "Estoque atual", product.stock, "number")}
        ${field("minStock", "Estoque minimo", product.minStock, "number")}
        ${field("cost", "Custo", product.cost, "number")}
        ${field("price", "Preco de venda", product.price, "number")}
        <label class="field full">
          <label>Descricao</label>
          <textarea name="description" rows="4">${escapeHtml(product.description || "")}</textarea>
        </label>
        <label class="field full">
          <label>Foto do produto</label>
          <div class="logo-upload-control product-image-upload">
            <img id="productImagePreview" src="${escapeHtml(product.image || "assets/isprotec-products.png")}" alt="Previa do produto" />
            <div class="logo-upload-content">
              <input id="productImageInput" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
              <small>PNG, JPG ou WEBP. Tamanho maximo: 1 MB.</small>
              <input type="hidden" name="image" value="${escapeHtml(product.image || "assets/isprotec-products.png")}" />
            </div>
          </div>
        </label>
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar produto</button>
        </div>
      </form>
    `,
    "Produtos"
  );
}

async function saveProduct(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.name.trim()) {
    showToast("Informe o nome do produto.");
    return;
  }

  const record = {
    id: id || uid("prod"),
    sku: data.sku.trim(),
    name: data.name.trim(),
    category: data.category,
    price: Number(data.price || 0),
    cost: Number(data.cost || 0),
    stock: Number(data.stock || 0),
    minStock: Number(data.minStock || 0),
    active: data.active === "true",
    image: data.image || "assets/isprotec-products.png",
    description: data.description.trim(),
  };
  const index = state.data.products.findIndex((product) => product.id === id);
  if (index >= 0) state.data.products[index] = record;
  else state.data.products.push(record);
  saveData();
  closeModal();
  renderProducts();
  showToast("Produto salvo.");
}

async function previewProductImage(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > MAX_LOGO_FILE_SIZE) {
    showToast("A imagem deve ter no maximo 1 MB.");
    input.value = "";
    return;
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    showToast("Use imagem PNG, JPG ou WEBP.");
    input.value = "";
    return;
  }
  try {
    const dataUrl = await readLogoFile(file);
    const preview = document.getElementById("productImagePreview");
    const hidden = input.closest("form")?.querySelector('input[name="image"]');
    if (preview) preview.src = dataUrl;
    if (hidden) hidden.value = dataUrl;
  } catch (error) {
    showToast(error.message);
  }
}

function openStockInModal(partId) {
  const part = partById(partId);
  if (!part) return;
  openModal(
    "Entrada no estoque",
    `
      <form id="stockInForm" data-id="${part.id}" class="form-grid">
        <p class="field full"><strong>${escapeHtml(part.name)}</strong><br><span class="muted">Estoque atual: ${part.stock}</span></p>
        ${field("qty", "Quantidade recebida", 1, "number")}
        ${field("cost", "Custo unitário", part.cost, "number")}
        <label class="field">
          <label>Lançar no caixa</label>
          <select name="cash">
            <option value="yes">Sim, criar despesa</option>
            <option value="no">Não</option>
          </select>
        </label>
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Confirmar entrada</button>
        </div>
      </form>
    `,
    "Estoque"
  );
}

function saveStockIn(form) {
  const part = partById(form.dataset.id);
  if (!part) return;
  const qty = Number(form.elements.qty.value || 0);
  const cost = Number(form.elements.cost.value || part.cost || 0);
  part.stock = Number(part.stock || 0) + qty;
  part.cost = cost;
  if (form.elements.cash.value === "yes" && qty > 0) {
    state.data.transactions.push({
      id: uid("tx"),
      type: "expense",
      description: `Compra estoque - ${part.name}`,
      category: "Estoque",
      amount: qty * cost,
      dueDate: todayISO(),
      paidDate: todayISO(),
      status: "Pago",
      method: "Pix",
      orderId: "",
    });
  }
  saveData();
  closeModal();
  render();
  showToast("Entrada de estoque registrada.");
}

function openCashModal(txId = "") {
  const tx = state.data.transactions.find((item) => item.id === txId) || {
    id: "",
    type: "income",
    description: "",
    category: "Serviços",
    amount: 0,
    dueDate: todayISO(),
    paidDate: "",
    status: "Pendente",
    method: "Pix",
    orderId: "",
  };

  openModal(
    tx.id ? "Editar lançamento" : "Novo lançamento",
    `
      <form id="cashForm" data-id="${tx.id}" class="form-grid">
        <label class="field">
          <label>Tipo</label>
          <select name="type">
            <option value="income" ${tx.type === "income" ? "selected" : ""}>Entrada</option>
            <option value="expense" ${tx.type === "expense" ? "selected" : ""}>Saída</option>
          </select>
        </label>
        <label class="field">
          <label>Status</label>
          <select name="status">
            ${["Pendente", "Pago"].map((status) => `<option ${tx.status === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        ${field("description", "Descrição", tx.description, "text", "full")}
        ${field("category", "Categoria", tx.category)}
        ${field("amount", "Valor", tx.amount, "number")}
        ${field("dueDate", "Vencimento", tx.dueDate, "date")}
        ${field("paidDate", "Data de pagamento", tx.paidDate, "date")}
        ${field("method", "Forma de pagamento", tx.method)}
        <div class="form-actions field full">
          <button class="btn primary" type="submit">Salvar lançamento</button>
        </div>
      </form>
    `,
    "Financeiro"
  );
}

function saveCash(form) {
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.description.trim() || Number(data.amount || 0) <= 0) {
    showToast("Informe descrição e valor.");
    return;
  }
  const record = {
    id: id || uid("tx"),
    ...data,
    amount: Number(data.amount || 0),
    paidDate: data.status === "Pago" ? data.paidDate || todayISO() : "",
  };
  const index = state.data.transactions.findIndex((tx) => tx.id === id);
  if (index >= 0) state.data.transactions[index] = record;
  else state.data.transactions.push(record);
  saveData();
  closeModal();
  render();
  showToast("Lançamento salvo.");
}

function openReceiveOrderModal(orderId) {
  const order = state.data.orders.find((item) => item.id === orderId);
  if (!order) return;
  const balance = balanceOfOrder(order);
  openModal(
    `Receber OS ${order.number}`,
    `
      <form id="receiveOrderForm" data-id="${order.id}" class="form-grid">
        <p class="field full"><strong>${escapeHtml(customerName(order.customerId))}</strong><br><span class="muted">Saldo em aberto: ${formatCurrency(balance)}</span></p>
        ${field("amount", "Valor recebido", balance, "number")}
        ${field("paidDate", "Data", todayISO(), "date")}
        ${field("method", "Forma de pagamento", "Pix")}
        <div class="form-actions field full">
          <button class="btn success" type="submit">Registrar recebimento</button>
        </div>
      </form>
    `,
    "Recebimento"
  );
}

function saveReceiveOrder(form) {
  const order = state.data.orders.find((item) => item.id === form.dataset.id);
  if (!order) return;
  const amount = Math.min(Number(form.elements.amount.value || 0), balanceOfOrder(order));
  if (amount <= 0) {
    showToast("Informe um valor válido.");
    return;
  }
  order.paid = Number(order.paid || 0) + amount;
  order.paymentStatus = paymentStatus(order);
  order.history.push({ date: todayISO(), text: `Recebimento registrado: ${formatCurrency(amount)}.` });
  const paidDate = form.elements.paidDate.value || todayISO();
  const method = form.elements.method.value || "Pix";
  state.data.transactions.push({
    id: uid("tx"),
    type: "income",
    description: `Recebimento OS ${order.number} - ${customerName(order.customerId)}`,
    category: "Serviços",
    amount,
    dueDate: paidDate,
    paidDate,
    status: "Pago",
    method,
    orderId: order.id,
  });
  saveData();
  closeModal();
  render();
  if (order.paymentStatus === "Pago") {
    showToast("Recebimento registrado. Recibo aberto para impressao.");
    openReceiptPrint(order, amount, paidDate, method);
  } else {
    showToast("Recebimento parcial registrado no caixa.");
  }
}

function payTransaction(txId) {
  const tx = state.data.transactions.find((item) => item.id === txId);
  if (!tx) return;
  const wasPaid = tx.status === "Pago";
  tx.status = "Pago";
  tx.paidDate = todayISO();
  let paidOrder = null;
  if (!wasPaid && tx.type === "income" && tx.orderId) {
    const order = state.data.orders.find((item) => item.id === tx.orderId);
    if (order) {
      order.paid = Number(order.paid || 0) + Number(tx.amount || 0);
      order.paymentStatus = paymentStatus(order);
      order.history = [...(order.history || []), { date: todayISO(), text: `Pagamento baixado no financeiro: ${formatCurrency(tx.amount)}.` }];
      if (order.paymentStatus === "Pago") paidOrder = order;
    }
  }
  saveData();
  render();
  showToast("Lançamento baixado.");
  if (paidOrder) openReceiptPrint(paidOrder, Number(tx.amount || 0), tx.paidDate, tx.method || "Pix");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `backup-isprotec-${todayISO()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      state.data = migrateData(imported);
      saveData();
      closeModal();
      if (renderAuthState()) render();
      showToast("Backup importado com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("Arquivo de backup inválido.");
    }
  };
  reader.readAsText(file);
}

function importOrders(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const records = extractImportedOrders(imported);
      if (!records.length) {
        showToast("Nenhuma OS encontrada no JSON.");
        return;
      }

      const usedNumbers = new Set(state.data.orders.map((order) => Number(order.number)).filter(Boolean));
      const stats = { orders: 0, customers: 0, equipment: 0, parts: 0, income: 0, skipped: 0 };
      const importedOrders = [];

      records.forEach((record) => {
        const order = normalizeImportedOrder(record, usedNumbers, stats);
        if (!order) {
          stats.skipped += 1;
          return;
        }
        importedOrders.push(order);
      });

      if (!importedOrders.length) {
        showToast("Nenhuma OS valida para importar.");
        return;
      }

      state.data.orders = [...importedOrders, ...state.data.orders];
      const highestNumber = Math.max(0, ...state.data.orders.map((order) => Number(order.number) || 0));
      state.data.settings.nextOrderNumber = Math.max(Number(state.data.settings.nextOrderNumber || 1), highestNumber + 1);
      saveData();
      setView("orders");
      showToast(`${stats.orders} OS importada(s), ${stats.customers} cliente(s), ${stats.equipment} equipamento(s).`);
    } catch (error) {
      console.error(error);
      showToast("Arquivo JSON de OS invalido.");
    }
  };
  reader.readAsText(file);
}

function extractImportedOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (looksLikeImportedOrder(payload)) return [payload];

  const direct = valueByKeys(payload, [
    "orders",
    "ordens",
    "os",
    "oss",
    "serviceOrders",
    "service_orders",
    "ordensServico",
    "ordens_servico",
    "ordensDeServico",
    "ordens_de_servico",
  ]);

  if (Array.isArray(direct)) return direct;
  if (payload.data) return extractImportedOrders(payload.data);
  if (payload.result) return extractImportedOrders(payload.result);
  if (payload.results) return extractImportedOrders(payload.results);
  return [];
}

function looksLikeImportedOrder(payload) {
  return Boolean(
    valueByKeys(payload, ["number", "numero", "n_os", "num_os", "codigo"]) ||
      valueByKeys(payload, ["customer", "cliente", "client", "tomador", "solicitante"]) ||
      valueByKeys(payload, ["equipment", "equipamento", "printer", "impressora"]) ||
      valueByKeys(payload, ["issue", "defeito", "problema", "relato", "descricao"])
  );
}

function normalizeImportedOrder(record, usedNumbers, stats) {
  if (!record || typeof record !== "object") return null;

  const customer = ensureImportedCustomer(readImportedCustomer(record), stats);
  const equipment = ensureImportedEquipment(readImportedEquipment(record), customer.id, stats);
  const createdAt = parseImportedDate(valueByKeys(record, ["createdAt", "entrada", "dataEntrada", "data_entrada", "dataAbertura", "data_abertura", "abertura", "date"])) || todayISO();
  const deadline = parseImportedDate(valueByKeys(record, ["deadline", "prazo", "dataPrazo", "data_prazo", "previsao", "previsaoEntrega", "previsao_entrega"])) || createdAt;
  const scheduledAt = parseImportedDate(valueByKeys(record, ["scheduledAt", "agendamento", "dataAgendamento", "data_agendamento", "visita", "dataVisita", "data_visita"]));
  const issue = stringifyImport(valueByKeys(record, ["issue", "defeito", "problema", "relato", "reclamacao", "descricao", "description", "observacao", "observacoes"]));
  const title = stringifyImport(valueByKeys(record, ["title", "titulo", "resumo", "assunto", "servico", "tipoServico", "tipo_servico"])) || issue.slice(0, 70) || "OS importada";
  const parts = normalizeImportedParts(record, stats);
  const labor = parseImportedNumber(valueByKeys(record, ["labor", "maoDeObra", "mao_de_obra", "valorServico", "valor_servico", "servicoValor", "servico_valor", "valorMaoObra", "valor_mao_obra"]));
  const discount = parseImportedNumber(valueByKeys(record, ["discount", "desconto", "valorDesconto", "valor_desconto"]));
  const paid = parseImportedNumber(valueByKeys(record, ["paid", "pago", "valorPago", "valor_pago", "recebido", "valorRecebido", "valor_recebido"]));
  const number = nextImportedOrderNumber(valueByKeys(record, ["number", "numero", "n_os", "num_os", "os", "codigo", "id"]), usedNumbers);

  const order = {
    id: uid("os"),
    number,
    storeTag: stringifyImport(valueByKeys(record, ["storeTag", "tag", "etiqueta", "codigoEtiqueta", "codigo_etiqueta"])) || `TAG-${number}`,
    storeLocation: stringifyImport(valueByKeys(record, ["storeLocation", "local", "localLoja", "local_loja", "bancada", "prateleira"])),
    customerId: customer.id,
    equipmentId: equipment.id,
    title,
    issue,
    diagnosis: stringifyImport(valueByKeys(record, ["diagnosis", "diagnostico", "laudo", "analise", "avaliacao"])),
    solution: stringifyImport(valueByKeys(record, ["solution", "solucao", "servicoExecutado", "servico_executado", "procedimento", "reparo"])),
    status: mapImportedStatus(valueByKeys(record, ["status", "situacao", "etapa", "fase"])),
    priority: mapImportedPriority(valueByKeys(record, ["priority", "prioridade", "urgencia"])),
    technician: stringifyImport(valueByKeys(record, ["technician", "tecnico", "responsavel", "atendente"])),
    createdAt,
    deadline,
    scheduledAt,
    labor,
    discount,
    parts,
    paid,
    paymentStatus: "Pendente",
    warrantyDays: Number(valueByKeys(record, ["warrantyDays", "garantiaDias", "garantia_dias", "garantia"]) || state.data.settings.defaultWarranty || 90),
    partsReserved: false,
    history: [{ date: todayISO(), text: "OS importada de arquivo JSON." }],
  };

  order.paymentStatus = paymentStatus(order);
  stats.orders += 1;

  if (paid > 0) {
    const paidDate = parseImportedDate(valueByKeys(record, ["paidDate", "dataPagamento", "data_pagamento", "dataRecebimento", "data_recebimento"])) || createdAt;
    state.data.transactions.push({
      id: uid("tx"),
      type: "income",
      description: `Recebimento importado OS ${order.number} - ${customer.name}`,
      category: "Servicos importados",
      amount: paid,
      dueDate: paidDate,
      paidDate,
      status: "Pago",
      method: stringifyImport(valueByKeys(record, ["method", "formaPagamento", "forma_pagamento", "pagamento"])) || "Importado",
      orderId: order.id,
    });
    stats.income += 1;
  }

  return order;
}

function readImportedCustomer(record) {
  const source = valueByKeys(record, ["customer", "cliente", "client", "tomador", "solicitante"]);
  if (typeof source === "string") return { name: source };
  const customer = source && typeof source === "object" ? source : record;

  return {
    name:
      stringifyImport(valueByKeys(customer, ["name", "nome", "razaoSocial", "razao_social", "fantasia", "cliente"])) ||
      stringifyImport(valueByKeys(record, ["customerName", "customer_name", "clienteNome", "cliente_nome", "nomeCliente", "nome_cliente"])) ||
      "Cliente importado",
    type: stringifyImport(valueByKeys(customer, ["type", "tipo"])) || "Empresa",
    document: stringifyImport(valueByKeys(customer, ["document", "documento", "cpf", "cnpj", "cpfCnpj", "cpf_cnpj"])),
    phone: stringifyImport(valueByKeys(customer, ["phone", "telefone", "celular", "whatsapp"])),
    email: stringifyImport(valueByKeys(customer, ["email", "e_mail"])),
    address: stringifyImport(valueByKeys(customer, ["address", "endereco", "logradouro"])),
  };
}

function readImportedEquipment(record) {
  const source = valueByKeys(record, ["equipment", "equipamento", "printer", "impressora", "machine", "maquina"]);
  if (typeof source === "string") return { model: source };
  const equipment = source && typeof source === "object" ? source : record;

  return {
    brand: stringifyImport(valueByKeys(equipment, ["brand", "marca", "fabricante"])) || "Importado",
    model:
      stringifyImport(valueByKeys(equipment, ["model", "modelo", "equipamento", "impressora"])) ||
      stringifyImport(valueByKeys(record, ["equipmentModel", "equipment_model", "modeloEquipamento", "modelo_equipamento"])) ||
      "Equipamento importado",
    serial: stringifyImport(valueByKeys(equipment, ["serial", "serie", "numeroSerie", "numero_serie", "serialNumber", "serial_number"])),
    type: stringifyImport(valueByKeys(equipment, ["type", "tipo", "categoria"])),
    location: stringifyImport(valueByKeys(equipment, ["location", "local", "setor", "departamento"])),
    counter: parseImportedNumber(valueByKeys(equipment, ["counter", "contador", "pageCount", "page_count"])),
  };
}

function ensureImportedCustomer(customer, stats) {
  const document = normalizeDocument(customer.document);
  const existing = state.data.customers.find((item) => {
    const sameDocument = document && normalizeDocument(item.document) === document;
    const sameName = normalizeText(item.name) === normalizeText(customer.name);
    return sameDocument || sameName;
  });
  if (existing) return existing;

  const created = {
    id: uid("cus"),
    name: customer.name || "Cliente importado",
    type: customer.type || "Empresa",
    document: customer.document || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
    notes: "Criado automaticamente na importacao de OS.",
  };
  state.data.customers.push(created);
  stats.customers += 1;
  return created;
}

function ensureImportedEquipment(equipment, customerId, stats) {
  const serial = normalizeText(equipment.serial);
  const existing = state.data.equipment.find((item) => {
    const sameSerial = serial && normalizeText(item.serial) === serial;
    const sameModel = item.customerId === customerId && normalizeText(`${item.brand} ${item.model}`) === normalizeText(`${equipment.brand} ${equipment.model}`);
    return sameSerial || sameModel;
  });
  if (existing) return existing;

  const created = {
    id: uid("eq"),
    customerId,
    brand: equipment.brand || "Importado",
    model: equipment.model || "Equipamento importado",
    serial: equipment.serial || "",
    type: equipment.type || "",
    location: equipment.location || "",
    counter: Number(equipment.counter || 0),
  };
  state.data.equipment.push(created);
  stats.equipment += 1;
  return created;
}

function normalizeImportedParts(record, stats) {
  const rawParts = valueByKeys(record, ["parts", "pecas", "itens", "items", "produtos", "materiais", "suprimentos"]);
  if (!Array.isArray(rawParts)) return [];

  return rawParts
    .map((item) => {
      const source = typeof item === "object" && item ? item : { name: item };
      const name = stringifyImport(valueByKeys(source, ["name", "nome", "produto", "item", "descricao", "description"])) || "Item importado";
      const sku = stringifyImport(valueByKeys(source, ["sku", "codigo", "code", "referencia"]));
      const qty = Math.max(1, parseImportedNumber(valueByKeys(source, ["qty", "qtd", "quantidade", "quantity"])) || 1);
      const price = parseImportedNumber(valueByKeys(source, ["price", "preco", "valor", "unitario", "valorUnitario", "valor_unitario", "unitPrice", "unit_price"]));
      const part = ensureImportedPart({ name, sku, price }, stats);
      return { partId: part.id, qty, price: price || Number(part.price || 0) };
    })
    .filter((item) => item.partId);
}

function ensureImportedPart(importedPart, stats) {
  const sku = normalizeText(importedPart.sku);
  const existing = state.data.parts.find((part) => {
    const sameSku = sku && normalizeText(part.sku) === sku;
    const sameName = normalizeText(part.name) === normalizeText(importedPart.name);
    return sameSku || sameName;
  });
  if (existing) return existing;

  const created = {
    id: uid("part"),
    sku: importedPart.sku || `IMP-${state.data.parts.length + 1}`,
    name: importedPart.name || "Item importado",
    category: "Importado",
    stock: 0,
    minStock: 0,
    cost: 0,
    price: Number(importedPart.price || 0),
    supplier: "Importado por JSON",
  };
  state.data.parts.push(created);
  stats.parts += 1;
  return created;
}

function nextImportedOrderNumber(rawNumber, usedNumbers) {
  const preferred = Number(String(rawNumber || "").replace(/\D/g, ""));
  if (preferred && !usedNumbers.has(preferred)) {
    usedNumbers.add(preferred);
    return preferred;
  }

  let next = Number(state.data.settings.nextOrderNumber || 1);
  while (usedNumbers.has(next)) next += 1;
  usedNumbers.add(next);
  state.data.settings.nextOrderNumber = next + 1;
  return next;
}

function mapImportedStatus(value) {
  const status = normalizeText(value);
  if (status.includes("cancel")) return "Cancelada";
  if (status.includes("entreg") || status.includes("finaliz") || status.includes("conclu")) return "Entregue";
  if (status.includes("pronto")) return "Pronto";
  if (status.includes("reparo") || status.includes("execu") || status.includes("manutenc")) return "Em reparo";
  if (status.includes("aguard") || status.includes("aprov")) return "Aguardando aprovação";
  if (status.includes("orc")) return "Orçamento";
  if (status.includes("diagn")) return "Diagnóstico";
  return "Entrada";
}

function mapImportedPriority(value) {
  const priority = normalizeText(value);
  if (priority.includes("alta") || priority.includes("urgent")) return "Alta";
  if (priority.includes("baixa") || priority.includes("low")) return "Baixa";
  return "Média";
}

function valueByKeys(source, keys) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  const normalizedEntries = Object.entries(source).map(([key, value]) => [compactKey(key), value]);
  for (const key of keys) {
    const found = normalizedEntries.find(([normalizedKey]) => normalizedKey === compactKey(key));
    if (found && found[1] !== undefined && found[1] !== null) return found[1];
  }
  return "";
}

function compactKey(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function stringifyImport(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "";
  return String(value).trim();
}

function parseImportedNumber(value) {
  if (typeof value === "number") return value;
  const cleaned = stringifyImport(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  return Number(cleaned || 0);
}

function parseImportedDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return localDateISO(value);
  const text = stringifyImport(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function normalizeDocument(value) {
  return stringifyImport(value).replace(/\D/g, "");
}

function printOrder(orderId) {
  const order = state.data.orders.find((item) => item.id === orderId);
  if (!order) return;
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const equipment = state.data.equipment.find((item) => item.id === order.equipmentId);
  const serviceRows = orderServices(order)
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${Number(item.qty || 0)}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(Number(item.qty || 0) * Number(item.price || 0))}</td>
        </tr>
      `
    )
    .join("");
  const partsRows = (order.parts || [])
    .map((item) => {
      const part = partById(item.partId);
      return `
        <tr>
          <td>${escapeHtml(part?.name || "Peça removida")}</td>
          <td>${Number(item.qty || 0)}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(Number(item.qty || 0) * Number(item.price || 0))}</td>
        </tr>
      `;
    })
    .join("");
  const win = window.open("", "_blank", "width=900,height=720");
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>OS ${order.number} - Isprotec</title>
        <style>
          body { font-family: Arial, sans-serif; color: #16212c; margin: 28px; }
          .print-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 3px solid #18b9c3; padding-bottom: 16px; margin-bottom: 20px; }
          .print-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
          .print-logo { width: 64px; height: 64px; object-fit: contain; flex: none; }
          .print-meta { text-align: right; line-height: 1.4; }
          h1 { margin: 0; font-size: 28px; }
          h2 { margin: 24px 0 8px; font-size: 17px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #dbe5ec; padding: 8px; text-align: left; }
          th { background: #eef4f8; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .box { border: 1px solid #dbe5ec; padding: 12px; border-radius: 8px; }
          .total { text-align: right; font-size: 18px; font-weight: 700; }
          .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 42px; margin-top: 70px; }
          .line { border-top: 1px solid #16212c; text-align: center; padding-top: 8px; }
        </style>
      </head>
      <body>
        ${printBrandHeader(
          state.data.settings.companyName,
          `${state.data.settings.address} · ${state.data.settings.phone} · ${state.data.settings.email}`,
          `
            <div><strong>OS ${order.number}</strong></div>
            <div>Tag: ${escapeHtml(orderStoreTag(order))}</div>
            <div>Local: ${escapeHtml(order.storeLocation || "-")}</div>
            <div>Entrada: ${formatDate(order.createdAt)}</div>
            <div>Prazo: ${formatDate(order.deadline)}</div>
            <div>Status: ${escapeHtml(order.status)}</div>
          `
        )}
        <section class="grid">
          <div class="box">
            <h2>Cliente</h2>
            <p><strong>${escapeHtml(customer?.name || "")}</strong></p>
            <p>${escapeHtml(customer?.document || "")}</p>
            <p>${escapeHtml(customer?.phone || "")}</p>
            <p>${escapeHtml(customer?.address || "")}</p>
          </div>
          <div class="box">
            <h2>Equipamento</h2>
            <p><strong>${escapeHtml(equipment?.brand || "")} ${escapeHtml(equipment?.model || "")}</strong></p>
            <p>Série: ${escapeHtml(equipment?.serial || "")}</p>
            <p>Tipo: ${escapeHtml(equipment?.type || "")}</p>
            <p>Contador: ${Number(equipment?.counter || 0).toLocaleString("pt-BR")}</p>
          </div>
        </section>
        <h2>Relato e diagnóstico</h2>
        <p><strong>Defeito informado:</strong> ${escapeHtml(order.issue)}</p>
        <p><strong>Diagnóstico:</strong> ${escapeHtml(order.diagnosis)}</p>
        <p><strong>Solução:</strong> ${escapeHtml(order.solution)}</p>
        <h2>Valores</h2>
        <table>
          <thead><tr><th>Item</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead>
          <tbody>
            ${serviceRows}
            ${partsRows}
            <tr><td colspan="3">Desconto</td><td>${formatCurrency(order.discount)}</td></tr>
          </tbody>
        </table>
        <p class="total">Total: ${formatCurrency(orderTotal(order))}</p>
        <p class="total">Pago: ${formatCurrency(order.paid)} · Saldo: ${formatCurrency(balanceOfOrder(order))}</p>
        <p><strong>Garantia:</strong> ${Number(order.warrantyDays || 0)} dias para o serviço executado, conforme condições da assistência.</p>
        <div class="sign">
          <div class="line">Cliente</div>
          <div class="line">Isprotec</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

function printOrderTag(orderId) {
  const order = state.data.orders.find((item) => item.id === orderId);
  if (!order) return;
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const equipment = state.data.equipment.find((item) => item.id === order.equipmentId);
  const tag = orderStoreTag(order);
  const win = window.open("", "_blank", "width=520,height=420");
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Etiqueta ${tag}</title>
        <style>
          @page { size: 100mm 62mm; margin: 0; }
          * { box-sizing: border-box; }
          html, body { width: 100mm; height: 62mm; margin: 0; overflow: hidden; }
          body { font-family: Arial, sans-serif; color: #111; padding: 4mm; }
          .tag { border: 2px solid #111; padding: 4mm; width: 92mm; height: 54mm; overflow: hidden; }
          .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 2mm; margin-bottom: 2mm; gap: 2mm; }
          .brand { display: flex; align-items: center; gap: 2mm; min-width: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .brand img { width: 16mm; height: 16mm; object-fit: contain; flex: none; }
          .code { font-size: 27px; line-height: 1; font-weight: 900; letter-spacing: 0.5px; }
          .row { margin: 1.2mm 0; font-size: 11.5px; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .row strong { display: inline-block; min-width: 22mm; }
          .client-name { border-bottom: 1px solid #111; padding-bottom: 1mm; margin: 1.5mm 0 2mm; font-size: 18px; line-height: 1.05; font-weight: 900; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .equipment { font-size: 19px; line-height: 1.05; font-weight: 900; margin: 2mm 0; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .footer { display: flex; justify-content: space-between; border-top: 1px solid #111; margin-top: 2mm; padding-top: 2mm; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="tag">
          <div class="top">
            <div class="brand"><img src="${escapeHtml(companyLogoSrc())}" alt="Isprotec" /><span>Isprotec</span></div>
            <div class="code">${escapeHtml(tag)}</div>
          </div>
          <div class="row"><strong>OS:</strong> ${order.number}</div>
          <div class="client-name">${escapeHtml(customer?.name || "")}</div>
          <div class="equipment">${escapeHtml(equipment?.brand || "")} ${escapeHtml(equipment?.model || "")}</div>
          <div class="row"><strong>Serie:</strong> ${escapeHtml(equipment?.serial || "-")}</div>
          <div class="row"><strong>Telefone:</strong> ${escapeHtml(customer?.phone || "-")}</div>
          <div class="row"><strong>Local:</strong> ${escapeHtml(order.storeLocation || "-")}</div>
          <div class="footer">
            <span>Entrada: ${formatDate(order.createdAt)}</span>
            <span>Status: ${escapeHtml(order.status)}</span>
          </div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

function openReportPrint() {
  const month = state.reportMonth;
  const totals = financeTotals(month);
  const ordersInMonth = state.data.orders.filter((order) => monthOf(order.createdAt) === month);
  const delivered = ordersInMonth.filter((order) => order.status === "Entregue");
  const paidIncomeTransactions = paidTransactions("income", month);
  const paidOrderIncome = paidIncomeTransactions.filter((tx) => tx.orderId);
  const paidOrderIds = new Set(paidOrderIncome.map((tx) => tx.orderId));
  const paidOrderRevenue = paidOrderIncome.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const averagePaidTicket = paidOrderRevenue / Math.max(1, paidOrderIds.size);
  const margin = totals.income ? ((totals.income - totals.expense) / totals.income) * 100 : 0;

  const win = window.open("", "_blank", "width=1100,height=820");
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório - Isprotec</title>
        <style>
          body { font-family: Arial, sans-serif; color: #16212c; margin: 28px; }
          .print-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 3px solid #18b9c3; padding-bottom: 16px; margin-bottom: 20px; }
          .print-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
          .print-logo { width: 64px; height: 64px; object-fit: contain; flex: none; }
          .print-meta { text-align: right; line-height: 1.45; }
          h1 { margin: 0; font-size: 28px; }
          h2 { margin: 24px 0 10px; font-size: 18px; }
          p { margin: 4px 0; }
          .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
          .metric-card { min-height: 118px; padding: 14px; border: 1px solid #dbe5ec; border-radius: 8px; background: #fff; }
          .metric-card small { display: block; color: #627282; font-weight: 700; }
          .metric-card strong { display: block; margin-top: 10px; font-size: 26px; }
          .metric-card em { display: block; margin-top: 8px; color: #627282; font-style: normal; }
          .accent-cyan { border-top: 4px solid #18b9c3; }
          .accent-blue { border-top: 4px solid #256edb; }
          .accent-magenta { border-top: 4px solid #e1008e; }
          .accent-yellow { border-top: 4px solid #f6c311; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
          .panel { border: 1px solid #dbe5ec; border-radius: 8px; padding: 16px; background: #fff; }
          .chart { display: grid; gap: 10px; }
          .print-note { margin-top: 18px; color: #627282; font-size: 12px; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        ${printBrandHeader(
          state.data.settings.companyName,
          `${state.data.settings.address} · ${state.data.settings.phone} · ${state.data.settings.email}`,
          `<div><strong>Relatório mensal</strong></div><div>Mês: ${escapeHtml(month)}</div>`
        )}
        <div class="grid-4">
          <article class="metric-card accent-cyan">
            <small>OS abertas no mês</small>
            <strong>${ordersInMonth.length}</strong>
            <em>${delivered.length} entregue(s)</em>
          </article>
          <article class="metric-card accent-blue">
            <small>Ticket médio pago</small>
            <strong>${formatCurrency(averagePaidTicket)}</strong>
            <em>${paidOrderIds.size} OS com recebimento pago</em>
          </article>
          <article class="metric-card accent-magenta">
            <small>Margem do caixa</small>
            <strong>${margin.toFixed(1)}%</strong>
            <em>Recebido x despesas pagas</em>
          </article>
          <article class="metric-card accent-yellow">
            <small>Lucro realizado</small>
            <strong>${formatCurrency(totals.income - totals.expense)}</strong>
            <em>No mês selecionado</em>
          </article>
        </div>
        <div class="grid-2">
          <section class="panel">
            <h2>Receita paga por categoria</h2>
            <div class="chart">${renderCategoryChart("income", month)}</div>
          </section>
          <section class="panel">
            <h2>Despesas pagas por categoria</h2>
            <div class="chart">${renderCategoryChart("expense", month)}</div>
          </section>
        </div>
        <section class="panel">
          <h2>Etapas das OS</h2>
          <div class="chart">${renderStatusChart()}</div>
        </section>
        <p class="print-note">Relatório gerado em ${new Date().toLocaleString("pt-BR")}.</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

function printReport() {
  openReportPrint();
}

function pixClean(value, maxLength) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.@+-]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function pixField(id, value) {
  const text = String(value || "");
  return id + String(text.length).padStart(2, "0") + text;
}

function pixCrc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildPixPayload(amount, txId = "") {
  const settings = state.data.settings || {};
  const key = String(settings.pixKey || "").trim();
  if (!key) return "";
  const merchantAccount = pixField("00", "br.gov.bcb.pix") + pixField("01", key);
  const tx = pixClean(txId || "***", 25) || "***";
  const base =
    pixField("00", "01") +
    pixField("26", merchantAccount) +
    pixField("52", "0000") +
    pixField("53", "986") +
    pixField("54", Number(amount || 0).toFixed(2)) +
    pixField("58", "BR") +
    pixField("59", pixClean(settings.pixName || settings.companyName || "ISPROTEC", 25)) +
    pixField("60", pixClean(settings.pixCity || "TRINDADE", 15)) +
    pixField("62", pixField("05", tx));
  const withCrc = base + "6304";
  return withCrc + pixCrc16(withCrc);
}

function pixQrUrl(payload) {
  if (!payload) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=170x170&margin=8&data=${encodeURIComponent(payload)}`;
}

function printBrandHeader(companyName, subtitle = "", extraHtml = "") {
  return `
    <header class="print-header">
      <div class="print-brand">
        <img src="${escapeHtml(companyLogoSrc())}" alt="Isprotec" class="print-logo" />
        <div>
          <h1>${escapeHtml(companyName)}</h1>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
      </div>
      ${extraHtml ? `<div class="print-meta">${extraHtml}</div>` : ""}
    </header>
  `;
}

function printReceiptForOrder(orderId) {
  const order = state.data.orders.find((item) => item.id === orderId);
  if (!order) return;
  if (Number(order.paid || 0) <= 0) {
    showToast("Esta OS ainda nao tem pagamento registrado.");
    return;
  }

  const payments = state.data.transactions
    .filter((tx) => tx.type === "income" && tx.orderId === order.id && tx.status === "Pago")
    .sort((a, b) => String(b.paidDate || b.dueDate || "").localeCompare(String(a.paidDate || a.dueDate || "")));
  const lastPayment = payments[0];
  openReceiptPrint(
    order,
    Number(lastPayment?.amount || order.paid || orderTotal(order)),
    lastPayment?.paidDate || lastPayment?.dueDate || todayISO(),
    lastPayment?.method || "Pix"
  );
}

function openReceiptPrint(order, amount, paidDate, method) {
  const customer = state.data.customers.find((item) => item.id === order.customerId);
  const equipment = state.data.equipment.find((item) => item.id === order.equipmentId);
  const balance = balanceOfOrder(order);
  const settings = state.data.settings || {};
  const pixPayload = buildPixPayload(amount, `OS${order.number}`);
  const qrUrl = pixQrUrl(pixPayload);
  const win = window.open("", "_blank", "width=820,height=680");
  if (!win) {
    showToast("O navegador bloqueou a janela do recibo. Permita pop-ups para este sistema.");
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Recibo OS ${order.number} - Isprotec</title>
        <style>
          body { font-family: Arial, sans-serif; color: #16212c; margin: 28px; }
          .print-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 3px solid #18b9c3; padding-bottom: 16px; margin-bottom: 20px; }
          .print-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
          .print-logo { width: 64px; height: 64px; object-fit: contain; flex: none; }
          h1 { margin: 0; font-size: 26px; }
          h2 { margin: 0 0 10px; font-size: 17px; }
          p { margin: 4px 0; }
          .print-meta { text-align: right; font-size: 14px; line-height: 1.45; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .box { border: 1px solid #dbe5ec; padding: 12px; border-radius: 8px; }
          .summary { margin-top: 18px; border: 1px solid #dbe5ec; border-radius: 8px; padding: 14px; background: #f8fbfd; }
          .summary strong { display: inline-block; min-width: 170px; }
          .payment-box { margin-top: 18px; display: grid; grid-template-columns: 1fr 190px; gap: 16px; border: 1px solid #dbe5ec; border-radius: 8px; padding: 14px; }
          .payment-box pre { white-space: pre-wrap; font-family: Arial, sans-serif; margin: 6px 0 0; color: #44515f; }
          .qr { text-align: center; }
          .qr img { width: 170px; height: 170px; border: 1px solid #dbe5ec; border-radius: 8px; }
          .pix-copy { margin-top: 10px; padding: 10px; border: 1px dashed #9fb0bd; border-radius: 8px; font-size: 10px; line-break: anywhere; word-break: break-all; color: #44515f; }
          .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .line { border-top: 1px solid #16212c; text-align: center; padding-top: 8px; }
          @media print { .payment-box { break-inside: avoid; } }
        </style>
      </head>
      <body>
        ${printBrandHeader(
          state.data.settings.companyName,
          state.data.settings.address,
          `
            <div><strong>Recibo OS ${order.number}</strong></div>
            <div>Data: ${formatDate(paidDate)}</div>
          `
        )}
        <section class="grid">
          <div class="box">
            <h2>Cliente</h2>
            <p><strong>${escapeHtml(customer?.name || "")}</strong></p>
            <p>${escapeHtml(customer?.document || "")}</p>
            <p>${escapeHtml(customer?.phone || "")}</p>
            <p>${escapeHtml(customer?.address || "")}</p>
          </div>
          <div class="box">
            <h2>Equipamento</h2>
            <p><strong>${escapeHtml(equipment?.brand || "")} ${escapeHtml(equipment?.model || "")}</strong></p>
            <p>Série: ${escapeHtml(equipment?.serial || "")}</p>
            <p>Tipo: ${escapeHtml(equipment?.type || "")}</p>
            <p>OS: ${order.number}</p>
          </div>
        </section>
        <section class="summary">
          <p><strong>Valor recebido:</strong> ${formatCurrency(amount)}</p>
          <p><strong>Forma de pagamento:</strong> ${escapeHtml(method)}</p>
          <p><strong>Saldo restante:</strong> ${formatCurrency(balance)}</p>
          <p><strong>Status financeiro:</strong> ${escapeHtml(order.paymentStatus)}</p>
        </section>
        <section class="payment-box">
          <div>
            <h2>Dados para pagamento</h2>
            <p><strong>Chave Pix:</strong> ${escapeHtml(settings.pixKey || "Nao informada")}</p>
            <p><strong>Favorecido:</strong> ${escapeHtml(settings.pixName || settings.companyName || "")}</p>
            ${settings.bankInfo ? `<pre>${escapeHtml(settings.bankInfo)}</pre>` : `<p>Conta bancaria nao informada.</p>`}
            ${pixPayload ? `<div class="pix-copy"><strong>Pix copia e cola:</strong><br>${escapeHtml(pixPayload)}</div>` : ""}
          </div>
          <div class="qr">
            ${qrUrl ? `<img src="${qrUrl}" alt="QR Code Pix" />` : `<p>Cadastre a chave Pix nas configuracoes para gerar o QR Code.</p>`}
          </div>
        </section>
        <div class="footer">
          <div class="line">Cliente</div>
          <div class="line">Isprotec</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const { action, id } = actionElement.dataset;
  const actions = {
    "view-orders": () => setView("orders"),
    logout,
    "new-order": () => openOrderModal(),
    "edit-order": () => openOrderModal(id),
    "print-order": () => printOrder(id),
    "print-receipt": () => printReceiptForOrder(id),
    "whatsapp-order": () => openOrderWhatsApp(id),
    "print-tag": () => printOrderTag(id),
    "receive-order": () => openReceiveOrderModal(id),
    "delete-selected-orders": deleteSelectedOrders,
    "new-customer": () => openCustomerModal(),
    "edit-customer": () => openCustomerModal(id),
    "delete-selected-customers": deleteSelectedCustomers,
    "new-equipment": () => openEquipmentModal(),
    "edit-equipment": () => openEquipmentModal(id),
    "delete-selected-equipment": deleteSelectedEquipment,
    "new-user": () => openUserModal(),
    "edit-user": () => openUserModal(id),
    "delete-selected-users": deleteSelectedUsers,
    "new-part": () => openPartModal(),
    "edit-part": () => openPartModal(id),
    "delete-selected-parts": deleteSelectedParts,
    "new-product": () => openProductModal(),
    "edit-product": () => openProductModal(id),
    "delete-selected-products": deleteSelectedProducts,
    "stock-in": () => openStockInModal(id),
    "new-cash": () => openCashModal(),
    "edit-cash": () => openCashModal(id),
    "pay-cash": () => payTransaction(id),
    "delete-selected-transactions": deleteSelectedTransactions,
    "export-data": exportData,
    "import-data": () => dom.importDataInput.click(),
    "import-orders": () => dom.importOrdersInput.click(),
    "reset-company-logo": resetCompanyLogo,
    "seed-demo": () => {
      state.data = seedData();
      saveData();
      state.currentUserId = state.data.users[0]?.id || "";
      if (state.currentUserId) localStorage.setItem(SESSION_KEY, state.currentUserId);
      if (renderAuthState()) render();
      showToast("Dados de exemplo recriados.");
    },
    "print-report": printReport,
    "add-part-row": addPartRow,
    "add-service-row": () => addServiceRow(),
    "toggle-inline-customer": () => toggleInlinePanel("quickCustomerPanel", "#quickCustomerName"),
    "toggle-inline-equipment": () => {
      if (!document.getElementById("orderCustomerSelect")?.value) {
        showToast("Selecione ou cadastre um cliente primeiro.");
        return;
      }
      toggleInlinePanel("quickEquipmentPanel", "#quickEquipmentBrand");
    },
    "toggle-inline-technician": () => toggleInlinePanel("quickTechnicianPanel", "#quickTechnicianName"),
    "toggle-inline-service": toggleQuickServicePanel,
    "save-inline-customer": saveInlineCustomer,
    "save-inline-equipment": saveInlineEquipment,
    "save-inline-technician": saveInlineTechnician,
    "save-inline-service": saveInlineService,
    "edit-service-row": () => editServiceFromRow(actionElement.closest("[data-service-row]")),
    "remove-service-row": () => {
      actionElement.closest("[data-service-row]")?.remove();
      updateOrderTotalPreview();
    },
    "remove-part-row": () => {
      actionElement.closest("[data-part-row]")?.remove();
      updateOrderTotalPreview();
    },
  };
  actions[action]?.();
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const handlers = {
    loginForm: handleLoginForm,
    orderForm: saveOrderFromForm,
    customerForm: saveCustomer,
    equipmentForm: saveEquipment,
    userForm: saveUser,
    partForm: savePart,
    productForm: saveProduct,
    stockInForm: saveStockIn,
    cashForm: saveCash,
    receiveOrderForm: saveReceiveOrder,
    settingsForm: saveSettings,
  };
  handlers[form.id]?.(form);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "globalSearch") {
    state.search = event.target.value;
    render();
  }
  if (event.target.id === "financeMonth") {
    state.financeMonth = event.target.value;
    renderFinance();
  }
  if (event.target.id === "reportMonth") {
    state.reportMonth = event.target.value;
    renderReports();
  }
  if (event.target.closest("#orderForm")) updateOrderTotalPreview();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "companyLogoInput") {
    previewCompanyLogo(event.target);
  }
  if (event.target.id === "productImageInput") {
    previewProductImage(event.target);
  }
  if (event.target.id === "selectAllOrders") {
    toggleVisibleOrdersSelection(event.target.checked);
  }
  if (event.target.id === "selectAllScheduledOrders") {
    state.data.orders
      .filter((order) => order.scheduledAt && !["Entregue", "Cancelada"].includes(order.status))
      .forEach((order) => {
        if (event.target.checked) state.selectedOrderIds.add(order.id);
        else state.selectedOrderIds.delete(order.id);
      });
    renderSchedule();
  }
  if (event.target.matches("[data-order-select]")) {
    if (event.target.checked) state.selectedOrderIds.add(event.target.value);
    else state.selectedOrderIds.delete(event.target.value);
    render();
  }
  if (event.target.id === "selectAllCustomers") {
    toggleSelectionSet(state.selectedCustomerIds, state.data.customers, event.target.checked);
    renderCustomers();
  }
  if (event.target.matches("[data-customer-select]")) {
    if (event.target.checked) state.selectedCustomerIds.add(event.target.value);
    else state.selectedCustomerIds.delete(event.target.value);
    renderCustomers();
  }
  if (event.target.id === "selectAllEquipment") {
    toggleSelectionSet(state.selectedEquipmentIds, state.data.equipment, event.target.checked);
    renderCustomers();
  }
  if (event.target.matches("[data-equipment-select]")) {
    if (event.target.checked) state.selectedEquipmentIds.add(event.target.value);
    else state.selectedEquipmentIds.delete(event.target.value);
    renderCustomers();
  }
  if (event.target.id === "selectAllUsers") {
    toggleSelectionSet(state.selectedUserIds, state.data.users, event.target.checked);
    renderSettings();
  }
  if (event.target.matches("[data-user-select]")) {
    if (event.target.checked) state.selectedUserIds.add(event.target.value);
    else state.selectedUserIds.delete(event.target.value);
    renderSettings();
  }
  if (event.target.id === "selectAllParts") {
    toggleSelectionSet(state.selectedPartIds, state.data.parts, event.target.checked);
    renderInventory();
  }
  if (event.target.matches("[data-stock-part-select]")) {
    if (event.target.checked) state.selectedPartIds.add(event.target.value);
    else state.selectedPartIds.delete(event.target.value);
    renderInventory();
  }
  if (event.target.id === "selectAllProducts") {
    toggleSelectionSet(state.selectedProductIds, state.data.products, event.target.checked);
    renderProducts();
  }
  if (event.target.matches("[data-product-select]")) {
    if (event.target.checked) state.selectedProductIds.add(event.target.value);
    else state.selectedProductIds.delete(event.target.value);
    renderProducts();
  }
  if (event.target.id === "selectAllTransactions") {
    toggleSelectionSet(state.selectedTransactionIds, currentMonthTransactions(), event.target.checked);
    renderFinance();
  }
  if (event.target.matches("[data-transaction-select]")) {
    if (event.target.checked) state.selectedTransactionIds.add(event.target.value);
    else state.selectedTransactionIds.delete(event.target.value);
    renderFinance();
  }
  if (event.target.id === "orderStatusFilter") {
    state.orderFilter = event.target.value;
    renderOrders();
  }
  if (event.target.id === "orderCustomerSelect") {
    refreshOrderEquipmentSelect(event.target.value);
  }
  if (event.target.matches("[data-part-id]")) {
    const part = partById(event.target.value);
    const row = event.target.closest("[data-part-row]");
    if (part && row) row.querySelector("[data-part-price]").value = Number(part.price || 0);
    updateOrderTotalPreview();
  }
  if (event.target.matches("[data-service-id]")) {
    const service = serviceById(event.target.value);
    const row = event.target.closest("[data-service-row]");
    if (service && row) {
      row.querySelector("[data-service-name]").value = service.name;
      row.querySelector("[data-service-cost]").value = Number(service.cost || 0);
      row.querySelector("[data-service-price]").value = Number(service.price || 0);
    } else if (row) {
      row.querySelector("[data-service-name]").value = "";
    }
    updateOrderTotalPreview();
  }
  if (event.target.id === "importDataInput" && event.target.files[0]) {
    importData(event.target.files[0]);
    event.target.value = "";
  }
  if (event.target.id === "importOrdersInput" && event.target.files[0]) {
    importOrders(event.target.files[0]);
    event.target.value = "";
  }
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.getElementById("newOrderBtn").addEventListener("click", () => openOrderModal());
document.getElementById("exportDataBtn").addEventListener("click", exportData);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
dom.modalBackdrop.addEventListener("click", (event) => {
  if (event.target === dom.modalBackdrop) closeModal();
});

initApp().catch((error) => {
  console.error(error);
  dom.appShell.hidden = true;
  dom.loginScreen.hidden = false;
  showToast("Erro ao iniciar o sistema.");
});
