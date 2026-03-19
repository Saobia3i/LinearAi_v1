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
    <section className="space-y-6">
      <div>
        <h2 className="section-title">Admin Panel</h2>
        <p className="section-subtitle">Operations and business overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border border-slate-800/80 bg-slate-900/80">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{data.totalUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-700 p-2 text-blue-300"><Users size={20} /></div>
          </CardBody>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Orders</p>
              <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-slate-700 p-2 text-blue-300"><CircleDollarSign size={20} /></div>
          </CardBody>
        </Card>

        <Card className="border border-yellow-800/50 bg-yellow-900/20">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Pending Orders</p>
              <p className="text-2xl font-bold text-yellow-300">{data.pendingOrders}</p>
            </div>
            <div className="rounded-xl border border-yellow-700/50 p-2 text-yellow-300"><Clock size={20} /></div>
          </CardBody>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Active Products</p>
              <p className="text-2xl font-bold text-white">{data.activeProducts}</p>
              <p className="text-xs text-slate-500">of {data.totalProducts} total</p>
            </div>
            <div className="rounded-xl border border-slate-700 p-2 text-blue-300"><Boxes size={20} /></div>
          </CardBody>
        </Card>

        <Card className="border border-slate-800/80 bg-slate-900/80">
          <CardBody className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Active Vouchers</p>
              <p className="text-2xl font-bold text-white">{data.activeVouchers}</p>
              <p className="text-xs text-slate-500">of {data.totalVouchers} total</p>
            </div>
            <div className="rounded-xl border border-slate-700 p-2 text-blue-300"><Ticket size={20} /></div>
          </CardBody>
        </Card>
      </div>

      {/* Admin info card */}
      {user && (
        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-xl font-bold text-blue-300">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{user.fullName}</p>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
            <div className="ml-auto">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                {user.role}
              </span>
            </div>
          </CardBody>
        </Card>
      )}
    </section>
  );
}
