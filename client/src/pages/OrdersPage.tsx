import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { useEffect, useState } from "react";
import { getOrders } from "../api";
import type { OrderSummary } from "../types";

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data ?? []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="section-title">My Orders</h2>

      <Table aria-label="Orders table" className="rounded-xl border border-slate-800">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>PRODUCT</TableColumn>
          <TableColumn>DURATION</TableColumn>
          <TableColumn>AMOUNT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>DATE</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No orders yet.">
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{order.productTitle}</TableCell>
              <TableCell>{order.durationMonths ?? 0} months</TableCell>
              <TableCell>৳{order.finalAmount}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={order.paymentStatus === "Paid" ? "success" : order.paymentStatus === "Pending" ? "warning" : "danger"}>
                  {order.paymentStatus}
                </Chip>
              </TableCell>
              <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
