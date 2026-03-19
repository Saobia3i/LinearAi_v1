import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Boxes, ShoppingCart, Tag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart, getErrorMessage, api } from "../api";

type HomeData = {
  user: { id: string; fullName: string; email: string };
  cartCount: number;
  latestProducts: { id: number; title: string; shortDescription: string; price: number; subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[] }[];
  featuredProducts: { id: number; title: string; shortDescription: string; price: number; subscriptions: { id: number; durationMonths: number; finalPrice: number; discountPercent: number }[] }[];
  maxVoucherDiscountPercent?: number;
  featuredVoucherCode?: string;
};

export function UserHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<{ success: boolean; data: HomeData }>("api/user/home")
      .then((res) => setData(res.data.data))
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
    <section className="space-y-6">
      {/* Hero */}
      <Card className="border border-blue-800/40 bg-gradient-to-br from-slate-900 to-blue-950/60">
        <CardBody className="space-y-3 py-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Scale faster with done-for-you <span className="text-blue-400">AI tools</span> that sell, automate, and save time.
          </h1>
          <p className="text-slate-400">Launch conversion-ready workflows in minutes. No tech stress. Just results.</p>
          <div className="flex gap-3 pt-2">
            <Button color="primary" onPress={() => navigate("/products")} startContent={<Zap size={14} />}>
              Explore Products
            </Button>
            <Button variant="flat" onPress={() => navigate("/cart")} startContent={<ShoppingCart size={14} />}>
              View Cart {data.cartCount > 0 && `(${data.cartCount})`}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Featured Products</p>
              <p className="text-2xl font-bold text-white">{data.featuredProducts.length}</p>
            </div>
            <Boxes className="text-emerald-300" />
          </CardBody>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Items in Cart</p>
              <p className="text-2xl font-bold text-white">{data.cartCount}</p>
            </div>
            <ShoppingCart className="text-blue-300" />
          </CardBody>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Max Discount</p>
              <p className="text-2xl font-bold text-white">
                {data.maxVoucherDiscountPercent ? `${data.maxVoucherDiscountPercent}%` : "—"}
              </p>
            </div>
            <Tag className="text-yellow-300" />
          </CardBody>
        </Card>
      </div>

      {/* Voucher Banner */}
      {data.featuredVoucherCode && (
        <Card className="border border-emerald-800/50 bg-emerald-900/20">
          <CardBody className="flex flex-row items-center gap-3">
            <Tag size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Active voucher: <span className="font-mono tracking-widest">{data.featuredVoucherCode}</span>
                {data.maxVoucherDiscountPercent ? ` — ${data.maxVoucherDiscountPercent}% off` : ""}
              </p>
              <p className="text-xs text-slate-400">Use this code at checkout to save</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Cart message */}
      {cartMsg && (
        <p className={`text-sm ${cartMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {cartMsg.text}
        </p>
      )}

      {/* Featured Products */}
      {data.featuredProducts.length > 0 && (
        <div className="space-y-3">
          <h2 className="section-title">Featured Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.featuredProducts.map((product) => (
              <Card key={product.id} className="border border-slate-800 bg-slate-900/70">
                <CardBody className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-white">{product.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{product.shortDescription}</p>
                  </div>
                  <Chip variant="flat" color="primary" size="sm">Base ৳{product.price}</Chip>
                  <div className="flex flex-wrap gap-2">
                    {product.subscriptions.map((s) => (
                      <Button
                        key={s.id}
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<ShoppingCart size={12} />}
                        onPress={() => onAdd(product.id, s.durationMonths)}>
                        {s.durationMonths}m • ৳{s.finalPrice}
                        {s.discountPercent > 0 && (
                          <span className="ml-1 text-xs text-emerald-400">-{s.discountPercent}%</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  <Button size="sm" variant="light" onPress={() => navigate("/products")}>
                    View all plans →
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
