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

      {/* Desktop: table */}
      <div className="hidden md:block responsive-table-wrap">
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
            <TableColumn>Delivery</TableColumn>
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
                  <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)} className="premium-badge">
                    {order.paymentStatus}
                  </Chip>
                </TableCell>
                <TableCell className="text-xs text-[var(--theme-muted)]">
                  {order.subscriptionEndDate
                    ? new Date(order.subscriptionEndDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {order.isDelivered ? (
                    <Chip size="sm" variant="flat" color="success" className="premium-badge">Delivered</Chip>
                  ) : (
                    <span className="text-[var(--theme-muted)] text-xs">Pending</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.length === 0 && (
          <p className="text-center text-[var(--theme-muted)] py-10">No orders yet.</p>
        )}
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            {/* Top row: id + status */}
            <div className="order-card-top">
              <span className="order-card-id">Order #{order.id}</span>
              <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)} className="premium-badge">
                {order.paymentStatus}
              </Chip>
            </div>

            {/* Product name */}
            <p className="order-card-product">{order.productTitle}</p>

            {/* Details grid */}
            <div className="order-card-grid">
              <div className="order-card-field">
                <span className="order-card-label">Plan</span>
                <span className="order-card-value">{order.durationMonths ?? 0} months</span>
              </div>
              <div className="order-card-field">
                <span className="order-card-label">Final Price</span>
                <span className="order-card-value font-bold">৳{order.finalAmount}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 ? (
                <div className="order-card-field">
                  <span className="order-card-label">Discount</span>
                  <span className="order-card-value text-[var(--theme-green)]">-৳{order.discountAmount}</span>
                </div>
              ) : null}
              {order.voucherCode && (
                <div className="order-card-field">
                  <span className="order-card-label">Voucher</span>
                  <span className="font-mono text-xs text-[var(--theme-yellow)]">{order.voucherCode}</span>
                </div>
              )}
              {order.subscriptionEndDate && (
                <div className="order-card-field">
                  <span className="order-card-label">Expires</span>
                  <span className="order-card-value">
                    {new Date(order.subscriptionEndDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Delivery section */}
            {order.isDelivered && order.deliveryNote && (
              <div className="mt-3 pt-3 border-t border-[var(--theme-border)]">
                <p className="text-xs font-semibold text-[var(--theme-green)] mb-1">Delivered</p>
                <pre className="text-xs text-[var(--theme-muted)] whitespace-pre-wrap break-all bg-[var(--theme-bg)] rounded-lg p-3">
                  {order.deliveryNote}
                </pre>
              </div>
            )}
            {!order.isDelivered && order.paymentStatus === "Paid" && (
              <p className="text-xs text-[var(--theme-muted)] mt-3 pt-3 border-t border-[var(--theme-border)]">
                Delivery in progress — you will receive an email when your service is ready.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
