import { Button, Card, CardBody, Chip, Pagination } from "@heroui/react";
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
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    getProducts()
      .then((res) => {
        setProducts(res.data);

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

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Storefront</p>
          <h2 className="section-title">Products</h2>
        </div>
        <div className="premium-icon-badge premium-icon-blue">
          <Package size={20} />
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.type === "success" ? "premium-success" : "premium-danger"}`}>{msg.text}</p>}

      <div className="premium-product-grid">
        {visibleProducts.map((product) => {
          const selectedDuration = selectedPlans[product.id];
          const selectedSub = product.subscriptions.find((s) => s.durationMonths === selectedDuration);

          return (
            <Card key={product.id} className="premium-card product-card">
              <CardBody className="product-card-body">
                <div className="product-card-top">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="premium-card-title">{product.title}</h3>
                      <Chip size="sm" variant="flat" color="danger" className="shrink-0">
                        Base
                      </Chip>
                    </div>
                    <p className="premium-card-desc">{product.shortDescription}</p>
                  </div>

                  <div className="product-price-line">
                    <span className="premium-label">Starting from</span>
                    <span className="premium-price">৳{product.price}</span>
                  </div>
                </div>

                {product.subscriptions.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      <p className="premium-label">Choose Plan</p>
                      <div className="product-plan-grid">
                        {product.subscriptions.map((s) => {
                          const active = selectedDuration === s.durationMonths;

                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedPlans((prev) => ({ ...prev, [product.id]: s.durationMonths }))}
                              className={active ? "product-plan-chip product-plan-chip-active" : "product-plan-chip"}>
                              <span className="product-plan-duration">{s.durationMonths} months</span>
                              <span className="product-plan-price">৳{s.finalPrice}</span>
                              {s.discountPercent > 0 && <span className="premium-offer">-{s.discountPercent}%</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedSub && (
                      <div className="product-summary-row">
                        <div>
                          <p className="premium-label">Selected</p>
                          <p className="product-summary-title">{selectedSub.durationMonths}-month access</p>
                        </div>
                        <div className="text-right">
                          <p className="premium-price-inline">৳{selectedSub.finalPrice}</p>
                          {selectedSub.discountPercent > 0 && <p className="premium-offer">{selectedSub.discountPercent}% off</p>}
                        </div>
                      </div>
                    )}

                    <div className="product-card-footer">
                      <Button
                        color="danger"
                        radius="full"
                        className="product-cart-btn"
                        startContent={<ShoppingCart size={16} />}
                        onPress={() => onAdd(product.id)}
                        isDisabled={!selectedDuration}>
                        Add to Cart
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="section-subtitle">No subscription plans available.</p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {products.length > pageSize && (
        <div className="premium-pagination-wrap">
          <Pagination page={page} total={totalPages} onChange={setPage} radius="full" color="danger" showControls />
        </div>
      )}
    </section>
  );
}
