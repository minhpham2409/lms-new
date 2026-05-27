"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  Loader2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  CreditCard,
  Clock,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/** Auto-fetch QR for remaining payment amount */
function IssueQrBlock({ orderId, remainingAmount, token }: { orderId: string; remainingAmount: number; token: string | null }) {
  const [qrData, setQrData] = useState<{ vietQrUrl: string; addInfo: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !token) return;
    setLoading(true);
    fetch(`${API}/payments/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setQrData({ vietQrUrl: data.vietQrUrl, addInfo: data.addInfo });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <span className="ml-2 text-sm">Đang tạo mã QR...</span>
      </div>
    );
  }

  if (!qrData) return <p className="text-xs text-red-400">Không thể tạo mã QR.</p>;

  return (
    <div className="text-center">
      <div className="w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-3 bg-white border-2 border-yellow-500/30">
        <img src={qrData.vietQrUrl} alt="QR Thanh toán phần còn thiếu" className="w-44 h-44 object-contain" />
      </div>
      <p className="text-xs font-mono px-2 py-1.5 rounded-lg inline-block bg-yellow-500/10 mb-2">
        Nội dung CK: <span className="font-bold">{qrData.addInfo}</span>
      </p>
      <div className="flex justify-between px-4 py-3 rounded-lg bg-yellow-500/10 text-sm mt-2">
        <span style={{ color: "#6a6f73" }}>Số tiền cần chuyển</span>
        <span className="font-extrabold text-yellow-600">{Number(remainingAmount).toLocaleString("vi-VN")} ₫</span>
      </div>
      <p className="text-[10px] mt-2" style={{ color: "#6a6f73" }}>
        ⚠️ Nội dung chuyển khoản phải chứa đúng mã trên
      </p>
    </div>
  );
}

export default function ParentPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [childCourses, setChildCourses] = useState<any[]>([]);
  const [childDashboard, setChildDashboard] = useState<any>(null);
  const [_childProgress, setChildProgress] = useState<any>(null);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [linkUsername, setLinkUsername] = useState("");
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [childGrades, setChildGrades] = useState<any[]>([]);
  const [childTransactions, setChildTransactions] = useState<any[]>([]);
  const [tab, setTab] = useState<
    "overview" | "courses" | "grades" | "payments" | "history" | "requests"
  >("overview");
  const [qrPopup, setQrPopup] = useState<{
    url: string;
    amount: number;
    id: string;
  } | null>(null);
  const [paymentSuccessPopup, setPaymentSuccessPopup] = useState<any | null>(
    null,
  );
  const [paymentIssuePopup, setPaymentIssuePopup] = useState<any | null>(null);
  const [refundForm, setRefundForm] = useState({
    bankName: "",
    bankAccount: "",
    bankOwner: "",
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const pageOpenedAtRef = useRef(Date.now());
  const shownPaidOrderIdsRef = useRef<Set<string>>(new Set());
  const shownPaymentIssueIdsRef = useRef<Set<string>>(new Set());
  const shownPaymentIssueKeysRef = useRef<Set<string>>(new Set());
  const shownPaymentNotificationIdsRef = useRef<Set<string>>(new Set());
  const activePaymentIssueKeyRef = useRef<string | null>(null);

  const isOrderPaid = (order: any) =>
    order?.status === "paid" || order?.payment?.status === "completed";

  const paymentIssueSeenStorageKey = `parent_payment_issue_seen:${user?.id || "anonymous"}`;

  function buildPaymentIssueKey(order: any, fallbackId?: string) {
    const issue = order?.paymentIssue || {};
    const payload = issue.payload || {};
    const payment = order?.payment || {};
    const paidAmount = Number(
      payload.paidAmount ??
        payload.transferAmount ??
        payload.amount ??
        payment.paidAmount ??
        0,
    );
    const expectedAmount = Number(
      payload.expectedAmount ??
        payment.amount ??
        order?.finalPrice ??
        order?.totalPrice ??
        0,
    );
    const remainingAmount = Number(
      order?.remainingAmount ??
        payment.remainingAmount ??
        payload.remainingAmount ??
        0,
    );
    const overpaidAmount = Number(
      order?.overpaidAmount ??
        payment.overpaidAmount ??
        payload.overpaidAmount ??
        0,
    );
    const txnRef = payment.txnRef || issue.txnRef || payload.txnRef || "";

    return [
      order?.id || fallbackId || "unknown-order",
      txnRef,
      paidAmount,
      expectedAmount,
      remainingAmount,
      overpaidAmount,
    ].join("|");
  }

  function getStoredPaymentIssueKeys() {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = window.sessionStorage.getItem(paymentIssueSeenStorageKey);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set<string>();
    }
  }

  function hasShownPaymentIssue(key: string) {
    if (!key) return true;
    if (activePaymentIssueKeyRef.current === key) return true;
    if (shownPaymentIssueKeysRef.current.has(key)) return true;
    const stored = getStoredPaymentIssueKeys();
    if (stored.has(key)) {
      shownPaymentIssueKeysRef.current.add(key);
      return true;
    }
    return false;
  }

  function markPaymentIssueShown(key: string) {
    if (!key) return;
    shownPaymentIssueKeysRef.current.add(key);
    activePaymentIssueKeyRef.current = key;
    if (typeof window === "undefined") return;
    try {
      const stored = getStoredPaymentIssueKeys();
      stored.add(key);
      window.sessionStorage.setItem(
        paymentIssueSeenStorageKey,
        JSON.stringify(Array.from(stored).slice(-80)),
      );
    } catch {}
  }

  function closePaymentIssuePopup() {
    activePaymentIssueKeyRef.current = null;
    setPaymentIssuePopup(null);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    if (user?.role !== "parent") {
      if (user?.role === "admin") router.push("/admin");
      else if (user?.role === "teacher") router.push("/teacher");
      else router.push("/dashboard");
    }
  }, [user, isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (token && user?.role === "parent") fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  useEffect(() => {
    if (!token || user?.role !== "parent" || children.length === 0) return;

    const pendingIds = new Set(pendingOrders.map((order) => order.id));
    let cancelled = false;

    const pollPaidOrders = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      for (const kid of children) {
        const childId = kid.child?.id || kid.childId;
        if (!childId) continue;

        try {
          const res = await fetch(`${API}/parents/children/${childId}/orders`, {
            headers,
          });
          if (!res.ok) continue;

          const orders = await res.json();
          const issueOrder = Array.isArray(orders)
            ? orders.find((order: any) => {
                const issue = order.paymentIssue;
                if (
                  !issue ||
                  shownPaymentIssueIdsRef.current.has(issue.id) ||
                  hasShownPaymentIssue(buildPaymentIssueKey(order, issue.id))
                ) {
                  return false;
                }

                const issueTime = issue.receivedAt
                  ? new Date(issue.receivedAt).getTime()
                  : 0;
                return pendingIds.has(order.id) || issueTime >= pageOpenedAtRef.current;
              })
            : null;

          if (issueOrder && !cancelled) {
            shownPaymentIssueIdsRef.current.add(issueOrder.paymentIssue.id);
            const issueKey = buildPaymentIssueKey(issueOrder, issueOrder.paymentIssue.id);
            markPaymentIssueShown(issueKey);
            const childName = kid.child?.firstName || kid.child?.username || "Con";
            setQrPopup((current) =>
              current?.id === issueOrder.id ? null : current,
            );
            setPaymentIssuePopup({ ...issueOrder, childName });
            setChildTransactions((prev) =>
              prev.map((order) => (order.id === issueOrder.id ? issueOrder : order)),
            );
            toast.error("Thanh toán chưa khớp số tiền. Vui lòng kiểm tra lại.");
            fetchAll();
            if (selectedChild) selectChild(selectedChild);
            break;
          }

          const paidOrder = Array.isArray(orders)
            ? orders.find((order: any) => {
                if (!isOrderPaid(order) || shownPaidOrderIdsRef.current.has(order.id)) {
                  return false;
                }

                const paidAt = order.payment?.paidAt || order.updatedAt || order.createdAt;
                const paidTime = paidAt ? new Date(paidAt).getTime() : 0;
                return pendingIds.has(order.id) || paidTime >= pageOpenedAtRef.current;
              })
            : null;

          if (!paidOrder || cancelled) continue;

          shownPaidOrderIdsRef.current.add(paidOrder.id);
          const childName = kid.child?.firstName || kid.child?.username || "Con";
          const popupOrder = { ...paidOrder, childName };
          setQrPopup((current) =>
            current?.id === paidOrder.id ? null : current,
          );
          setPaymentSuccessPopup(popupOrder);
          setPendingOrders((prev) =>
            prev.filter((order) => order.id !== paidOrder.id),
          );
          setChildTransactions((prev) =>
            prev.map((order) => (order.id === paidOrder.id ? paidOrder : order)),
          );
          toast.success("Thanh toán thành công! Khóa học đã được kích hoạt.");
          fetchAll();
          if (selectedChild) selectChild(selectedChild);
          break;
        } catch {}
      }
    };

    pollPaidOrders();
    const interval = setInterval(pollPaidOrders, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, pendingOrders, selectedChild, token, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== "parent" || children.length === 0) return;

    let cancelled = false;
    const pollPaymentNotifications = async () => {
      try {
        const res = await fetch(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const notifications = await res.json();
        if (!Array.isArray(notifications)) return;

        const notification = notifications.find((n: any) =>
          (n.type === "payment_success" || n.type === "payment_issue" || n.type === "payment_overpaid" || n.type === "refund_paid") &&
          !shownPaymentNotificationIdsRef.current.has(n.id) &&
          new Date(n.createdAt).getTime() >= pageOpenedAtRef.current,
        );
        if (!notification || cancelled) return;

        shownPaymentNotificationIdsRef.current.add(notification.id);
        const payload = JSON.parse(notification.message || "{}");
        const order = await findLinkedChildOrder(payload.orderId);
        if (!order || cancelled) return;

        if (notification.type === "refund_paid") {
          toast.success("Admin đã xác nhận hoàn tiền chuyển khoản dư.");
          fetchAll();
          if (selectedChild) selectChild(selectedChild);
          return;
        }

        if (notification.type === "payment_success") {
          shownPaidOrderIdsRef.current.add(order.id);
          setPaymentSuccessPopup(order);
          toast.success("Thanh toán thành công! Khóa học đã được kích hoạt.");
        } else {
          const issueOrder = {
            ...order,
            paymentIssue: {
              id: notification.id,
              payload: {
                amount: payload.paidAmount,
                expectedAmount: payload.expectedAmount,
                overpaidAmount: payload.overpaidAmount,
              },
            },
            payment: {
              ...(order.payment || {}),
              amount: payload.expectedAmount,
            },
            remainingAmount: payload.remainingAmount || null,
            overpaidAmount: payload.overpaidAmount || null,
          };
          const issueKey = buildPaymentIssueKey(issueOrder, notification.id);
          if (hasShownPaymentIssue(issueKey)) return;

          shownPaymentIssueIdsRef.current.add(notification.id);
          markPaymentIssueShown(issueKey);
          setPaymentIssuePopup(issueOrder);
          if (payload.remainingAmount) {
            toast.warning(`Chuyển thiếu ${Number(payload.remainingAmount).toLocaleString("vi-VN")} ₫. Mã QR mới đã được tạo.`);
          } else if (payload.overpaidAmount) {
            toast.warning(`Thanh toán dư ${Number(payload.overpaidAmount).toLocaleString("vi-VN")} ₫. Vui lòng nhập thông tin hoàn tiền.`);
          } else {
            toast.error("Thanh toán chưa khớp số tiền. Vui lòng kiểm tra lại.");
          }
        }

        fetchAll();
        if (selectedChild) selectChild(selectedChild);
      } catch {}
    };

    pollPaymentNotifications();
    const interval = setInterval(pollPaymentNotifications, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, selectedChild, token, user?.role]);

  async function findLinkedChildOrder(orderId: string) {
    if (!orderId) return null;
    const headers = { Authorization: `Bearer ${token}` };

    for (const kid of children) {
      const childId = kid.child?.id || kid.childId;
      if (!childId) continue;

      try {
        const res = await fetch(`${API}/parents/children/${childId}/orders`, {
          headers,
        });
        if (!res.ok) continue;
        const orders = await res.json();
        const order = Array.isArray(orders)
          ? orders.find((item: any) => item.id === orderId)
          : null;
        if (order) {
          return {
            ...order,
            childName: kid.child?.firstName || kid.child?.username || "Con",
          };
        }
      } catch {}
    }

    return null;
  }

  async function fetchAll() {
    setDataLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [childrenR, outR, inR] = await Promise.all([
        fetch(`${API}/parents/me/children`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`${API}/parents/link-requests/outgoing`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`${API}/parents/link-requests/incoming`, { headers }).then((r) =>
          r.ok ? r.json() : [],
        ),
      ]);
      const kids = Array.isArray(childrenR) ? childrenR : [];
      setChildren(kids);
      setOutgoingRequests(Array.isArray(outR) ? outR : []);
      setIncomingRequests(Array.isArray(inR) ? inR : []);
      if (kids.length > 0 && !selectedChild) {
        selectChild(kids[0]);
      }
      // Fetch pending orders from children
      const allOrders: any[] = [];
      for (const kid of kids) {
        const childId = kid.child?.id || kid.childId;
        console.log("Checking orders for kid:", kid, "childId:", childId);
        if (!childId) continue;
        try {
          const ordersR = await fetch(
            `${API}/parents/children/${childId}/orders`,
            { headers },
          ).then((r) => {
            console.log("Orders for child", childId, "status:", r.status);
            return r.ok ? r.json() : [];
          });
          // filter for pending orders (parent sees child’s pending)
          if (Array.isArray(ordersR)) {
            ordersR
              .filter((o: any) => o.status === "pending")
              .forEach((o: any) =>
                allOrders.push({
                  ...o,
                  childName:
                    kid.child?.firstName || kid.child?.username || "Con",
                }),
              );
          }
        } catch {}
      }
      setPendingOrders(allOrders);

      // Auto-generate QR codes for pending orders
      for (const order of allOrders) {
        if (order._qrData) continue; // already has QR
        try {
          const qrRes = await fetch(`${API}/payments/qr`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ orderId: order.id }),
          });
          if (qrRes.ok) {
            const qr = await qrRes.json();
            order._qrData = { vietQrUrl: qr.vietQrUrl, addInfo: qr.addInfo, txnRef: qr.txnRef };
          }
        } catch {}
      }
      setPendingOrders([...allOrders]); // trigger re-render with QR data
    } catch {
    } finally {
      setDataLoading(false);
    }
  }

  async function selectChild(c: any) {
    setSelectedChild(c);
    const childId = c.child?.id || c.childId;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [coursesR, dashR, progressR, gradesR, txR] = await Promise.all([
        fetch(`${API}/parents/children/${childId}/courses`, { headers }).then(
          (r) => (r.ok ? r.json() : []),
        ),
        fetch(`${API}/parents/children/${childId}/dashboard`, { headers }).then(
          (r) => (r.ok ? r.json() : null),
        ),
        fetch(`${API}/parents/children/${childId}/progress`, { headers }).then(
          (r) => (r.ok ? r.json() : null),
        ),
        fetch(`${API}/parents/children/${childId}/grades`, { headers }).then(
          (r) => (r.ok ? r.json() : []),
        ),
        fetch(`${API}/parents/children/${childId}/orders`, { headers }).then(
          (r) => (r.ok ? r.json() : []),
        ),
      ]);
      setChildCourses(Array.isArray(coursesR) ? coursesR : []);
      setChildDashboard(dashR);
      setChildProgress(progressR);
      setChildGrades(Array.isArray(gradesR) ? gradesR : []);
      setChildTransactions(Array.isArray(txR) ? txR : []);
    } catch {}
  }

  async function linkChild() {
    if (!linkUsername.trim()) return;
    try {
      const res = await fetch(`${API}/parents/link-child`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ identifier: linkUsername.trim() }),
      });
      if (res.ok) {
        setLinkUsername("");
        toast.success("Đã gửi yêu cầu liên kết! Chờ học sinh xác nhận.");
        fetchAll();
      } else {
        const d = await res.json();
        toast.error(d.message || "Không tìm thấy học sinh");
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  async function acceptRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã chấp nhận!");
        fetchAll();
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  async function rejectRequest(id: string) {
    try {
      const res = await fetch(`${API}/parents/link-request/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Đã từ chối");
        fetchAll();
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  async function deleteRequest(id: string) {
    try {
      await fetch(`${API}/parents/link-requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa");
      fetchAll();
    } catch {
      toast.error("Lỗi");
    }
  }

  async function unlinkChild(childId: string) {
    if (!confirm("Hủy liên kết với con?")) return;
    try {
      await fetch(`${API}/parents/children/${childId}/link`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã hủy liên kết");
      setSelectedChild(null);
      fetchAll();
    } catch {
      toast.error("Lỗi");
    }
  }

  async function submitRefundRequest() {
    if (!paymentIssuePopup?.overpaidAmount) return;
    if (!refundForm.bankName.trim() || !refundForm.bankAccount.trim() || !refundForm.bankOwner.trim()) {
      toast.error("Vui lòng nhập đủ thông tin ngân hàng");
      return;
    }

    setRefundSubmitting(true);
    try {
      const res = await fetch(`${API}/payments/refund-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: paymentIssuePopup.id,
          amount: paymentIssuePopup.overpaidAmount,
          ...refundForm,
        }),
      });
      if (!res.ok) throw new Error("refund_failed");

      toast.success("Đã gửi yêu cầu hoàn tiền cho giáo viên");
      closePaymentIssuePopup();
      setRefundForm({ bankName: "", bankAccount: "", bankOwner: "" });
      fetchAll();
    } catch {
      toast.error("Không thể gửi yêu cầu hoàn tiền");
    } finally {
      setRefundSubmitting(false);
    }
  }

  if (authLoading || !user || user.role !== "parent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="w-8 h-8 border-2 border-[#FFCCAA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const child = selectedChild?.child || selectedChild;
  const issuePayload = paymentIssuePopup?.paymentIssue?.payload || {};
  const issuePaidAmount = Number(
    issuePayload.transferAmount ?? issuePayload.amount ?? 0,
  );
  const issueExpectedAmount = Number(
    issuePayload.expectedAmount ||
      paymentIssuePopup?.payment?.amount ||
      paymentIssuePopup?.finalPrice ||
      paymentIssuePopup?.totalPrice ||
      0,
  );
  const issueDifference = Number(paymentIssuePopup?.overpaidAmount || 0) ||
    issuePaidAmount - issueExpectedAmount;
  const gradedCount = childGrades.filter(
    (g: any) => g.status === "graded",
  ).length;
  const tabs = [
    { id: "requests" as const, label: "Liên kết", icon: UserPlus },
    { id: "overview" as const, label: "Tổng quan", icon: BarChart3 },
    { id: "courses" as const, label: "Khóa học", icon: BookOpen },
    {
      id: "grades" as const,
      label: "Bảng điểm",
      icon: Award,
      badge: gradedCount,
    },
    {
      id: "payments" as const,
      label: "Thanh toán",
      icon: CreditCard,
      badge: pendingOrders.length,
    },
    { id: "history" as const, label: "Lịch sử giao dịch", icon: Clock },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* QR Popup overlay */}
      {qrPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setQrPopup(null)}
        >
          <div
            className="bg-card border border-border shadow-md max-w-sm w-full text-center relative p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrPopup(null)}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-2">Quét mã thanh toán</h2>
            <p
              className="text-sm mb-6"
              style={{ color: "#6a6f73" }}
            >
              Đơn hàng{" "}
              <span className="font-mono" style={{ color: "#F8B486" }}>
                #{qrPopup.id?.substring(0, 8)}
              </span>
            </p>
            <div className="bg-white p-2 rounded-2xl mx-auto w-fit mb-6">
              <img
                src={qrPopup.url}
                alt="QR Code Lớn"
                className="w-72 h-72 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  (e.target as HTMLImageElement).src =
                    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Thanh toan ${qrPopup.amount} VND`)}`;
                }}
              />
            </div>
            <p className="text-3xl font-extrabold gradient-text mb-2">
              {qrPopup.amount.toLocaleString()} ₫
            </p>
            <p className="text-xs" style={{ color: "#FFCCAA" }}>
              Dùng ứng dụng ngân hàng để quét mã QR
            </p>
          </div>
        </div>
      )}

      {paymentSuccessPopup && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setPaymentSuccessPopup(null)}
        >
          <div
            className="bg-card border border-border shadow-lg max-w-md w-full text-center relative p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPaymentSuccessPopup(null)}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Đóng"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">
              Thanh toán thành công
            </h2>
            <p className="text-sm mb-5" style={{ color: "#6a6f73" }}>
              Đơn hàng{" "}
              <span className="font-mono font-bold">
                #{paymentSuccessPopup.id?.substring(0, 8)}
              </span>{" "}
              của {paymentSuccessPopup.childName || "con"} đã được xác nhận.
            </p>
            <div className="rounded-xl p-4 mb-6 bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-600">
                Khóa học đã được kích hoạt cho học sinh.
              </p>
              <p className="text-2xl font-extrabold mt-2 gradient-text">
                {Number(
                  paymentSuccessPopup.finalPrice ||
                    paymentSuccessPopup.totalPrice ||
                    0,
                ).toLocaleString("vi-VN")}{" "}
                ₫
              </p>
            </div>
            <button
              onClick={() => {
                setPaymentSuccessPopup(null);
                setTab("history");
              }}
              className="btn-primary w-full justify-center"
            >
              Xem lịch sử giao dịch
            </button>
          </div>
        </div>
      )}

      {paymentIssuePopup && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={closePaymentIssuePopup}
        >
          <div
            className="bg-card border border-border shadow-lg max-w-md w-full text-center relative p-8 animate-scale-in overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePaymentIssuePopup}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Đóng"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center bg-yellow-500/10 text-yellow-500">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">
              {paymentIssuePopup.remainingAmount
                ? "Chuyển khoản thiếu tiền"
                : paymentIssuePopup.overpaidAmount
                  ? "Thanh toán dư tiền"
                  : "Thanh toán chưa khớp"}
            </h2>
            <p className="text-sm mb-5" style={{ color: "#6a6f73" }}>
              Đơn hàng{" "}
              <span className="font-mono font-bold">
                #{paymentIssuePopup.id?.substring(0, 8)}
              </span>{" "}
              của {paymentIssuePopup.childName || "con"}{" "}
              {paymentIssuePopup.overpaidAmount ? "đã được kích hoạt." : "chưa được kích hoạt."}
            </p>
            <div className="rounded-xl p-4 mb-4 bg-yellow-500/10 border border-yellow-500/20 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6a6f73" }}>Cần thanh toán</span>
                <span className="font-bold">
                  {issueExpectedAmount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6a6f73" }}>Đã chuyển</span>
                <span className="font-bold text-green-500">
                  {issuePaidAmount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-yellow-500/20">
                <span className="font-bold">
                  {issueDifference < 0 ? "Còn thiếu" : "Chuyển thừa"}
                </span>
                <span className="font-extrabold text-yellow-600">
                  {Math.abs(issueDifference).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            {/* Auto QR for remaining amount */}
            {paymentIssuePopup.remainingAmount && issueDifference < 0 && (
              <div className="mb-4">
                <p className="text-sm font-bold mb-3 text-yellow-600">
                  Mã QR mới đã được tạo tự động cho số tiền còn thiếu
                </p>
                <IssueQrBlock orderId={paymentIssuePopup.id} remainingAmount={paymentIssuePopup.remainingAmount} token={token} />
              </div>
            )}

            {paymentIssuePopup.overpaidAmount && (
              <div className="mb-4 text-left space-y-3">
                <p className="text-xs" style={{ color: "#6a6f73" }}>
                  Nhập tài khoản nhận hoàn tiền để giáo viên xử lý số tiền chuyển dư.
                </p>
                <input
                  value={refundForm.bankName}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, bankName: e.target.value }))}
                  placeholder="Tên ngân hàng"
                  className="w-full px-4 py-3 border border-border bg-transparent outline-none focus:border-primary"
                />
                <input
                  value={refundForm.bankAccount}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                  placeholder="Số tài khoản"
                  className="w-full px-4 py-3 border border-border bg-transparent outline-none focus:border-primary"
                />
                <input
                  value={refundForm.bankOwner}
                  onChange={(e) => setRefundForm((prev) => ({ ...prev, bankOwner: e.target.value }))}
                  placeholder="Tên chủ tài khoản"
                  className="w-full px-4 py-3 border border-border bg-transparent outline-none focus:border-primary"
                />
              </div>
            )}

            {!paymentIssuePopup.remainingAmount && !paymentIssuePopup.overpaidAmount && (
              <p className="text-xs mb-6" style={{ color: "#6a6f73" }}>
                Vui lòng liên hệ giáo viên hoặc bộ phận hỗ trợ để được đối soát và xử lý thanh toán.
              </p>
            )}
            {paymentIssuePopup.overpaidAmount ? (
              <button
                onClick={submitRefundRequest}
                disabled={refundSubmitting}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {refundSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Gửi yêu cầu hoàn tiền
              </button>
            ) : (
              <button
                onClick={() => {
                  closePaymentIssuePopup();
                  fetchAll();
                  if (selectedChild) selectChild(selectedChild);
                }}
                className="btn-secondary w-full justify-center"
              >
                {paymentIssuePopup.remainingAmount ? "Đóng & Xem đơn hàng" : "Xem lịch sử giao dịch"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pt-20 pb-24">
        {/* Hero Header */}
        <div className="relative overflow-hidden pt-24 pb-16 mb-8 border-b border-border">
          <div className="absolute inset-0 bg-[url('/images/hero_star_light.png')] bg-cover bg-center opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#051025] via-[#051025]/85 to-[#0A1A35]/70" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold mb-2 text-[#F8FAFC]">
                  Phụ huynh Dashboard
                </h1>
                <p className="text-base font-medium text-[#CBD5E1]">
                  Đồng hành cùng bước tiến học tập của con bạn mỗi ngày.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAll}
                  className="bg-[#F8B486] text-[#051025] px-5 py-2.5 shadow-sm hover:bg-[#FFCCAA] transition-all font-bold flex items-center gap-2 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {dataLoading ? (
            <div className="flex justify-center py-20">
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: "#F8B486" }}
              />
            </div>
          ) : (
            <>
              {/* Link child input */}
              <div className="bg-card border border-border p-6 shadow-sm mb-8 flex flex-col sm:flex-row gap-4 items-center">
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary"
                  >
                    <UserPlus
                      className="w-6 h-6"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="font-bold text-sm mb-2">
                      Kết nối tài khoản học sinh
                    </h3>
                    <div className="flex gap-2">
                      <input
                        value={linkUsername}
                        onChange={(e) => setLinkUsername(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && linkChild()}
                        placeholder="Nhập email hoặc username của con..."
                        className="w-full pl-4 pr-4 py-3 border border-border outline-none focus:border-primary transition-colors text-black dark:text-white bg-transparent"
                      />
                      <button
                        onClick={linkChild}
                        className="bg-primary text-white font-bold px-6 flex items-center gap-2 hover:bg-primary/90 transition-colors whitespace-nowrap"
                      >
                        <Send className="w-4 h-4" /> Gửi yêu cầu
                      </button>
                    </div>
                  </div>
              </div>

              {/* Children selector */}
              {children.length > 0 && (
                <div className="mb-8">
                  <h3
                    className="text-sm font-bold mb-4 flex items-center gap-2"
                    style={{ color: "#6a6f73" }}
                  >
                    <Users className="w-4 h-4" /> Học sinh của bạn
                  </h3>
                  <div className="flex flex-wrap gap-4 pb-4">
                    {children.map((c) => {
                      const kid = c.child || c;
                      const isActive = child?.id === kid.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => selectChild(c)}
                          className={`flex items-center gap-4 px-5 py-4 border transition-all whitespace-nowrap min-w-[200px] ${isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground-muted"}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isActive ? "bg-primary text-white" : "bg-muted text-foreground"}`}
                          >
                            {(kid.firstName || kid.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="text-left relative z-10">
                            <p
                              className={`font-bold text-base ${isActive ? "text-primary" : ""}`}
                            >
                              {kid.firstName || kid.username}
                            </p>
                            <p
                              className="text-xs text-foreground-muted"
                            >
                              {kid.email}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div
                className="flex flex-wrap gap-2 mb-8 pb-2 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap relative"
                    style={{
                      color:
                        tab === t.id
                          ? "var(--foreground)"
                          : "var(--foreground-muted)",
                      background: tab === t.id ? "var(--card)" : "transparent",
                    }}
                  >
                    <t.icon
                      className={`w-4 h-4 ${tab === t.id ? "text-[#FFCCAA]" : ""}`}
                    />{" "}
                    {t.label}
                    {(t as any).badge > 0 && (
                      <span
                        className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white shadow-sm"
                        style={{ background: "#F8B486" }}
                      >
                        {(t as any).badge}
                      </span>
                    )}
                    {t.id === "requests" &&
                      incomingRequests.length + outgoingRequests.length > 0 &&
                      !(t as any).badge && (
                        <span
                          className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center text-white shadow-sm"
                          style={{ background: "#F8B486" }}
                        >
                          {incomingRequests.length + outgoingRequests.length}
                        </span>
                      )}
                    {tab === t.id && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{
                          background: "#FFCCAA",
                          boxShadow: "0 -2px 10px rgba(248,180,134,0.5)",
                        }}
                      ></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {tab === "overview" && child && (
                <>
                  <div className="bg-card border border-border p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-primary text-white">
                          {(child.firstName || child.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold">
                            {child.firstName
                              ? `${child.firstName} ${child.lastName || ""}`.trim()
                              : child.username}
                          </h2>
                          <p
                            className="text-sm"
                            style={{ color: "#6a6f73" }}
                          >
                            {child.email}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background: "rgba(248,180,134,0.15)",
                                color: "#F8B486",
                              }}
                            >
                              {child.isActive !== false
                                ? "Đang hoạt động"
                                : "Không hoạt động"}
                            </span>
                            {child.createdAt && (
                              <span
                                className="text-[10px] flex items-center gap-1"
                                style={{ color: "#6a6f73" }}
                              >
                                <Calendar className="w-3 h-3" /> Tham gia{" "}
                                {new Date(child.createdAt).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => unlinkChild(child.id)}
                        className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                      >
                        <UserMinus className="w-3 h-3" /> Hủy liên kết
                      </button>
                    </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[
                      {
                        label: "Khóa học",
                        value:
                          childDashboard?.enrollments?.length ??
                          childCourses.length,
                        icon: BookOpen,
                        color: "#F8B486",
                        sub: "đã đăng ký",
                      },
                      {
                        label: "Video đã xem",
                        value:
                          childDashboard?.activity?.videoLessonsStarted ??
                          childDashboard?.activity?.videoLessonsCompleted ??
                          0,
                        icon: CheckCircle2,
                        color: "#F8B486",
                        sub: "đã bắt đầu",
                      },
                      {
                        label: "Quiz đã làm",
                        value: childDashboard?.activity?.quizAttempts ?? 0,
                        icon: Award,
                        color: "#FFCCAA",
                        sub: "lần làm quiz",
                      },
                      {
                        label: "Thành tích",
                        value: childDashboard?.achievements?.length ?? 0,
                        icon: TrendingUp,
                        color: "#94A3B8",
                        sub: "huy hiệu",
                      },
                    ].map(({ label, value, icon: Icon, color, sub }) => (
                      <div key={label} className="bg-card border border-border p-4 shadow-sm text-center">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                          style={{ background: `${color}18` }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                        <p className="text-2xl font-extrabold">{value}</p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "#6a6f73" }}
                        >
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Enrollments with progress */}
                    <div className="bg-card border border-border p-6 shadow-sm">
                      <h3 className="font-bold text-base mb-5 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Tiến độ môn học
                      </h3>
                      {(childDashboard?.enrollments || childCourses || [])
                        .length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                          <BookOpen className="w-12 h-12 mb-3" />
                          <p className="text-sm font-medium">
                            Chưa tham gia khóa học nào
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {(
                            childDashboard?.enrollments ||
                            childCourses ||
                            []
                          ).map((e: any) => {
                            const course = e.course || e;
                            const totalL = e.stats?.totalLessons || 0;
                            const doneL = e.stats?.completedLessons || 0;
                            const pct =
                              totalL > 0
                                ? Math.round((doneL / totalL) * 100)
                                : e.progress || 0;
                            return (
                              <div
                                key={e.id}
                                className="p-4 rounded-2xl border transition-all hover:shadow-md"
                                style={{
                                  background: "var(--card)",
                                  borderColor: "var(--border)",
                                }}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 pr-4">
                                    <h4 className="font-bold text-sm leading-tight">
                                      {course.title}
                                    </h4>
                                    <p
                                      className="text-xs mt-1"
                                      style={{
                                        color: "#6a6f73",
                                      }}
                                    >
                                      {e.status === "pending"
                                        ? "Đang chờ xác nhận thanh toán"
                                        : "Tiến độ học tập"}
                                    </p>
                                  </div>
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center border-4"
                                    style={{
                                      borderColor:
                                        pct >= 100
                                          ? "#F8B486"
                                          : pct > 0
                                            ? "#FFCCAA"
                                            : "var(--muted)",
                                    }}
                                  >
                                    <span className="text-xs font-bold">
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className="w-full h-2.5 rounded-full overflow-hidden"
                                  style={{ background: "var(--muted)" }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out relative"
                                    style={{
                                      width: `${pct}%`,
                                      background:
                                        pct >= 100
                                          ? "#F8B486"
                                          : "linear-gradient(90deg, #FFCCAA, #c084fc)",
                                    }}
                                  >
                                    {pct > 0 && pct < 100 && (
                                      <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 animate-pulse"></div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="flex justify-between text-[11px] font-semibold mt-2"
                                  style={{ color: "#6a6f73" }}
                                >
                                  <span>
                                    {doneL} / {totalL} Bài
                                  </span>
                                  <span
                                    style={{
                                      color: pct >= 100 ? "#F8B486" : "inherit",
                                    }}
                                  >
                                    {pct >= 100 ? "🎉 Hoàn thành" : "Đang học"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right column: Activity & Certs */}
                    <div className="space-y-6">
                      <div className="bg-card border border-border p-6 shadow-sm">
                        <h3 className="font-bold text-base mb-5 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Tổng quan Hoạt động
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              icon: "🎬",
                              label: "Video đã xem",
                              value:
                                childDashboard?.activity?.videoLessonsStarted ??
                                childDashboard?.activity?.videoLessonsCompleted ??
                                0,
                              color: "text-blue-500",
                            },
                            {
                              icon: "📝",
                              label: "Quiz đã làm",
                              value:
                                childDashboard?.activity?.quizAttempts ?? 0,
                              color: "text-orange-500",
                            },
                            {
                              icon: "📄",
                              label: "Bài nộp",
                              value:
                                childDashboard?.activity
                                  ?.assignmentSubmissions ?? 0,
                              color: "text-emerald-500",
                            },
                            {
                              icon: "🏆",
                              label: "Khóa hoàn thành",
                              value: (childDashboard?.enrollments || []).filter((e: any) => {
                                const stats = e.stats;
                                return stats && stats.totalLessons > 0 && stats.completedLessons >= stats.totalLessons;
                              }).length,
                              color: "text-pink-500",
                            },
                          ].map(({ icon, label, value, color }) => (
                            <div
                              key={label}
                              className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/20 shadow-sm backdrop-blur-sm"
                            >
                              <div className="text-2xl mb-2">{icon}</div>
                              <div className={`text-2xl font-black ${color}`}>
                                {value}
                              </div>
                              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                                {label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Completed Courses */}
                      <div className="bg-card border border-border p-6 shadow-sm">
                        <h3 className="font-extrabold text-base mb-4 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/10">
                            <Award className="w-5 h-5 text-amber-500" />
                          </div>{" "}
                          Thành tựu học tập
                        </h3>
                        {(() => {
                          const completed = (childDashboard?.enrollments || []).filter((e: any) => {
                            const stats = e.stats;
                            return stats && stats.totalLessons > 0 && stats.completedLessons >= stats.totalLessons;
                          });
                          const badges = childDashboard?.achievements || [];
                          return completed.length === 0 && badges.length === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-sm text-gray-500">Chưa có thành tích nào</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {badges.slice(0, 6).map((badge: any) => (
                                <div key={badge.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-2xl">
                                    {badge.icon || "🏆"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold">{badge.name}</p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">{badge.description || "Huy hiệu học tập"}</p>
                                  </div>
                                </div>
                              ))}
                              {completed.map((e: any) => (
                                <div
                                  key={e.id}
                                  className="group relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden"
                                  style={{
                                    background: "var(--card)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 relative z-10 shadow-inner">
                                    <Award className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <div className="flex-1 min-w-0 relative z-10">
                                    <p className="font-bold text-sm truncate group-hover:text-amber-600 transition-colors">
                                      {e.course?.title || "Khóa học"}
                                    </p>
                                    <p className="text-[11px] mt-0.5 text-gray-500">
                                      🎉 Hoàn thành toàn bộ {e.stats?.totalLessons} bài học
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === "overview" && !child && children.length === 0 && (
                <div className="bg-card border border-border p-6 shadow-sm text-center py-12">
                  <Users
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: "#6a6f73" }}
                  />
                  <h3 className="font-bold mb-2">Chưa liên kết con em</h3>
                  <p
                    className="text-sm"
                    style={{ color: "#6a6f73" }}
                  >
                    Nhập username ở trên để bắt đầu theo dõi
                  </p>
                </div>
              )}

              {/* Courses */}
              {tab === "courses" && (
                <div className="space-y-6">
                  <h3 className="font-extrabold text-xl mb-6 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                      <BookOpen className="w-6 h-6 text-purple-500" />
                    </div>{" "}
                    Khóa học đang theo học
                  </h3>
                  {childCourses.length === 0 ? (
                    <div className="bg-card p-6 shadow-sm text-center py-16 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                      <p className="text-base font-semibold text-gray-500">
                        Con chưa tham gia khóa học nào
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {childCourses.map((enrollment: any) => {
                        const course = enrollment.course || enrollment;
                        const pct = Math.min(
                          100,
                          Number(enrollment.progress || 0),
                        );
                        return (
                            <div
                              key={enrollment.id}
                              className="bg-card p-6 border border-border group hover:shadow-md transition-all duration-300 relative overflow-hidden"
                            >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-700">
                              <BookOpen className="w-32 h-32" />
                            </div>
                            <div className="flex items-start gap-4 mb-6 relative z-10">
                              <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30 text-white">
                                <BookOpen className="w-7 h-7" />
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-base truncate group-hover:text-purple-500 transition-colors">
                                  {course.title}
                                </h4>
                                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  {course.category || "Học tập"}
                                </span>
                              </div>
                            </div>
                            <div className="relative z-10">
                              <div className="flex justify-between text-xs mb-2 font-semibold">
                                <span className="text-gray-500">Tiến độ</span>
                                <span
                                  className={`${pct >= 100 ? "text-emerald-500" : "text-purple-500"}`}
                                >
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      pct >= 100
                                        ? "#F8B486"
                                        : "linear-gradient(90deg, #FFCCAA, #F8B486)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Grades (Bảng điểm) */}
              {tab === "grades" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Award className="w-6 h-6 text-amber-500" />
                      </div>{" "}
                      Bảng điểm{" "}
                      {child ? `của ${child.firstName || child.username}` : ""}
                    </h3>
                  </div>

                  {childGrades.length === 0 ? (
                    <div className="bg-card p-6 shadow-sm text-center py-20 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
                      <Award className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                      <h3 className="font-bold text-lg mb-2 text-gray-400">
                        Chưa có bài tập nào được chấm
                      </h3>
                      <p className="text-sm text-gray-500">
                        Khi con nộp bài và giáo viên chấm điểm, kết quả sẽ hiển
                        thị ở đây.
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const courseMap = new Map<
                        string,
                        { title: string; subs: any[] }
                      >();
                      for (const sub of childGrades) {
                        const cId =
                          sub.assignment?.lesson?.section?.course?.id ||
                          "unknown";
                        const cTitle =
                          sub.assignment?.lesson?.section?.course?.title ||
                          "Khóa học";
                        if (!courseMap.has(cId))
                          courseMap.set(cId, { title: cTitle, subs: [] });
                        courseMap.get(cId)!.subs.push(sub);
                      }
                      const courses = Array.from(courseMap.entries());

                      return (
                        <div className="grid gap-8">
                          {courses.map(
                            ([courseId, { title: courseTitle, subs }]) => {
                              const graded = subs.filter(
                                (s: any) => s.status === "graded",
                              );
                              const avg =
                                graded.length > 0
                                  ? graded.reduce(
                                      (s: number, g: any) => s + (g.score || 0),
                                      0,
                                    ) / graded.length
                                  : 0;
                              const pending = subs.filter(
                                (s: any) => s.status !== "graded",
                              ).length;

                              return (
                                <div
                                  key={courseId}
                                  className="bg-card border border-border shadow-sm overflow-hidden p-0 relative"
                                >
                                  <div
                                    className="absolute top-0 left-0 right-0 h-1"
                                    style={{
                                      background:
                                        avg >= 8
                                          ? "linear-gradient(90deg, #F8B486, #34d399)"
                                          : avg >= 5
                                            ? "linear-gradient(90deg, #FFCCAA, #fbbf24)"
                                            : "linear-gradient(90deg, #F8B486, #f87171)",
                                    }}
                                  ></div>
                                  <div className="p-6">
                                    {/* Course header */}
                                    <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                          <BookOpen className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-lg truncate">
                                            {courseTitle}
                                          </h4>
                                          <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                                            <span>
                                              {graded.length} bài đã chấm
                                            </span>
                                            {pending > 0 && (
                                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                ⏳ {pending} chờ chấm
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      {graded.length > 0 && (
                                        <div className="text-center px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                          <p
                                            className="text-3xl font-black"
                                            style={{
                                              color:
                                                avg >= 8
                                                  ? "#F8B486"
                                                  : avg >= 5
                                                    ? "#FFCCAA"
                                                    : "#F8B486",
                                            }}
                                          >
                                            {avg.toFixed(1)}
                                          </p>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Trung bình
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Submissions list */}
                                    <div className="space-y-4">
                                      {subs.map((sub: any) => {
                                        const a = sub.assignment;
                                        const lesson = a?.lesson;
                                        const isGraded =
                                          sub.status === "graded";
                                        const maxS = a?.maxScore || 10;
                                        const pct = isGraded
                                          ? Math.min(
                                              100,
                                              (sub.score / maxS) * 100,
                                            )
                                          : 0;
                                        const passed = pct >= 50;

                                        return (
                                          <div
                                            key={sub.id}
                                            className="group relative p-4 rounded-2xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                          >
                                            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <h5 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                    {a?.title || "Bài tập"}
                                                  </h5>
                                                  {!isGraded && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                      Đang chấm
                                                    </span>
                                                  )}
                                                </div>
                                                {lesson && (
                                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />{" "}
                                                    {lesson.title}
                                                  </p>
                                                )}
                                              </div>

                                              {isGraded && (
                                                <div className="flex items-center gap-6">
                                                  <div className="w-32 hidden sm:block">
                                                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                      <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                          width: `${pct}%`,
                                                          background: passed
                                                            ? "#F8B486"
                                                            : "#F8B486",
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="text-right min-w-[60px]">
                                                    <span
                                                      className="text-2xl font-black"
                                                      style={{
                                                        color: passed
                                                          ? "#F8B486"
                                                          : "#F8B486",
                                                      }}
                                                    >
                                                      {sub.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                      /{maxS}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {isGraded && sub.feedback && (
                                              <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-800 dark:text-blue-200 relative">
                                                <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-50 dark:bg-[#1e1b4b] border-t border-l border-blue-100 dark:border-blue-900/30 rotate-45"></div>
                                                <span className="font-bold mr-2">
                                                  Nhận xét:
                                                </span>
                                                {sub.feedback}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}

                          {/* Overall summary */}
                          {childGrades.some(
                            (g: any) => g.status === "graded",
                          ) && (
                            <div
                              className="bg-card border border-border p-6 shadow-sm"
                            >
                              <h4 className="text-sm font-bold mb-3">
                                📊 Tổng kết chung
                              </h4>
                              <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#F8B486" }}
                                  >
                                    {courses.length}
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "#6a6f73" }}
                                  >
                                    Khóa học
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#F8B486" }}
                                  >
                                    {
                                      childGrades.filter(
                                        (g: any) => g.status === "graded",
                                      ).length
                                    }
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "#6a6f73" }}
                                  >
                                    Đã chấm
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#94A3B8" }}
                                  >
                                    {(() => {
                                      const g = childGrades.filter(
                                        (x: any) => x.status === "graded",
                                      );
                                      return g.length
                                        ? (
                                            g.reduce(
                                              (s: number, x: any) =>
                                                s + (x.score || 0),
                                              0,
                                            ) / g.length
                                          ).toFixed(1)
                                        : "—";
                                    })()}
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "#6a6f73" }}
                                  >
                                    Điểm TB
                                  </p>
                                </div>
                                <div>
                                  <p
                                    className="text-xl font-extrabold"
                                    style={{ color: "#FFCCAA" }}
                                  >
                                    {
                                      childGrades.filter(
                                        (g: any) => g.status !== "graded",
                                      ).length
                                    }
                                  </p>
                                  <p
                                    className="text-[10px]"
                                    style={{ color: "#6a6f73" }}
                                  >
                                    Chờ chấm
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Payments */}
              {tab === "payments" && (
                <div>
                  <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <CreditCard
                      className="w-5 h-5"
                      style={{ color: "#F8B486" }}
                    />{" "}
                    Thanh toán chờ xử lý
                  </h3>
                  {pendingOrders.length === 0 ? (
                    <div className="bg-card border border-border p-6 shadow-sm text-center py-12">
                      <CheckCircle2
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "#F8B486" }}
                      />
                      <h3 className="font-bold mb-2">
                        Không có thanh toán chờ
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "#6a6f73" }}
                      >
                        Tất cả đơn hàng đã được xử lý
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.map((order: any) => (
                        <div key={order.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                          <div className="flex flex-col gap-4 border-b border-border px-6 py-5 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-primary">Thanh toán chờ xử lý</p>
                              <h4 className="mt-1 text-lg font-extrabold">Đơn hàng #{order.id?.substring(0, 8).toUpperCase()}</h4>
                              <p className="mt-1 text-xs text-foreground-muted">
                                Học sinh: <strong>{order.childName || "Con"}</strong>
                                {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString("vi-VN")}` : ""}
                              </p>
                            </div>
                            <span className="w-fit rounded-full border border-[#F8B486]/30 bg-[#F8B486]/10 px-3 py-1 text-xs font-bold text-[#F8B486]">
                              Chờ thanh toán
                            </span>
                          </div>

                          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                            <div>
                              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-muted">Khóa học trong đơn</p>
                              <div className="space-y-3">
                                {order.items?.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-[var(--background)] p-3">
                                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]">
                                      {item.course?.thumbnail ? (
                                        <img src={item.course.thumbnail} alt={item.course?.title || "Khóa học"} className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-primary">
                                          <BookOpen className="h-5 w-5" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-bold">{item.course?.title || "Khóa học"}</p>
                                      <p className="text-xs text-foreground-muted">Sẽ được kích hoạt sau khi hệ thống đối soát</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-extrabold text-primary">{Number(item.price || 0).toLocaleString("vi-VN")} ₫</p>
                                  </div>
                                ))}
                              </div>
                              {Number(order.payment?.paidAmount || 0) > 0 && (
                                <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm">
                                  Đã nộp <b>{Number(order.payment.paidAmount).toLocaleString("vi-VN")} ₫</b> · Còn thiếu <b>{Number(order.payment.remainingAmount || 0).toLocaleString("vi-VN")} ₫</b>
                                </div>
                              )}
                              <div className="mt-5 rounded-lg border border-[#F8B486]/20 bg-[#F8B486]/10 px-4 py-3">
                                <p className="flex items-center gap-2 text-xs font-bold text-[#F8B486]">
                                  <CheckCircle2 className="h-4 w-4" /> Sau khi chuyển khoản đúng nội dung, hệ thống sẽ tự động kích hoạt khóa học
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl border border-border bg-[var(--background)] p-5 text-center">
                              <p className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Số tiền cần chuyển</p>
                              <p className="mt-1 text-3xl font-extrabold gradient-text">
                                {(order.payment?.remainingAmount || order.finalPrice || order.totalPrice || 0).toLocaleString("vi-VN")} ₫
                              </p>
                            {order._qrData ? (
                              <>
                                <div
                                  className="w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                                  style={{
                                    background: "white",
                                    border: "2px solid var(--border)",
                                  }}
                                  onClick={() =>
                                    setQrPopup({
                                      url: order._qrData.vietQrUrl,
                                      amount:
                                        order.payment?.remainingAmount || order.finalPrice || order.totalPrice || 0,
                                      id: order.id,
                                    })
                                  }
                                >
                                  <img
                                    src={order._qrData.vietQrUrl}
                                    alt="VietQR"
                                    className="w-44 h-44 object-contain pointer-events-none"
                                  />
                                </div>
                                <p className="text-xs mb-1 font-mono px-2 py-1.5 rounded-lg inline-block" style={{ background: "var(--muted)" }}>
                                  Nội dung CK: <span className="font-bold">{order._qrData.addInfo}</span>
                                </p>
                                <p className="text-[10px] mt-1 mb-2" style={{ color: "#6a6f73" }}>
                                  ⚠️ Nội dung chuyển khoản phải chứa đúng mã trên
                                </p>
                              </>
                            ) : (
                              <button
                                className="btn-primary mx-auto mb-3"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`${API}/payments/qr`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ orderId: order.id }),
                                    });
                                    if (res.ok) {
                                      const qr = await res.json();
                                      setPendingOrders((prev: any[]) => prev.map((o: any) =>
                                        o.id === order.id ? { ...o, _qrData: { vietQrUrl: qr.vietQrUrl, addInfo: qr.addInfo, txnRef: qr.txnRef } } : o
                                      ));
                                    } else {
                                      toast.error("Không thể tạo mã QR");
                                    }
                                  } catch { toast.error("Lỗi kết nối"); }
                                }}
                              >
                                <QrCode className="w-4 h-4" /> Tạo mã QR thanh toán
                              </button>
                            )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Transaction History */}
              {tab === "history" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-extrabold flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <Clock className="w-6 h-6 text-cyan-500" />
                      </div>
                      Lịch sử giao dịch{child ? ` của ${child.firstName || child.username}` : ""}
                    </h3>
                    <span className="text-sm font-medium" style={{ color: "#6a6f73" }}>
                      {childTransactions.length} giao dịch
                    </span>
                  </div>

                  {!child ? (
                    <div className="bg-card border border-border p-6 text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#6a6f73" }} />
                      <p className="text-sm" style={{ color: "#6a6f73" }}>Vui lòng chọn con để xem lịch sử</p>
                    </div>
                  ) : childTransactions.length === 0 ? (
                    <div className="bg-card border border-border p-6 text-center py-16 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-transparent">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                      <h3 className="font-bold text-lg mb-2 text-gray-400">Chưa có giao dịch nào</h3>
                      <p className="text-sm text-gray-500">Khi con đặt mua khóa học, lịch sử sẽ hiện ở đây.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary row */}
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        {[
                          { label: "Tổng đơn", value: childTransactions.length, color: "#F8B486" },
                          { label: "Đã thanh toán", value: childTransactions.filter((o: any) => isOrderPaid(o)).length, color: "#F8B486" },
                          { label: "Chờ xử lý", value: childTransactions.filter((o: any) => o.status === "pending").length, color: "#FFCCAA" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-card border border-border p-4 text-center">
                            <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                            <p className="text-xs mt-1" style={{ color: "#6a6f73" }}>{label}</p>
                          </div>
                        ))}
                      </div>

                      {childTransactions.map((order: any) => {
                        const statusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
                          paid:      { label: "Đã thanh toán", color: "#F8B486", bg: "rgba(248,180,134,0.1)", icon: "✅" },
                          completed: { label: "Đã thanh toán", color: "#F8B486", bg: "rgba(248,180,134,0.1)", icon: "✅" },
                          pending:   { label: "Chờ thanh toán", color: "#FFCCAA", bg: "rgba(255,204,170,0.1)", icon: "⏳" },
                          cancelled: { label: "Đã hủy",        color: "#F8B486", bg: "rgba(248,180,134,0.1)",  icon: "❌" },
                          failed:    { label: "Thất bại",      color: "#F8B486", bg: "rgba(248,180,134,0.1)",  icon: "❌" },
                        };
                        const st = statusMap[order.status] || { label: order.status, color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: "•" };
                        const total = order.finalPrice || order.totalPrice || 0;
                        const paidAmount = Number(order.payment?.paidAmount || 0);
                        const remainingAmount = Number(order.payment?.remainingAmount || 0);
                        return (
                          <div key={order.id} className="bg-card border border-border p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-bold text-sm">Đơn #{order.id?.substring(0, 8).toUpperCase()}</p>
                                <p className="text-xs mt-0.5" style={{ color: "#6a6f73" }}>
                                  {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}
                                </p>
                              </div>
                              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                                style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}>
                                {st.icon} {st.label}
                              </span>
                            </div>

                            {order.items && order.items.length > 0 && (
                              <div className="mb-3 space-y-1">
                                {order.items.map((item: any) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm" style={{ color: "#6a6f73" }}>
                                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{item.course?.title || "Khóa học"}</span>
                                    <span className="ml-auto font-semibold whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                                      {(item.price || 0).toLocaleString("vi-VN")} ₫
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                              <span className="text-xs" style={{ color: "#6a6f73" }}>Tổng cộng</span>
                              <span className="text-lg font-extrabold" style={{ color: "#F8B486" }}>
                                {total.toLocaleString("vi-VN")} ₫
                              </span>
                            </div>
                            {paidAmount > 0 && order.status === "pending" && (
                              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                <div className="p-2 rounded border border-emerald-500/20 bg-emerald-500/10">
                                  <p style={{ color: "#6a6f73" }}>Đã nộp</p>
                                  <p className="font-bold text-emerald-500">{paidAmount.toLocaleString("vi-VN")} ₫</p>
                                </div>
                                <div className="p-2 rounded border border-yellow-500/20 bg-yellow-500/10">
                                  <p style={{ color: "#6a6f73" }}>Còn thiếu</p>
                                  <p className="font-bold text-yellow-600">{remainingAmount.toLocaleString("vi-VN")} ₫</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Link Requests */}
              {tab === "requests" && (
                <div className="space-y-6">
                  {incomingRequests.length > 0 && (
                    <div className="bg-card border border-border p-6 shadow-sm">
                      <h3 className="font-bold mb-4">
                        Yêu cầu đến ({incomingRequests.length})
                      </h3>
                      <div className="space-y-3">
                        {incomingRequests.map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "var(--muted)" }}
                          >
                            <span className="text-sm font-semibold">
                              {r.parent?.username || r.parentId}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(r.id)}
                                className="btn-primary text-xs px-3 py-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Chấp nhận
                              </button>
                              <button
                                onClick={() => rejectRequest(r.id)}
                                className="btn-ghost text-xs px-3 py-1"
                                style={{ color: "#F8B486" }}
                              >
                                <XCircle className="w-3 h-3" /> Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outgoingRequests.length > 0 && (
                    <div className="bg-card border border-border p-6 shadow-sm">
                      <h3 className="font-bold mb-4">
                        Yêu cầu đã gửi ({outgoingRequests.length})
                      </h3>
                      <div className="space-y-3">
                        {outgoingRequests.map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: "var(--muted)" }}
                          >
                            <div>
                              <span className="text-sm font-semibold">
                                {r.child?.username || r.childId}
                              </span>
                              <span className="badge badge-warning text-[10px] ml-2">
                                Chờ xác nhận
                              </span>
                            </div>
                            <button
                              onClick={() => deleteRequest(r.id)}
                              className="btn-ghost text-xs"
                              style={{ color: "#F8B486" }}
                            >
                              Hủy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incomingRequests.length === 0 &&
                    outgoingRequests.length === 0 && (
                      <div className="bg-card border border-border p-6 shadow-sm text-center py-8">
                        <UserPlus
                          className="w-10 h-10 mx-auto mb-2"
                          style={{ color: "#6a6f73" }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: "#6a6f73" }}
                        >
                          Không có yêu cầu liên kết nào
                        </p>
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
