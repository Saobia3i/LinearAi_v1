import { Card, CardBody } from "@heroui/react";
import { Boxes, CircleDollarSign, Clock, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api";
import { useAuth } from "../../context/AuthContext";
import type { DashboardSummary } from "../../types";

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) return <p className="section-subtitle">Loading admin dashboard...</p>;

  return (
    <section className="premium-section">
      <div className="premium-section-head">
        <div>
          <p className="premium-kicker">Admin Control Room</p>
          <h2 className="section-title">Admin Panel</h2>
          <p className="section-subtitle">Operations and business overview.</p>
        </div>
      </div>

      <div className="premium-stats-grid">
        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Total Users</p>
              <p className="premium-stat-value">{data.totalUsers}</p>
            </div>
            <div className="premium-icon-badge premium-icon-blue">
              <Users size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Total Orders</p>
              <p className="premium-stat-value">{data.totalOrders}</p>
            </div>
            <div className="premium-icon-badge premium-icon-blue">
              <CircleDollarSign size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Pending Orders</p>
              <p className="text-3xl font-black text-[var(--theme-yellow)]">{data.pendingOrders}</p>
            </div>
            <div className="premium-icon-badge premium-icon-yellow">
              <Clock size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Active Products</p>
              <p className="premium-stat-value">{data.activeProducts}</p>
              <p className="text-xs text-[var(--theme-muted)]">of {data.totalProducts} total</p>
            </div>
            <div className="premium-icon-badge premium-icon-green">
              <Boxes size={20} />
            </div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Active Vouchers</p>
              <p className="premium-stat-value">{data.activeVouchers}</p>
              <p className="text-xs text-[var(--theme-muted)]">of {data.totalVouchers} total</p>
            </div>
            <div className="premium-icon-badge premium-icon-red">
              <Ticket size={20} />
            </div>
          </CardBody>
        </Card>
      </div>

      {user && (
        <Card className="premium-card">
          <CardBody className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-blue)]/15 text-xl font-black text-[var(--theme-blue)]">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--theme-text)]">{user.fullName}</p>
              <p className="text-sm text-[var(--theme-muted)]">{user.email}</p>
            </div>
            <span className="premium-chip-blue sm:ml-auto">{user.role}</span>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
