import { Card, CardBody, Chip, Pagination } from "@heroui/react";
import { Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, getErrorMessage, getProducts } from "../api";
import { AppButton as Button } from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import { getProductFilterCategories, matchesProductCategory } from "../productCategories";
import type { Product } from "../types";

export function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
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
    if (!user) {
      navigate("/login");
      return;
    }
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

  const categoryOptions = getProductFilterCategories(products);
  const filteredProducts = products.filter((product) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch =
      searchText.length === 0 ||
      product.title.toLowerCase().includes(searchText) ||
      product.shortDescription.toLowerCase().includes(searchText);

    const matchesCategory = matchesProductCategory(product, categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="premium-section px-2 sm:px-4 md:px-8 max-w-7xl mx-auto">
      <div className="premium-section-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="premium-kicker">Storefront</p>
          <h2 className="section-title">Products</h2>
        </div>
        <div className="premium-icon-badge premium-icon-blue">
          <Package size={20} />
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.type === "success" ? "premium-success" : "premium-danger"}`}>{msg.text}</p>}

      <div className="premium-filter-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search products"
          className="admin-input premium-filter-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input premium-filter-select"
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All Plans" : category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {visibleProducts.map((product) => {
          const selectedDuration = selectedPlans[product.id];
          const selectedSub = product.subscriptions.find((s) => s.durationMonths === selectedDuration);

          return (
            <Card
              key={product.id}
              className="premium-card flex flex-col h-full min-h-[520px] min-w-[320px] max-w-full"
              style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
            >
              <CardBody className="product-card-body flex flex-col h-full p-7 text-base break-words">
                <div className="product-card-top flex-1">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="premium-card-title text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{product.title}</h3>
                      <Chip size="sm" variant="flat" color="danger" className="shrink-0">
                        Base
                      </Chip>
                    </div>
                    <p className="premium-card-desc text-sm" style={{ color: 'var(--theme-muted)' }}>{product.shortDescription}</p>
                  </div>

                  <div className="product-price-line flex items-center justify-between mt-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface-soft)' }}>
                    <span className="premium-label text-xs" style={{ color: 'var(--theme-muted)' }}>Starting from</span>
                    <span className="premium-price text-base font-bold" style={{ color: 'var(--theme-price)' }}>৳{product.price}</span>
                  </div>
                </div>

                {product.subscriptions.length > 0 ? (
                  <>
                    <div className="space-y-3 mt-4">
                      <p className="premium-label text-xs" style={{ color: 'var(--theme-muted)' }}>Choose Plan</p>
                      <div className="flex flex-wrap gap-2">
                        {product.subscriptions.map((s) => {
                          const active = selectedDuration === s.durationMonths;

                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedPlans((prev) => ({ ...prev, [product.id]: s.durationMonths }))}
                              style={active
                                ? {
                                    border: '2px solid var(--theme-red)',
                                    background: 'linear-gradient(135deg, var(--theme-red), var(--theme-red-strong))',
                                    color: '#fff',
                                  }
                                : {
                                    border: '1.5px solid var(--theme-border)',
                                    background: 'var(--theme-surface)',
                                    color: 'var(--theme-text)',
                                  }
                              }
                              className={
                                'rounded-2xl px-5 py-4 text-base font-semibold transition-all duration-150 min-w-[120px] min-h-[110px] flex flex-col items-center justify-center product-plan-chip' +
                                (active ? ' product-plan-chip-active' : '')
                              }
                            >
                              <span className="product-plan-duration truncate w-full text-center">{s.durationMonths} months</span>
                              <span className="product-plan-price" style={{ color: 'var(--theme-price)' }}>৳{s.finalPrice}</span>
                              {s.discountPercent > 0 && <span className="premium-offer" style={active ? { color: '#fff' } : { color: 'var(--theme-green)', fontWeight: 700 }}>-{s.discountPercent}% SAVE</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedSub && (
                      <div className="product-summary-row flex items-center justify-between mt-2" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-surface-soft)' }}>
                        <div>
                          <p className="premium-label text-xs" style={{ color: 'var(--theme-muted)' }}>Selected</p>
                          <p className="product-summary-title text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{selectedSub.durationMonths}-month access</p>
                        </div>
                        <div className="text-right">
                          <p className="premium-price-inline text-base font-bold" style={{ color: 'var(--theme-price)' }}>৳{selectedSub.finalPrice}</p>
                          {selectedSub.discountPercent > 0 && <p className="premium-offer" style={{ color: 'var(--theme-green)' }}>{selectedSub.discountPercent}% save</p>}
                        </div>
                      </div>
                    )}

                    <div className="product-card-footer mt-4">
                      <Button
                        color="primary"
                        variant="bordered"
                        radius="full"
                        className="product-cart-btn w-full font-bold border"
                        style={{
                          borderColor: 'var(--theme-blue)',
                          color: 'var(--theme-blue)',
                          background: 'transparent',
                        }}
                        startContent={<ShoppingCart size={16} />}
                        onPress={() => onAdd(product.id)}
                        isDisabled={!selectedDuration}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="section-subtitle text-xs mt-4" style={{ color: 'var(--theme-muted)' }}>No subscription plans available.</p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length > pageSize && (
        <div className="premium-pagination-wrap mt-8 flex justify-center">
          <Pagination page={page} total={totalPages} onChange={setPage} radius="full" color="danger" showControls />
        </div>
      )}
    </section>
  );
}
