import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { addToCart, getErrorMessage, getProducts } from "../api";
import type { Product } from "../types";

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getProducts()
      .then((res) => {
        setProducts(res.data);
        // default select first subscription plan for each product
        const defaults: Record<number, number> = {};
        res.data.forEach((p) => {
          if (p.subscriptions.length > 0) defaults[p.id] = p.subscriptions[0].durationMonths;
        });
        setSelectedPlans(defaults);
      })
      .catch(() => setLoadError("Failed to load products."))
      .finally(() => setLoading(false));
  }, []);

  const onAdd = async (productId: number) => {
    const durationMonths = selectedPlans[productId];
    if (!durationMonths) return;
    setMsg(null);
    try {
      const res = await addToCart(productId, durationMonths);
      setMsg({ text: res.message ?? "Item added to cart.", type: "success" });
    } catch (e) {
      setMsg({ text: getErrorMessage(e, "Failed to add item"), type: "error" });
    }
  };

  if (loading) return <p className="section-subtitle">Loading products...</p>;
  if (loadError) return <p className="section-subtitle">{loadError}</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Package size={20} className="text-blue-300" />
        <h2 className="section-title">Products</h2>
      </div>

      {msg && (
        <p className={`text-sm ${msg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {products.map((product) => {
          const selectedDuration = selectedPlans[product.id];
          const selectedSub = product.subscriptions.find((s) => s.durationMonths === selectedDuration);

          return (
            <Card key={product.id} className="border border-slate-800 bg-slate-900/70">
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{product.title}</h3>
                    <p className="text-sm text-slate-400">{product.shortDescription}</p>
                  </div>
                  <Chip variant="flat" color="primary" size="sm" className="shrink-0">
                    ৳{product.price}
                  </Chip>
                </div>

                {/* Subscription plan selector */}
                {product.subscriptions.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Choose Plan</p>
                      <div className="flex flex-wrap gap-2">
                        {product.subscriptions.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedPlans((prev) => ({ ...prev, [product.id]: s.durationMonths }))}
                            className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                              selectedDuration === s.durationMonths
                                ? "border-blue-500 bg-blue-500/20 text-white"
                                : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-500"
                            }`}>
                            <span className="font-medium">{s.durationMonths} months</span>
                            <span className="ml-2 font-bold">৳{s.finalPrice}</span>
                            {s.discountPercent > 0 && (
                              <>
                                <span className="ml-1 text-xs line-through text-slate-500">৳{s.price}</span>
                                <span className="ml-1 text-xs text-emerald-400">-{s.discountPercent}%</span>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected plan summary */}
                    {selectedSub && (
                      <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2">
                        <div className="text-sm text-slate-300">
                          <span>{selectedSub.durationMonths}-month plan</span>
                          {selectedSub.discountPercent > 0 && (
                            <span className="ml-2 text-emerald-400">{selectedSub.discountPercent}% off</span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-white">৳{selectedSub.finalPrice}</span>
                      </div>
                    )}

                    <Button
                      color="primary"
                      className="w-full"
                      startContent={<ShoppingCart size={14} />}
                      onPress={() => onAdd(product.id)}
                      isDisabled={!selectedDuration}>
                      Add to Cart
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No subscription plans available.</p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
