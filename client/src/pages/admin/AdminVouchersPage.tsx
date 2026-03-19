import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { useEffect, useState } from "react";
import { createAdminVoucher, getAdminVouchers, getErrorMessage, toggleAdminVoucher } from "../../api";
import type { VoucherSummary } from "../../types";

export function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("500");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("100");
  const [expiryDate, setExpiryDate] = useState("");

  const load = async () => {
    const response = await getAdminVouchers();
    setVouchers(response.data);
  };

  useEffect(() => {
    load().catch(() => setVouchers([]));
  }, []);

  const onCreate = async () => {
    try {
      await createAdminVoucher({
        code,
        description,
        discountPercent: Number(discountPercent),
        maxDiscountAmount: Number(maxDiscountAmount),
        minimumOrderAmount: Number(minimumOrderAmount),
        maxUses: Number(maxUses),
        expiryDate: expiryDate || undefined
      });

      setCode("");
      setDescription("");
      setDiscountPercent("10");
      setMaxDiscountAmount("500");
      setMinimumOrderAmount("0");
      setMaxUses("100");
      setExpiryDate("");
      setMessage("Voucher created.");
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Voucher creation failed"));
    }
  };

  const onToggle = async (id: number) => {
    try {
      await toggleAdminVoucher(id);
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Voucher update failed"));
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="section-title">Admin Vouchers</h2>
      {message && <p className="section-subtitle">{message}</p>}

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Code" value={code} onValueChange={setCode} />
          <Input label="Description" value={description} onValueChange={setDescription} />
          <Input label="Discount %" type="number" value={discountPercent} onValueChange={setDiscountPercent} />
          <Input label="Max Discount" type="number" value={maxDiscountAmount} onValueChange={setMaxDiscountAmount} />
          <Input label="Minimum Order" type="number" value={minimumOrderAmount} onValueChange={setMinimumOrderAmount} />
          <Input label="Max Uses" type="number" value={maxUses} onValueChange={setMaxUses} />
          <Input label="Expiry" type="date" value={expiryDate} onValueChange={setExpiryDate} />
          <div className="flex items-end">
            <Button color="primary" className="w-full" onPress={onCreate}>
              Create Voucher
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className="border border-slate-800 bg-slate-900/60">
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{voucher.code}</h3>
                <Chip color={voucher.isActive ? "success" : "danger"} variant="flat">
                  {voucher.isActive ? "Active" : "Inactive"}
                </Chip>
              </div>
              <p className="text-sm text-slate-300">{voucher.description}</p>
              <p className="text-sm text-slate-300">
                {voucher.discountPercent}% off • Max ৳{voucher.maxDiscountAmount} • Used {voucher.usedCount}/{voucher.maxUses}
              </p>
              <div className="pt-2">
                <Button size="sm" variant="flat" color={voucher.isActive ? "danger" : "success"} onPress={() => onToggle(voucher.id)}>
                  {voucher.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
