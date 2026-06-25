import { loadState, sendJson } from "./_supabase.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, 405, { message: "Metodo nao permitido." });
  response.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const state = await loadState();
    const products = (state.products || [])
      .filter((product) => product.active !== false)
      .map((product) => ({
        id: product.id,
        sku: product.sku || "",
        name: product.name || "",
        category: product.category || "",
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        image: product.image || "assets/isprotec-products.png",
        description: product.description || "",
      }));

    return sendJson(response, 200, { products });
  } catch (error) {
    return sendJson(response, 500, { message: error.message || "Nao foi possivel carregar os produtos." });
  }
}
