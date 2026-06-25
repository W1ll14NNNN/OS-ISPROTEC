import { digitsOnly, loadState, requestBody, saveState, sendJson } from "./_supabase.js";

const safeText = (value, limit = 240) => String(value || "").trim().slice(0, limit);
const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => prefix + "-web-" + Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);

const productCatalog = {
  "Impressoras": { sku: "WEB-IMP", price: 899 },
  "Toners e cartuchos": { sku: "WEB-TON", price: 69 },
  "Refis de tinta": { sku: "WEB-REF", price: 39 },
  "Peças e acessórios": { sku: "WEB-PEC", price: 0 },
};

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { message: "Método não permitido." });

  try {
    const body = requestBody(request);
    const name = safeText(body.name, 120);
    const phone = digitsOnly(body.phone);
    const email = safeText(body.email, 160);
    const product = safeText(body.product, 120);
    const quantity = Math.max(1, Number(body.quantity || 1));
    const requestType = body.requestType === "payment" ? "payment" : "budget";
    const notes = safeText(body.notes, 800);

    if (!name || phone.length < 10 || !product || !quantity) {
      return sendJson(response, 400, { message: "Preencha nome, telefone, produto e quantidade." });
    }

    const state = await loadState();
    state.customers = state.customers || [];
    state.equipment = state.equipment || [];
    state.orders = state.orders || [];
    state.products = state.products || [];
    state.settings = state.settings || {};

    let customer = state.customers.find((item) => digitsOnly(item.phone).slice(-11) === phone.slice(-11));
    if (!customer) {
      customer = { id: uid("cus"), name, type: "Pessoa física", document: "", phone, email, address: "", notes: "Cliente criado por pedido de produto no site." };
      state.customers.push(customer);
    } else {
      customer.name = name || customer.name;
      customer.phone = phone || customer.phone;
      customer.email = email || customer.email;
    }

    let equipment = state.equipment.find((item) => item.customerId === customer.id && item.type === "Pedido de produto");
    if (!equipment) {
      equipment = { id: uid("eq"), customerId: customer.id, brand: "ISPROTEC", model: "Pedido de produto", serial: "", type: "Pedido de produto", location: "Venda online", counter: 0 };
      state.equipment.push(equipment);
    }

    const highestNumber = Math.max(0, ...state.orders.map((item) => Number(item.number) || 0));
    const number = Math.max(Number(state.settings.nextOrderNumber || 1), highestNumber + 1);
    const createdAt = today();
    const systemProduct = state.products.find((item) => item.id === body.productId || item.name === product);
    const catalog = systemProduct || productCatalog[product] || { sku: "WEB-OUT", price: 0 };
    const price = Number(catalog.price || 0);
    state.orders.unshift({
      id: uid("os"),
      number,
      customerId: customer.id,
      equipmentId: equipment.id,
      title: "Pedido de produto",
      issue: "Pedido online: " + product + (notes ? " - " + notes : ""),
      diagnosis: "",
      solution: "",
      status: requestType === "payment" ? "Entrada" : "Orçamento",
      priority: "Média",
      technician: "",
      createdAt,
      deadline: createdAt,
      scheduledAt: "",
      labor: 0,
      discount: 0,
      parts: [{ partId: "", qty: quantity, price }],
      paid: 0,
      paymentStatus: "Pendente",
      warrantyDays: Number(state.settings.defaultWarranty || 90),
      partsReserved: false,
      storeTag: "WEB-PROD-" + number,
      storeLocation: requestType === "payment" ? "Pedido com pagamento" : "Pedido por orçamento",
      history: [{ date: createdAt, text: requestType === "payment" ? "Pedido de produto enviado para pagamento." : "Pedido de produto enviado para orçamento." }],
      requestType,
      productRequest: { product, quantity, sku: catalog.sku || "", price, notes, productId: systemProduct?.id || "" },
    });
    state.settings.nextOrderNumber = number + 1;

    await saveState(state);
    return sendJson(response, 201, {
      orderNumber: number,
      message: requestType === "payment"
        ? "Pedido registrado. A equipe vai confirmar o pagamento e finalizar o atendimento."
        : "Pedido registrado. A equipe vai enviar o orçamento.",
    });
  } catch (error) {
    return sendJson(response, 500, { message: error.message || "Não foi possível registrar o pedido." });
  }
}
