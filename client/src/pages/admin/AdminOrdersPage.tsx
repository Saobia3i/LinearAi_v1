import {
  Button,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@heroui/react";
import { useEffect, useState, type Key } from "react";
import { getAdminOrders, getErrorMessage, updateAdminOrderStatus } from "../../api";
import type { AdminOrderSummary } from "../../types";

const statuses = ["Pending", "Paid", "Failed", "Cancelled", "Refunded"];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const response = await getAdminOrders();
    setOrders(response.data ?? []);
  };

  useEffect(() => {
    load().catch(() => setOrders([]));
  }, []);

  const onUpdateStatus = async (id: number, status: string) => {
    try {
      await updateAdminOrderStatus(id, status);
      setMessage("Order status updated.");
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Status update failed"));
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="section-title">Admin Orders</h2>
      {message && <p className="section-subtitle">{message}</p>}

      <Table aria-label="Admin orders table" className="rounded-xl border border-slate-800">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Customer</TableColumn>
          <TableColumn>Product</TableColumn>
          <TableColumn>Price</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Action</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No orders found.">
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{order.clientEmail}</TableCell>
              <TableCell>{order.product}</TableCell>
              <TableCell>৳{order.price}</TableCell>
              <TableCell>{order.paymentStatus}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`status-${order.id}`}
                    selectedKeys={[order.paymentStatus]}
                    size="sm"
                    className="min-w-36"
                    onSelectionChange={(keys: "all" | Set<Key>) => {
                      if (keys === "all") return;
                      const value = Array.from(keys)[0]?.toString();
                      if (value) onUpdateStatus(order.id, value);
                    }}>
                    {statuses.map((status) => (
                      <SelectItem key={status}>{status}</SelectItem>
                    ))}
                  </Select>
                  <Button size="sm" variant="flat" onPress={() => onUpdateStatus(order.id, order.paymentStatus)}>
                    Save
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
