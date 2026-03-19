import { Card, CardBody } from "@heroui/react";
import { Boxes, CircleDollarSign, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api";
import type { DashboardSummary } from "../../types";

const metricConfig = [
  { key: "totalUsers", label: "Total Users", icon: Users },
  { key: "totalOrders", label: "Total Orders", icon: CircleDollarSign },
  { key: "activeProducts", label: "Active Products", icon: Boxes },
  { key: "activeVouchers", label: "Active Vouchers", icon: Ticket }
] as const;

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p className="section-subtitle">Loading admin dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-title">Admin Panel</h2>
        <p className="section-subtitle">Operations and business overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="border border-slate-800/80 bg-slate-900/80">
            <CardBody className="flex flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-2xl font-bold text-white">{data[key]}</p>
              </div>
              <div className="rounded-xl border border-slate-700 p-2 text-blue-300">
                <Icon size={20} />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
