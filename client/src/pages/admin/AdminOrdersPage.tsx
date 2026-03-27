import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useEffect, useState } from "react";
import { getAdminOrders, getErrorMessage, updateAdminOrderStatus } from "../../api";
import { AppButton as Button } from "../../components/ui/AppButton";
import type { AdminOrderSummary } from "../../types";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = async () => {
    const res = await getAdminOrders();
    setOrders(res.data ?? []);
  };

  useEffect(() => {
    load().catch(() => setOrders([]));
  }, []);

  const onMark = async (id: number, status: string) => {
    try {
      await updateAdminOrderStatus(id, status);
      setMessage({ text: `Order #${id} marked as ${status}.`, type: "success" });
      await load();
    } catch (e) {
      setMessage({ text: getErrorMessage(e, "Status update failed"), type: "error" });
    }
  };

  const statusColor = (s: string) =>
    s === "Paid" ? "success" : s === "Pending" ? "warning" : s === "Cancelled" ? "danger" : "default";

  const statusClassName = (s: string) =>
    s === "Paid"
      ? "premium-chip-green"
      : s === "Pending"
        ? "premium-chip-yellow"
        : s === "Cancelled"
          ? "premium-chip-red"
          : "premium-chip-blue";

  const visibleOrders = orders.filter((order) => {
    const searchText = search.trim().toLowerCase();
    const matchesSearch =
      searchText.length === 0 ||
      order.id.toString().includes(searchText) ||
      order.clientEmail.toLowerCase().includes(searchText) ||
      order.product.toLowerCase().includes(searchText);

    const matchesStatus = statusFilter === "All" || order.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Operations Queue</p>
          <h2 className="section-title">Order Management</h2>
        </div>
        <span className="premium-chip-blue">{orders.length} orders</span>
      </div>

      <div className="premium-filter-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order id, email, or product"
          className="admin-input premium-filter-input"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input premium-filter-select">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "premium-success" : "premium-danger"}`}>
          {message.text}
        </p>
      )}

      {/* Desktop: table */}
      <div className="hidden md:block responsive-table-wrap">
        <Table aria-label="Admin orders table" className="premium-table">
          <TableHeader>
            <TableColumn className="w-[72px]">#</TableColumn>
            <TableColumn className="min-w-[220px]">Client Email</TableColumn>
            <TableColumn className="min-w-[220px]">Product</TableColumn>
            <TableColumn className="w-[120px]">Price</TableColumn>
            <TableColumn className="w-[130px]">Date</TableColumn>
            <TableColumn className="w-[120px]">Status</TableColumn>
            <TableColumn className="min-w-[220px]">Action</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No orders found.">
            {visibleOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-[var(--theme-muted)]">#{order.id}</TableCell>
                <TableCell className="whitespace-nowrap text-[var(--theme-text)]">{order.clientEmail}</TableCell>
                <TableCell className="font-semibold text-[var(--theme-text)]">{order.product}</TableCell>
                <TableCell className="whitespace-nowrap text-[var(--theme-text)]">৳{order.price}</TableCell>
                <TableCell className="text-xs text-[var(--theme-muted)]">
                  {new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={statusColor(order.paymentStatus)}
                    className={`premium-badge ${statusClassName(order.paymentStatus)}`}
                  >
                    {order.paymentStatus}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {order.paymentStatus !== "Paid" && (
                      <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-yellow-500 text-black font-semibold" onPress={() => onMark(order.id, "Paid")}>
                        Mark Paid
                      </Button>
                    )}
                    {order.paymentStatus !== "Pending" && (
                      <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-green-600 text-white font-semibold" onPress={() => onMark(order.id, "Pending")}>
                        Mark Pending
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {visibleOrders.length === 0 && (
          <p className="text-center text-[var(--theme-muted)] py-10">No orders found.</p>
        )}
        {visibleOrders.map((order) => (
          <div key={order.id} className="order-card">
            {/* Top row: id + status */}
            <div className="order-card-top">
              <span className="order-card-id">Order #{order.id}</span>
              <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)} className={`premium-badge ${statusClassName(order.paymentStatus)}`}>
                {order.paymentStatus}
              </Chip>
            </div>

            {/* Product + email */}
            <p className="order-card-product">{order.product}</p>
            <p className="text-xs text-[var(--theme-muted)] mb-3 truncate">{order.clientEmail}</p>

            {/* Details grid */}
            <div className="order-card-grid">
              <div className="order-card-field">
                <span className="order-card-label">Price</span>
                <span className="order-card-value font-bold">৳{order.price}</span>
              </div>
              <div className="order-card-field">
                <span className="order-card-label">Date</span>
                <span className="order-card-value">
                  {new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--theme-border)]">
              {order.paymentStatus !== "Paid" && (
                <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-yellow-500 text-black font-semibold" onPress={() => onMark(order.id, "Paid")}>
                  Mark Paid
                </Button>
              )}
              {order.paymentStatus !== "Pending" && (
                <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-green-600 text-white font-semibold" onPress={() => onMark(order.id, "Pending")}>
                  Mark Pending
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
