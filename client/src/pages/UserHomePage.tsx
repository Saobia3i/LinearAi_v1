import { Button, Card, CardBody, Chip, ScrollShadow } from "@heroui/react";
import { ArrowRight, Boxes, ShoppingCart, Tag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, api, getErrorMessage } from "../api";

type HomeData = {
  user: { id: string; fullName: string; email: string };
  cartCount: number;
  latestProducts: {
    id: number;
    title: string;
    shortDescription: string;
    price: number;
    subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[];
  }[];
  featuredProducts: {
    id: number;
    title: string;
    shortDescription: string;
    price: number;
    subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[];
  }[];
  maxVoucherDiscountPercent?: number;
  featuredVoucherCode?: string;
};

export function UserHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<{ success: boolean; data: HomeData }>("api/user/home")
      .then((res) => {
        setData(res.data.data);

        const defaults: Record<number, number> = {};
        res.data.data.featuredProducts.forEach((product) => {
          if (product.subscriptions.length > 0) defaults[product.id] = product.subscriptions[0].durationMonths;
        });
        setSelectedPlans(defaults);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const onAdd = async (productId: number, durationMonths: number) => {
    setCartMsg(null);

    try {
      const res = await addToCart(productId, durationMonths);
      setCartMsg({ text: res.message ?? "Added to cart!", type: "success" });
    } catch (e) {
      setCartMsg({ text: getErrorMessage(e, "Failed to add"), type: "error" });
    }
  };

  if (loading) return <p className="section-subtitle">Loading...</p>;
  if (!data) return <p className="section-subtitle">Failed to load dashboard.</p>;

  return (
    <section className="premium-section">
      <Card className="premium-hero">
        <CardBody className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Chip size="sm" variant="flat" className="premium-chip-red">
              AI Automation Store
            </Chip>
            <Chip size="sm" variant="flat" className="premium-chip-yellow">
              {data.maxVoucherDiscountPercent ? `Up to ${data.maxVoucherDiscountPercent}% off` : "Offers live"}
            </Chip>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
            <div className="space-y-4">
              <p className="premium-kicker">Conversion-Driven Stack</p>
              <h1 className="premium-display">
                Premium AI workflows built to <span className="text-[var(--theme-red)]">sell faster</span>, automate
                operations, and grow revenue.
              </h1>
              <p className="premium-card-desc max-w-2xl">
                Browse launch-ready products, apply vouchers, and move from discovery to checkout in a cleaner,
                higher-converting storefront.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button color="danger" radius="full" size="lg" onPress={() => navigate("/products")} startContent={<Zap size={16} />}>
                  Explore Products
                </Button>
                <Button variant="bordered" radius="full" size="lg" onPress={() => navigate("/cart")} startContent={<ShoppingCart size={16} />}>
                  View Cart {data.cartCount > 0 ? `(${data.cartCount})` : ""}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="premium-metric-card">
                <span className="premium-chip-blue">Cart Ready</span>
                <p className="premium-price mt-3">{data.cartCount}</p>
                <p className="premium-card-desc mt-1">Items staged for checkout</p>
              </div>
              <div className="premium-metric-card">
                <span className="premium-chip-green">Featured</span>
                <p className="premium-price mt-3">{data.featuredProducts.length}</p>
                <p className="premium-card-desc mt-1">Ready-to-buy featured products</p>
              </div>
              <div className="premium-metric-card">
                <span className="premium-chip-yellow">Voucher Boost</span>
                <p className="premium-price mt-3">{data.maxVoucherDiscountPercent ? `${data.maxVoucherDiscountPercent}%` : "-"}</p>
                <p className="premium-card-desc mt-1">Current maximum available savings</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {data.featuredVoucherCode && (
        <Card className="premium-card">
          <CardBody className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="premium-icon-badge premium-icon-green">
                <Tag size={18} />
              </div>
              <div>
                <p className="premium-offer">Live Offer</p>
                <p className="mt-1 text-base font-medium text-[var(--theme-text)]">
                  Use <span className="font-mono">{data.featuredVoucherCode}</span>
                  {data.maxVoucherDiscountPercent ? ` for ${data.maxVoucherDiscountPercent}% off` : " at checkout"}
                </p>
              </div>
            </div>
            <Button variant="flat" radius="full" color="success" onPress={() => navigate("/cart")}>
              Go to Checkout
            </Button>
          </CardBody>
        </Card>
      )}

      {cartMsg && <p className={`text-sm ${cartMsg.type === "success" ? "premium-success" : "premium-danger"}`}>{cartMsg.text}</p>}

      <div className="premium-stats-grid">
        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Featured Products</p>
              <p className="premium-stat-value">{data.featuredProducts.length}</p>
            </div>
            <div className="premium-icon-badge premium-icon-green">
              <Boxes size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Items In Cart</p>
              <p className="premium-stat-value">{data.cartCount}</p>
            </div>
            <div className="premium-icon-badge premium-icon-blue">
              <ShoppingCart size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Max Discount</p>
              <p className="premium-stat-value">{data.maxVoucherDiscountPercent ? `${data.maxVoucherDiscountPercent}%` : "-"}</p>
            </div>
            <div className="premium-icon-badge premium-icon-yellow">
              <Tag size={20} />
            </div>
          </CardBody>
        </Card>
      </div>

      {data.featuredProducts.length > 0 && (
        <div className="space-y-4">
          <div className="premium-section-head">
            <div>
              <p className="premium-kicker">Featured Drop</p>
              <h2 className="section-title">High-converting product picks</h2>
            </div>
            <Button variant="light" radius="full" endContent={<ArrowRight size={14} />} onPress={() => navigate("/products")}>
              View All
            </Button>
          </div>

          <ScrollShadow orientation="horizontal" className="home-feature-carousel" hideScrollBar>
            {data.featuredProducts.map((product) => {
              const selectedDuration = selectedPlans[product.id];
              const selectedPlan =
                product.subscriptions.find((plan) => plan.durationMonths === selectedDuration) ?? product.subscriptions[0];

              return (
                <Card key={product.id} className="premium-card home-feature-card">
                  <CardBody className="flex h-full flex-col space-y-4 p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="premium-card-title">{product.title}</h3>
                          <p className="premium-card-desc">{product.shortDescription}</p>
                        </div>
                        <div className="home-feature-price">
                          <p className="premium-label">Base</p>
                          <p className="premium-price-inline">৳{product.price}</p>
                        </div>
                      </div>
                    </div>

                    <div className="home-feature-plans">
                      {product.subscriptions.map((plan) => {
                        const active = selectedDuration === plan.durationMonths;

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() =>
                              setSelectedPlans((prev) => ({ ...prev, [product.id]: plan.durationMonths }))
                            }
                            className={active ? "home-feature-plan home-feature-plan-active" : "home-feature-plan"}>
                            <span className="home-feature-plan-duration">{plan.durationMonths} months</span>
                            <span className="home-feature-plan-price">৳{plan.finalPrice}</span>
                            {plan.discountPercent > 0 && <span className="premium-offer">-{plan.discountPercent}%</span>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedPlan && (
                      <div className="home-feature-summary">
                        <div>
                          <p className="premium-label">Selected Plan</p>
                          <p className="home-feature-summary-title">{selectedPlan.durationMonths}-month access</p>
                        </div>
                        <div className="text-right">
                          <p className="premium-price-inline">৳{selectedPlan.finalPrice}</p>
                          {selectedPlan.discountPercent > 0 && <p className="premium-offer">{selectedPlan.discountPercent}% off</p>}
                        </div>
                      </div>
                    )}

                    <Button
                      radius="full"
                      color="danger"
                      className="home-feature-cta"
                      startContent={<ShoppingCart size={14} />}
                      onPress={() => selectedPlan && onAdd(product.id, selectedPlan.durationMonths)}
                      isDisabled={!selectedPlan}>
                      Add to Cart
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </ScrollShadow>
        </div>
      )}
    </section>
  );
}
