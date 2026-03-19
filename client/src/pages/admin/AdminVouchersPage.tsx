import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { Plus, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdminVoucher, getAdminVouchers, getErrorMessage, toggleAdminVoucher } from "../../api";
import type { VoucherSummary } from "../../types";

export function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form fields matching Views/Admin/AddVoucher.cshtml exactly
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState(""); // empty = unlimited

  const load = async () => {
    const response = await getAdminVouchers();
    setVouchers(response.data);
  };

  useEffect(() => {
    load().catch(() => setVouchers([]));
  }, []);

  const onCreate = async () => {
    if (!code) return setMessage({ text: "Code is required.", type: "error" });
    if (!discountPercent) return setMessage({ text: "Discount % is required.", type: "error" });
    try {
      await createAdminVoucher({
        code: code.toUpperCase(),
        discountPercent: Number(discountPercent),
        maxUses: usageLimit ? Number(usageLimit) : 0,
        expiryDate: expiryDate || undefined,
        // legacy compat fields
        description: "",
        maxDiscountAmount: 0,
        minimumOrderAmount: 0,
      });
      setCode(""); setDiscountPercent(""); setExpiryDate(""); setUsageLimit("");
      setMessage({ text: "Voucher created.", type: "success" });
      await load();
    } catch (error) {
      setMessage({ text: getErrorMessage(error, "Voucher creation failed"), type: "error" });
    }
  };

  const onToggle = async (id: number) => {
    try {
      await toggleAdminVoucher(id);
      await load();
    } catch (error) {
      setMessage({ text: getErrorMessage(error, "Voucher update failed"), type: "error" });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Ticket size={20} className="text-blue-300" />
        <h2 className="section-title">Voucher Management</h2>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      {/* Create Voucher Form — matching AddVoucher.cshtml */}
      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="space-y-3">
          <p className="text-sm font-medium text-slate-300">New Voucher</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Voucher Code"
              placeholder="e.g. SAVE20"
              value={code}
              onValueChange={(v) => setCode(v.toUpperCase())}
            />
            <Input
              label="Discount (%)"
              type="number"
              min={1}
              max={100}
              step={0.01}
              placeholder="e.g. 20"
              value={discountPercent}
              onValueChange={setDiscountPercent}
            />
            <Input
              label="Expiry Date (optional)"
              type="date"
              value={expiryDate}
              onValueChange={setExpiryDate}
            />
            <Input
              label="Usage Limit (optional)"
              type="number"
              placeholder="Empty = unlimited"
              value={usageLimit}
              onValueChange={setUsageLimit}
            />
          </div>
          <Button color="primary" onPress={onCreate} startContent={<Plus size={14} />}>
            Create Voucher
          </Button>
        </CardBody>
      </Card>

      {/* Vouchers Table — matching Vouchers.cshtml layout */}
      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Limit</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono font-semibold text-white">{voucher.code}</td>
                    <td className="px-4 py-3 text-slate-300">{voucher.discountPercent}%</td>
                    <td className="px-4 py-3 text-slate-400">{voucher.usedCount}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {voucher.maxUses ? voucher.maxUses : "Unlimited"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {voucher.expiryDate
                        ? new Date(voucher.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "No expiry"}
                    </td>
                    <td className="px-4 py-3">
                      <Chip size="sm" variant="flat" color={voucher.isActive ? "success" : "danger"}>
                        {voucher.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="flat"
                        color={voucher.isActive ? "danger" : "success"}
                        onPress={() => onToggle(voucher.id)}>
                        {voucher.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No vouchers yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
