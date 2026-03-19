import { Card, CardBody } from "@heroui/react";
import { Boxes, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getAccount, getProducts } from "../api";
import type { Product } from "../types";

type HomeState = {
  fullName: string;
  email: string;
  activeProducts: number;
};

export function UserHomePage() {
  const [state, setState] = useState<HomeState | null>(null);

  useEffect(() => {
    Promise.all([getAccount(), getProducts()])
      .then(([account, products]) => {
        setState({
          fullName: account.data.fullName,
          email: account.data.email,
          activeProducts: (products.data as Product[]).length
        });
      })
      .catch(() => setState(null));
  }, []);

  if (!state) {
    return <p className="section-subtitle">Loading user panel...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="section-title">User Panel</h2>

      <Card className="border border-slate-800 bg-slate-900/70">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Welcome, {state.fullName}</p>
            <p className="section-subtitle">{state.email}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-blue-300">
            <UserRound size={22} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Available products</p>
              <p className="text-2xl font-bold text-white">{state.activeProducts}</p>
            </div>
            <Boxes className="text-emerald-300" />
          </CardBody>
        </Card>

        <Card className="border border-slate-800 bg-slate-900/70">
          <CardBody className="flex flex-row items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Account security</p>
              <p className="text-lg font-semibold text-white">Protected</p>
            </div>
            <ShieldCheck className="text-blue-300" />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
