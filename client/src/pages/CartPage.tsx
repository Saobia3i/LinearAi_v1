import { Card, CardBody, Input } from "@heroui/react";
import { ShoppingCart, Tag, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { applyVoucher, checkout, getCart, getErrorMessage, removeFromCart } from "../api";
import { AppButton as Button } from "../components/ui/AppButton";
import type { CartResponse } from "../types";

export function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [voucher, setVoucher] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const load = async (voucherCode?: string) => {
    const response = await getCart(voucherCode);
    setCart(response.data);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onVoucher = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await applyVoucher(voucher);
      setCart(response.data);
      const msg = response.data.summary.voucherMessage ?? "Voucher checked.";
      setMessage({ text: msg, type: response.data.summary.voucherValid ? "success" : "error" });
    } catch (error) {
      setMessage({ text: getErrorMessage(error, "Voucher apply failed"), type: "error" });
    }
  };

  const onRemove = async (productId: number, durationMonths: number) => {
    await removeFromCart(productId, durationMonths);
    await load(voucher || undefined);
  };

  const onCheckout = async () => {
    try {
      const response = await checkout(voucher || undefined);
      setMessage({ text: response.message ?? "Order placed", type: "success" });
      await load();
      setVoucher("");
    } catch (error) {
      setMessage({ text: getErrorMessage(error, "Checkout failed"), type: "error" });
    }
  };

  if (loading) return <p className="section-subtitle">Loading cart...</p>;
  if (!cart) return <p className="section-subtitle">No cart data.</p>;

  return (
    <section className="premium-section px-2 sm:px-4 md:px-8 max-w-5xl mx-auto">
      <div className="premium-section-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="premium-kicker">Checkout Flow</p>
          <h2 className="section-title">Cart</h2>
        </div>
      </div>

      {message && <p className={`text-sm ${message.type === "success" ? "premium-success" : "premium-danger"}`}>{message.text}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_360px] gap-6 mt-6">
        <div className="space-y-4">
          {cart.items.length === 0 && <p className="section-subtitle">Your cart is empty.</p>}

          {cart.items.map((item) => (
            <Card key={`${item.productId}-${item.durationMonths}`} className="premium-card" style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{item.productTitle}</p>
                  <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>{item.durationMonths} months subscription</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="premium-stat-label text-xs" style={{ color: 'var(--theme-muted)' }}>Final Price</p>
                    <p className="text-xl font-black" style={{ color: 'var(--theme-blue)' }}>৳{item.finalPrice}</p>
                  </div>
                  <Button
                    isIconOnly
                    color="danger"
                    variant="bordered"
                    radius="full"
                    className="border font-bold"
                    style={{
                      borderColor: 'var(--theme-red)',
                      color: 'var(--theme-red)',
                      background: 'transparent',
                    }}
                    onPress={() => onRemove(item.productId, item.durationMonths)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="premium-card h-fit min-h-[340px] min-w-[260px]" style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
          <CardBody className="space-y-5 p-5">
            <div>
              <p className="premium-kicker">Order Summary</p>
              <h3 className="mt-2 text-xl font-bold" style={{ color: 'var(--theme-text)' }}>Complete your purchase</h3>
            </div>

            <form className="space-y-3" onSubmit={onVoucher}>
              <div className="flex gap-2">
                <Input
                  value={voucher}
                  onValueChange={setVoucher}
                  placeholder="Voucher code (optional)"
                  radius="lg"
                  classNames={{
                    inputWrapper: "premium-input",
                    input: 'text-[var(--theme-text)]',
                    label: 'text-[var(--theme-muted)]',
                  }}
                  startContent={<Tag size={14} className="text-[var(--theme-muted)]" />}
                />
                {voucher && (
                  <Button
                    type="submit"
                    radius="full"
                    color="warning"
                    variant="bordered"
                    size="sm"
                    className="self-center shrink-0 border font-bold"
                    style={{
                      borderColor: 'var(--theme-yellow)',
                      color: 'var(--theme-yellow)',
                      background: 'transparent',
                    }}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </form>

            <div className="premium-summary-stack">
              <div className="premium-summary-row flex items-center justify-between">
                <span>Subtotal</span>
                <span>৳{cart.summary.subTotal}</span>
              </div>
              <div className="premium-summary-row flex items-center justify-between">
                <span>Bundle discount</span>
                <span>৳{cart.summary.bundleDiscount}</span>
              </div>
              <div className="premium-summary-row flex items-center justify-between">
                <span>Voucher discount</span>
                <span>৳{cart.summary.voucherDiscount}</span>
              </div>
              <div className="premium-summary-total flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>৳{cart.summary.total}</span>
              </div>
            </div>

            <Button
              color="danger"
              variant="bordered"
              radius="full"
              size="lg"
              className="w-full font-bold border"
              style={{
                borderColor: 'var(--theme-red)',
                color: 'var(--theme-red)',
                background: 'transparent',
              }}
              startContent={<ShoppingCart size={16} />}
              onPress={onCheckout}
              isDisabled={cart.items.length === 0}
            >
              Checkout
            </Button>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
