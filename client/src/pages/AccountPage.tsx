import { useEffect, useState } from "react";
import { getAccount } from "../api";
import type { AccountInfo } from "../types";

export function AccountPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);

  useEffect(() => {
    getAccount()
      .then((res) => setAccount(res.data))
      .catch(() => setAccount(null));
  }, []);

  if (!account) {
    return <p>Failed to load account.</p>;
  }

  return (
    <section className="card">
      <h3>{account.fullName}</h3>
      <p>{account.email}</p>
      <p>{account.phoneNumber ?? "No phone number"}</p>
      <p>Joined: {new Date(account.createdAt).toLocaleDateString()}</p>
      <p>Status: {account.isActive ? "Active" : "Inactive"}</p>
    </section>
  );
}
