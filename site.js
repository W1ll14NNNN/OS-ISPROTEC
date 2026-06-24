const trackForm = document.getElementById("trackOrderForm");
const trackResult = document.getElementById("trackOrderResult");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentFeedback = document.getElementById("appointmentFeedback");
const productOrderForm = document.getElementById("productOrderForm");
const productFeedback = document.getElementById("productFeedback");
const productName = document.getElementById("productName");
const productQuantity = document.getElementById("productQuantity");
const productRequestType = document.getElementById("productRequestType");

let trackedCredentials = null;

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function showTrackResult(message, tone = "neutral") {
  trackResult.hidden = false;
  trackResult.dataset.tone = tone;
  trackResult.innerHTML = message;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return { message: "O serviço não retornou uma resposta. Atualize a publicação e tente novamente." };
  try {
    return JSON.parse(text);
  } catch {
    return { message: "O serviço retornou um erro inesperado (" + response.status + ")." };
  }
}

function renderQuoteItems(items) {
  if (!items?.length) return "<li>Nenhum item informado.</li>";
  return items.map((item) => "<li><span>" + escapeHtml(item.qty) + "x " + escapeHtml(item.name) + "</span><strong>" + money(item.total) + "</strong></li>").join("");
}

function renderTrackedOrder(order) {
  const quote = order.quote || {};
  const approvalActions = order.canRespond
    ? "<div class=\"approval-actions\"><p>O orçamento está aguardando sua resposta.</p><button class=\"button primary\" type=\"button\" data-approval=\"approve\">Aprovar orçamento</button><button class=\"button danger\" type=\"button\" data-approval=\"reject\">Não aprovar</button></div>"
    : "";

  return "<strong>OS " + escapeHtml(order.number) + " - " + escapeHtml(order.status) + "</strong>" +
    "<span>Equipamento: " + escapeHtml(order.equipment) + "</span>" +
    "<span>Prazo: " + escapeHtml(order.deadline) + "</span>" +
    "<span>Atualização: " + escapeHtml(order.lastUpdate) + "</span>" +
    "<div class=\"technical-summary\"><h3>Informações técnicas</h3><p><strong>Defeito:</strong> " + escapeHtml(order.issue) + "</p><p><strong>Diagnóstico:</strong> " + escapeHtml(order.diagnosis) + "</p><p><strong>Solução:</strong> " + escapeHtml(order.solution) + "</p></div>" +
    "<div class=\"quote-summary\"><h3>Orçamento</h3><div><h4>Serviços</h4><ul>" + renderQuoteItems(quote.services) + "</ul></div><div><h4>Peças</h4><ul>" + renderQuoteItems(quote.parts) + "</ul></div><p class=\"quote-total\">Mão de obra: " + money(quote.labor) + "<br>Peças: " + money(quote.partsTotal) + "<br>Desconto: " + money(quote.discount) + "<br><strong>Total: " + money(quote.total) + "</strong></p></div>" +
    approvalActions;
}

async function trackOrder(payload) {
  showTrackResult("Consultando sua ordem de serviço...", "neutral");
  const response = await fetch("/api/track-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.message || "Não foi possível localizar a OS.");
  trackedCredentials = payload;
  showTrackResult(renderTrackedOrder(data.order), "success");
}

trackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(trackForm);
  const payload = {
    orderNumber: formData.get("orderNumber"),
    phone: digitsOnly(formData.get("phone")),
  };

  try {
    await trackOrder(payload);
  } catch (error) {
    showTrackResult(error.message || "Não foi possível localizar a OS.", "error");
  }
});

trackResult?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-approval]");
  if (!button || !trackedCredentials) return;

  const decision = button.dataset.approval;
  const question = decision === "approve"
    ? "Confirma a aprovação deste orçamento?"
    : "Confirma que não aprova este orçamento? A OS será cancelada.";
  if (!window.confirm(question)) return;

  trackResult.querySelectorAll("button").forEach((item) => { item.disabled = true; });
  try {
    const response = await fetch("/api/respond-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...trackedCredentials, decision }),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || "Não foi possível registrar sua decisão.");
    showTrackResult("<strong>OS " + escapeHtml(data.order.number) + " - " + escapeHtml(data.order.status) + "</strong><span>" + escapeHtml(data.order.message) + "</span>", "success");
  } catch (error) {
    showTrackResult(error.message || "Não foi possível registrar sua decisão.", "error");
  }
});

appointmentForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = appointmentForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(appointmentForm).entries());
  payload.phone = digitsOnly(payload.phone);

  submitButton.disabled = true;
  appointmentFeedback.textContent = "Enviando sua solicitação...";
  try {
    const response = await fetch("/api/request-appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || "Não foi possível enviar o agendamento.");

    appointmentForm.reset();
    appointmentFeedback.textContent = "Solicitação recebida. Sua OS é " + data.orderNumber + ". A equipe confirmará pelo WhatsApp.";
  } catch (error) {
    appointmentFeedback.textContent = error.message || "Não foi possível enviar. Chame a ISPROTEC pelo WhatsApp.";
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll("[data-product-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    if (productName) productName.value = button.dataset.productPreset || "";
    if (productQuantity) productQuantity.value = "1";
    if (productRequestType) productRequestType.value = button.dataset.requestMode || "budget";
    productOrderForm?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

productOrderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = productOrderForm.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(productOrderForm).entries());
  payload.phone = digitsOnly(payload.phone);
  payload.quantity = Number(payload.quantity || 1);

  submitButton.disabled = true;
  productFeedback.textContent = payload.requestType === "payment" ? "Preparando seu pedido para pagamento..." : "Enviando seu pedido para orçamento...";

  try {
    const response = await fetch("/api/product-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.message || "Não foi possível registrar o pedido.");

    productOrderForm.reset();
    productQuantity.value = "1";
    productRequestType.value = "budget";
    productFeedback.textContent = data.message || "Pedido enviado com sucesso.";
  } catch (error) {
    productFeedback.textContent = error.message || "Não foi possível registrar o pedido.";
  } finally {
    submitButton.disabled = false;
  }
});
