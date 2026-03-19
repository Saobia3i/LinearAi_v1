import { Button, Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useEffect, useState } from "react";
import { getAdminOrders, getErrorMessage, updateAdminOrderStatus } from "../../api";
import type { AdminOrderSummary } from "../../types";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="section-title">Order Management</h2>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{orders.length}</span>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto">
        <Table aria-label="Admin orders table" className="rounded-xl border border-slate-800">
          <TableHeader>
            <TableColumn>#</TableColumn>
            <TableColumn>Client Email</TableColumn>
            <TableColumn>Product</TableColumn>
            <TableColumn>Price</TableColumn>
            <TableColumn>Date</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Action</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No orders found.">
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-slate-400">#{order.id}</TableCell>
                <TableCell className="text-slate-300">{order.clientEmail}</TableCell>
                <TableCell className="font-medium text-white">{order.product}</TableCell>
                <TableCell className="text-slate-300">৳{order.price}</TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {new Date(order.orderDate).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "2-digit", year: "numeric"
                  })}
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={statusColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.paymentStatus !== "Paid" && (
                      <Button size="sm" variant="flat" color="success" onPress={() => onMark(order.id, "Paid")}>
                        Mark Paid
                      </Button>
                    )}
                    {order.paymentStatus !== "Pending" && (
                      <Button size="sm" variant="flat" color="warning" onPress={() => onMark(order.id, "Pending")}>
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
    </section>
  );
}
