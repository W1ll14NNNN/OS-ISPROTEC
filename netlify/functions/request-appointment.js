import { digitsOnly, json, loadState, saveState } from "./_supabase.js";

const safeText = (value, limit = 240) => String(value || "").trim().slice(0, limit);
const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => prefix + "-web-" + Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { message: "Método não permitido." });

  try {
    const body = JSON.parse(event.body || "{}");
    const name = safeText(body.name, 120);
    const phone = digitsOnly(body.phone);
    const brand = safeText(body.brand, 80);
    const model = safeText(body.model, 120);
    const address = safeText(body.address, 240);
    const issue = safeText(body.issue, 1200);
    const preferredDate = safeText(body.preferredDate, 10);

    if (!name || phone.length < 10 || !brand || !model || !address || !issue || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return json(400, { message: "Preencha todos os campos obrigatórios do agendamento." });
    }

    const state = await loadState();
    state.customers = state.customers || [];
    state.equipment = state.equipment || [];
    state.orders = state.orders || [];
    state.settings = state.settings || {};

    let customer = state.customers.find((item) => digitsOnly(item.phone).slice(-11) === phone.slice(-11));
    if (!customer) {
      customer = { id: uid("cus"), name, type: "Pessoa física", document: "", phone, email: safeText(body.email, 160), address, notes: "Cliente criado por agendamento no site." };
      state.customers.push(customer);
    } else {
      customer.name = name || customer.name;
      customer.phone = phone || customer.phone;
      customer.email = safeText(body.email, 160) || customer.email;
      customer.address = address || customer.address;
    }

    let equipment = state.equipment.find((item) => item.customerId === customer.id && item.brand === brand && item.model === model);
    if (!equipment) {
      equipment = { id: uid("eq"), customerId: customer.id, brand, model, serial: "", type: "Impressora", location: address, counter: 0 };
      state.equipment.push(equipment);
    }

    const highestNumber = Math.max(0, ...state.orders.map((item) => Number(item.number) || 0));
    const number = Math.max(Number(state.settings.nextOrderNumber || 1), highestNumber + 1);
    const createdAt = today();
    state.orders.unshift({
      id: uid("os"), number, customerId: customer.id, equipmentId: equipment.id, title: "Agendamento pelo site", issue,
      diagnosis: "", solution: "", status: "Entrada", priority: "Média", technician: "", createdAt, deadline: preferredDate,
      scheduledAt: preferredDate, labor: 0, discount: 0, parts: [], services: [], paid: 0, paymentStatus: "Pendente",
      warrantyDays: Number(state.settings.defaultWarranty || 90), partsReserved: false, storeTag: "WEB-" + number,
      storeLocation: "Agendamento online", history: [{ date: createdAt, text: "Agendamento solicitado pelo site." }],
    });
    state.settings.nextOrderNumber = number + 1;

    await saveState(state);
    return json(201, { orderNumber: number });
  } catch (error) {
    return json(500, { message: error.message || "Não foi possível registrar o agendamento." });
  }
};
