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

  const statusColor = (s: string) =>
    s === "Paid" ? "success" : s === "Pending" ? "warning" : "danger";

  if (loading) return <p className="section-subtitle">Loading orders...</p>;

  return (
    <section className="space-y-4">
      <h2 className="section-title">My Orders</h2>

      <div className="overflow-x-auto">
        <Table aria-label="Orders table" className="rounded-xl border border-slate-800">
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
                <TableCell className="text-slate-400">#{order.id}</TableCell>
                <TableCell className="font-medium text-white">{order.productTitle}</TableCell>
                <TableCell className="text-slate-300">{order.durationMonths ?? 0} months</TableCell>
                <TableCell className="text-slate-300">৳{order.originalPrice ?? order.finalAmount}</TableCell>
                <TableCell className="text-emerald-400">
                  {order.discountAmount && order.discountAmount > 0 ? `-৳${order.discountAmount}` : "—"}
                </TableCell>
                <TableCell className="font-semibold text-white">৳{order.finalAmount}</TableCell>
                <TableCell>
                  {order.voucherCode ? (
                    <span className="font-mono text-xs text-yellow-400">{order.voucherCode}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Chip>
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {order.subscriptionEndDate
                    ? new Date(order.subscriptionEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
