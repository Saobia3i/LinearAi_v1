import { Button, Card, CardBody, Chip, Input, Pagination } from "@heroui/react";
import { Plus, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { createAdminVoucher, getAdminVouchers, getErrorMessage, toggleAdminVoucher } from "../../api";
import type { VoucherSummary } from "../../types";

export function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
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
        maxUses: usageLimit ? Number(usageLimit) : 0,
        expiryDate: expiryDate || undefined,
        description: "",
        maxDiscountAmount: 0,
        minimumOrderAmount: 0
      });
      setCode("");
      setDiscountPercent("");
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
            <Input
              label="Voucher Code"
              placeholder="e.g. SAVE20"
              value={code}
              onValueChange={(v) => setCode(v.toUpperCase())}
              radius="lg"
              classNames={{ inputWrapper: "premium-input" }}
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
              radius="lg"
              classNames={{ inputWrapper: "premium-input" }}
            />
            <Input
              label="Expiry Date (optional)"
              type="date"
              value={expiryDate}
              onValueChange={setExpiryDate}
              radius="lg"
              classNames={{ inputWrapper: "premium-input" }}
            />
            <Input
              label="Usage Limit (optional)"
              type="number"
              placeholder="Empty = unlimited"
              value={usageLimit}
              onValueChange={setUsageLimit}
              radius="lg"
              classNames={{ inputWrapper: "premium-input" }}
            />
          </div>

          <Button color="danger" radius="full" onPress={onCreate} startContent={<Plus size={14} />}>
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
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Limit</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
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
