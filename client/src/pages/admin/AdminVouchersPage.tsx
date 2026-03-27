import { Card, CardBody, Chip, Pagination } from "@heroui/react";
import { Plus, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdminVoucher, getAdminVouchers, getErrorMessage, toggleAdminVoucher } from "../../api";
import { AppButton as Button } from "../../components/ui/AppButton";
import type { VoucherSummary } from "../../types";

export function AdminVouchersPage() {

  const [vouchers, setVouchers] = useState<VoucherSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

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
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : 0,
        minimumOrderAmount: minimumOrderAmount ? Number(minimumOrderAmount) : 0,
        maxUses: usageLimit ? Number(usageLimit) : 0,
        expiryDate: expiryDate || undefined,
        description: ""
      });
      setCode("");
      setDiscountPercent("");
      setMinimumOrderAmount("");
      setMaxDiscountAmount("");
      setExpiryDate("");
      setUsageLimit("");
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

  const totalPages = Math.max(1, Math.ceil(vouchers.length / pageSize));
  const visibleVouchers = vouchers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Discount Engine</p>
          <h2 className="section-title">Voucher Management</h2>
        </div>
        <div className="premium-icon-badge premium-icon-red">
          <Ticket size={20} />
        </div>
      </div>

      {message && <p className={`text-sm ${message.type === "success" ? "premium-success" : "premium-danger"}`}>{message.text}</p>}

      <Card className="premium-card">
        <CardBody className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="premium-kicker">Create Voucher</p>
            <p className="text-sm text-[var(--theme-muted)]">Launch new discounts with consistent pricing rules.</p>
          </div>

          <div className="premium-form-grid">
            <div className="premium-admin-field">
              <label className="premium-field-label">Voucher Code</label>
              <input
                className="admin-input"
                placeholder="e.g. SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Discount (%)</label>
              <input
                className="admin-input"
                type="number"
                min={1}
                max={100}
                step={0.01}
                placeholder="e.g. 20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Expiry Date (optional)</label>
              <input
                className="admin-input"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Minimum Order (optional)</label>
              <input
                className="admin-input"
                type="number"
                min={0}
                step={0.01}
                placeholder="Empty = no minimum"
                value={minimumOrderAmount}
                onChange={(e) => setMinimumOrderAmount(e.target.value)}
              />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Max Discount (optional)</label>
              <input
                className="admin-input"
                type="number"
                min={0}
                step={0.01}
                placeholder="Empty = unlimited"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
              />
            </div>
            <div className="premium-admin-field">
              <label className="premium-field-label">Usage Limit (optional)</label>
              <input
                className="admin-input"
                type="number"
                placeholder="Empty = unlimited"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </div>
          </div>

          <Button color="danger" radius="full" className="w-full font-bold sm:w-auto sm:min-w-[220px]" onPress={onCreate} startContent={<Plus size={14} />}>
            Create Voucher
          </Button>
        </CardBody>
      </Card>

      <Card className="premium-card">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="premium-data-table">
              <thead>
                <tr>
                  <th className="w-[160px]">Code</th>
                  <th className="w-[120px]">Discount</th>
                  <th className="w-[90px]">Used</th>
                  <th className="w-[110px]">Limit</th>
                  <th className="w-[130px]">Expiry</th>
                  <th className="w-[120px]">Status</th>
                  <th className="w-[150px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleVouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td className="font-mono font-bold text-[var(--theme-text)]">{voucher.code}</td>
                    <td>{voucher.discountPercent}%</td>
                    <td>{voucher.usedCount}</td>
                    <td>{voucher.maxUses ? voucher.maxUses : "Unlimited"}</td>
                    <td>
                      {voucher.expiryDate
                        ? new Date(voucher.expiryDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })
                        : "No expiry"}
                    </td>
                    <td>
                      <Chip size="sm" variant="flat" color={voucher.isActive ? "success" : "danger"}>
                        {voucher.isActive ? "Active" : "Inactive"}
                      </Chip>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        radius="full"
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
                    <td colSpan={7} className="text-center text-[var(--theme-muted)]">
                      No vouchers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {vouchers.length > pageSize && (
        <div className="premium-pagination-wrap">
          <Pagination page={page} total={totalPages} onChange={setPage} radius="full" color="danger" showControls />
        </div>
      )}
    </section>
  );
}
