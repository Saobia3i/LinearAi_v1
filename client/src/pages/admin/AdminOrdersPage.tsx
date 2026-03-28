import { Chip, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { deliverAdminOrder, getAdminOrders, getErrorMessage, updateAdminOrderStatus } from "../../api";
import { AppButton as Button } from "../../components/ui/AppButton";
import type { AdminOrderSummary, PaginationMeta } from "../../types";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deliverModal, setDeliverModal] = useState<{ orderId: number; product: string } | null>(null);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [delivering, setDelivering] = useState(false);
  const deliveryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const load = async (page = 1) => {
    const res = await getAdminOrders(page, 20);
    setOrders(res.data ?? []);
    if (res.pagination) setPagination(res.pagination);
  };

  useEffect(() => {
    load(1).catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (!deliverModal) {
      return;
    }

    requestAnimationFrame(() => {
      deliveryTextareaRef.current?.focus();
      deliveryTextareaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [deliverModal]);

  const onMark = async (id: number, status: string) => {
    try {
      await updateAdminOrderStatus(id, status);
      setMessage({ text: `Order #${id} marked as ${status}.`, type: "success" });
      await load(pagination.page);
    } catch (e) {
      setMessage({ text: getErrorMessage(e, "Status update failed"), type: "error" });
    }
  };

  const onDeliver = async () => {
    if (!deliverModal || deliveryNote.trim().length < 5) {
      setMessage({ text: "Delivery note must be at least 5 characters.", type: "error" });
      return;
    }
    setDelivering(true);
    try {
      await deliverAdminOrder(deliverModal.orderId, deliveryNote.trim());
      setMessage({ text: `Order #${deliverModal.orderId} delivered and email sent.`, type: "success" });
      setDeliverModal(null);
      setDeliveryNote("");
      await load(pagination.page);
    } catch (e) {
      setMessage({ text: getErrorMessage(e, "Delivery failed"), type: "error" });
    } finally {
      setDelivering(false);
    }
  };

  const openDeliveryModal = (order: AdminOrderSummary) => {
    setDeliverModal({ orderId: order.id, product: order.product });
    setDeliveryNote(order.productDeliveryTemplate ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <span className="premium-chip-blue">{pagination.total} orders</span>
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
                    {order.paymentStatus === "Paid" && !order.isDelivered && (
                      <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-purple-600 text-white font-semibold" onPress={() => openDeliveryModal(order)}>
                        Deliver
                      </Button>
                    )}
                    {order.isDelivered && (
                      <span className="text-xs text-[var(--theme-green)] font-semibold">Delivered</span>
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
              {order.paymentStatus === "Paid" && !order.isDelivered && (
                <Button size="sm" radius="full" variant="solid" className="admin-order-action-btn bg-purple-600 text-white font-semibold" onPress={() => openDeliveryModal(order)}>
                  Deliver
                </Button>
              )}
              {order.isDelivered && (
                <span className="text-xs text-[var(--theme-green)] font-semibold">Delivered</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <div className="premium-pagination-wrap">
          <Pagination
            page={pagination.page}
            total={pagination.totalPages}
            onChange={(p) => load(p)}
            radius="full"
            color="primary"
            showControls
          />
        </div>
      )}

      {/* Delivery Note Modal */}
      {deliverModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-2xl" style={{ maxHeight: "min(720px, calc(100vh - 1rem))" }}>
            {/* Header — fixed */}
            <div className="shrink-0 border-b border-[var(--theme-border)] px-4 pb-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-muted)]">Delivery Modal</p>
                  <h3 className="mb-1 text-lg font-bold text-[var(--theme-text)]">Deliver Order #{deliverModal.orderId}</h3>
                  <p className="break-words text-sm text-[var(--theme-muted)]">{deliverModal.product}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[var(--theme-border)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)] transition hover:bg-white/5"
                  onClick={() => { setDeliverModal(null); setDeliveryNote(""); }}
                  disabled={delivering}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <p className="mb-3 text-xs leading-5 text-[var(--theme-muted)]">
                {deliveryNote
                  ? "Pre-filled from the product's delivery template — review and edit before sending."
                  : "Paste the workflow JSON, access credentials, setup instructions, or a download link below."}
                {" "}This will be sent to the client via email and shown in their orders page.
              </p>
              <textarea
                ref={deliveryTextareaRef}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. workflow JSON, credentials, setup instructions, or download link..."
                rows={10}
                className="admin-input min-h-[220px] w-full rounded-xl resize-none text-sm sm:min-h-[280px]"
              />
            </div>

            {/* Footer — fixed */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[var(--theme-border)] px-4 pb-4 pt-4 sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
              <Button
                variant="flat"
                radius="full"
                className="w-full sm:w-auto"
                onPress={() => { setDeliverModal(null); setDeliveryNote(""); }}
                isDisabled={delivering}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                radius="full"
                className="w-full bg-purple-600 text-white font-semibold sm:w-auto"
                onPress={onDeliver}
                isDisabled={delivering || deliveryNote.trim().length < 5}
              >
                {delivering ? "Sending…" : "Send Delivery"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
