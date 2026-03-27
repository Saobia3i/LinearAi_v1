import { Card, CardBody, Chip } from "@heroui/react";
import { Boxes, CircleDollarSign, Clock, MessageSquare, Radio, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getAdminDashboard, getAdminFeedbacks, getErrorMessage, toggleFeedbackPost } from "../../api";
import { AppButton as Button } from "../../components/ui/AppButton";
import { useAuth } from "../../context/AuthContext";
import type { DashboardSummary, FeedbackItem } from "../../types";

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbLoading, setFbLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null));

    getAdminFeedbacks()
      .then((res) => setFeedbacks(res.data))
      .catch(() => setFeedbacks([]))
      .finally(() => setFbLoading(false));
  }, []);

  const onTogglePost = async (id: number) => {
    setTogglingId(id);
    setMsg(null);
    try {
      const res = await toggleFeedbackPost(id);
      setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, isPosted: res.data.isPosted } : f));
      setMsg({ id, text: res.message ?? "Done" });
    } catch (e) {
      setMsg({ id, text: getErrorMessage(e, "Failed") });
    } finally {
      setTogglingId(null);
    }
  };

  if (!data) return <p className="section-subtitle">Loading admin dashboard...</p>;

  const reviewFeedbacks = feedbacks.filter((item) => item.type === "feedback");
  const contactMessages = feedbacks.filter((item) => item.type === "contact");

  const renderFeedbackList = (
    items: FeedbackItem[],
    options: { emptyText: string; showPostAction: boolean }
  ) => {
    if (fbLoading) {
      return <p className="section-subtitle">Loading...</p>;
    }

    if (items.length === 0) {
      return <p className="section-subtitle">{options.emptyText}</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between"
            style={{
              borderColor: item.isPosted ? "color-mix(in srgb, var(--theme-green) 40%, transparent)" : "var(--theme-border)",
              background: item.isPosted ? "color-mix(in srgb, var(--theme-green) 6%, var(--theme-surface))" : "var(--theme-surface-soft)",
            }}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[var(--theme-text)]">{item.userName}</span>
                <span className="text-xs text-[var(--theme-muted)]">{item.userEmail}</span>
                <Chip size="sm" variant="flat" color={item.type === "contact" ? "warning" : "primary"}>
                  {item.type === "contact" ? "Contact" : "Feedback"}
                </Chip>
                {item.isPosted && <Chip size="sm" variant="flat" color="success">Posted</Chip>}
              </div>
              {item.subject && <p className="text-xs font-semibold text-[var(--theme-muted)]">Subject: {item.subject}</p>}
              <p className="break-words text-sm text-[var(--theme-text)]">{item.message}</p>
              <p className="text-xs text-[var(--theme-muted)]">
                {new Date(item.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
              {msg?.id === item.id && (
                <p className="text-xs font-medium text-[var(--theme-green)]">{msg.text}</p>
              )}
            </div>

            {options.showPostAction && (
              <Button
                size="sm"
                radius="full"
                variant={item.isPosted ? "flat" : "solid"}
                color={item.isPosted ? "danger" : "success"}
                isLoading={togglingId === item.id}
                startContent={togglingId !== item.id ? <Radio size={13} /> : undefined}
                onPress={() => onTogglePost(item.id)}
                className="shrink-0"
              >
                {item.isPosted ? "Unpost" : "Post"}
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

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
            <div className="premium-icon-badge premium-icon-blue"><Users size={20} /></div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Total Orders</p>
              <p className="premium-stat-value">{data.totalOrders}</p>
            </div>
            <div className="premium-icon-badge premium-icon-blue"><CircleDollarSign size={20} /></div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Pending Orders</p>
              <p className="text-3xl font-black text-[var(--theme-yellow)]">{data.pendingOrders}</p>
            </div>
            <div className="premium-icon-badge premium-icon-yellow"><Clock size={20} /></div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Active Products</p>
              <p className="premium-stat-value">{data.activeProducts}</p>
              <p className="text-xs text-[var(--theme-muted)]">of {data.totalProducts} total</p>
            </div>
            <div className="premium-icon-badge premium-icon-green"><Boxes size={20} /></div>
          </CardBody>
        </Card>

        <Card className="premium-stat">
          <CardBody className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="premium-stat-label">Active Vouchers</p>
              <p className="premium-stat-value">{data.activeVouchers}</p>
              <p className="text-xs text-[var(--theme-muted)]">of {data.totalVouchers} total</p>
            </div>
            <div className="premium-icon-badge premium-icon-red"><Ticket size={20} /></div>
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

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="premium-card">
          <CardBody className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="premium-icon-badge premium-icon-blue">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--theme-text)]">User Feedback</h3>
                <p className="text-xs text-[var(--theme-muted)]">Post selected feedback on the home page reviews section</p>
              </div>
            </div>

            {renderFeedbackList(reviewFeedbacks, {
              emptyText: "No feedback yet.",
              showPostAction: true
            })}
          </CardBody>
        </Card>

        <Card className="premium-card">
          <CardBody className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <div className="premium-icon-badge premium-icon-yellow">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--theme-text)]">Contact Messages</h3>
                <p className="text-xs text-[var(--theme-muted)]">Customer support requests and direct contact submissions</p>
              </div>
            </div>

            {renderFeedbackList(contactMessages, {
              emptyText: "No contact messages yet.",
              showPostAction: false
            })}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
