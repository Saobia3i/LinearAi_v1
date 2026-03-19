import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useEffect, useState } from "react";
import { getOrders } from "../api";
import type { OrderSummary } from "../types";

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => (s === "Paid" ? "success" : s === "Pending" ? "warning" : "danger");

  if (loading) return <p className="section-subtitle">Loading orders...</p>;

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Customer History</p>
          <h2 className="section-title">My Orders</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table aria-label="Orders table" className="premium-table">
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>Product</TableColumn>
            <TableColumn>Plan</TableColumn>
            <TableColumn>Original</TableColumn>
            <TableColumn>Discount</TableColumn>
            <TableColumn>Final</TableColumn>
            <TableColumn>Voucher</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Expires</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No orders yet.">
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-[var(--theme-muted)]">#{order.id}</TableCell>
                <TableCell className="font-semibold text-[var(--theme-text)]">{order.productTitle}</TableCell>
                <TableCell className="text-[var(--theme-text)]">{order.durationMonths ?? 0} months</TableCell>
                <TableCell className="text-[var(--theme-text)]">৳{order.originalPrice ?? order.finalAmount}</TableCell>
                <TableCell className="text-[var(--theme-green)]">
                  {order.discountAmount && order.discountAmount > 0 ? `-৳${order.discountAmount}` : "-"}
                </TableCell>
                <TableCell className="font-bold text-[var(--theme-text)]">৳{order.finalAmount}</TableCell>
                <TableCell>
                  {order.voucherCode ? (
                    <span className="font-mono text-xs text-[var(--theme-yellow)]">{order.voucherCode}</span>
                  ) : (
                    <span className="text-[var(--theme-muted)]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Chip>
                </TableCell>
                <TableCell className="text-xs text-[var(--theme-muted)]">
                  {order.subscriptionEndDate
                    ? new Date(order.subscriptionEndDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit"
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
