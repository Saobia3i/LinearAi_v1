import { Button, Card, CardBody, Input } from "@heroui/react";
import { Tag, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { applyVoucher, checkout, getCart, getErrorMessage, removeFromCart } from "../api";
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
    <section className="space-y-4">
      <h2 className="section-title">Cart</h2>
      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {cart.items.length === 0 && <p className="section-subtitle">Your cart is empty.</p>}
          {cart.items.map((item) => (
            <Card key={`${item.productId}-${item.durationMonths}`} className="border border-slate-800 bg-slate-900/60">
              <CardBody className="flex flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.productTitle}</p>
                  <p className="text-sm text-slate-400">{item.durationMonths} months</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-blue-200">৳{item.finalPrice}</p>
                  <Button isIconOnly color="danger" variant="flat" onPress={() => onRemove(item.productId, item.durationMonths)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="h-fit border border-slate-800 bg-slate-900/80">
          <CardBody className="space-y-3">
            <form className="space-y-2" onSubmit={onVoucher}>
              <Input
                value={voucher}
                onValueChange={setVoucher}
                placeholder="Voucher code"
                startContent={<Tag size={14} className="text-slate-400" />}
              />
              <Button type="submit" color="primary" variant="flat" className="w-full">
                Apply Voucher
              </Button>
            </form>

            <div className="space-y-1 text-sm">
              <p className="flex justify-between text-slate-300"><span>Subtotal</span><span>৳{cart.summary.subTotal}</span></p>
              <p className="flex justify-between text-slate-300"><span>Bundle discount</span><span>৳{cart.summary.bundleDiscount}</span></p>
              <p className="flex justify-between text-slate-300"><span>Voucher discount</span><span>৳{cart.summary.voucherDiscount}</span></p>
              <p className="flex justify-between pt-2 text-base font-semibold text-white"><span>Total</span><span>৳{cart.summary.total}</span></p>
            </div>

            <Button color="primary" className="w-full" onPress={onCheckout} isDisabled={cart.items.length === 0}>
              Checkout
            </Button>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
