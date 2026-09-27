"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { recordPayment } from "@/lib/actions/bookings";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function RecordPaymentModal({
  open,
  onClose,
  booking,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  booking: {
    id: string;
    customerName: string;
    eventType: string;
    totalAmount: number;
    paidAmount: number;
    advanceAmount: number;
  } | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (open && booking) {
      const remaining = Math.max(0, booking.totalAmount - booking.paidAmount);
      setAmount(booking.paidAmount === 0 ? Math.min(booking.advanceAmount || remaining, remaining) : remaining);
      setMethod("UPI");
      setReference("");
    }
  }, [open, booking]);

  if (!booking) return null;
  const remaining = Math.max(0, booking.totalAmount - booking.paidAmount);

  function submit() {
    const fd = new FormData();
    fd.set("bookingId", booking!.id);
    fd.set("amount", String(amount));
    fd.set("method", method);
    fd.set("reference", reference);
    startTransition(async () => {
      const res = await recordPayment(fd);
      if (res.ok) {
        toast({ title: "Payment recorded", description: `${formatINR(amount)} via ${method}`, variant: "success" });
        onSaved();
      } else {
        toast({ title: "Couldn't record payment", description: res.error, variant: "error" });
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={`${booking.customerName} · ${booking.eventType}`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-50 p-3 text-center ring-1 ring-stone-200/70">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Total</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-stone-800">{formatINR(booking.totalAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Paid</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600">{formatINR(booking.paidAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Balance</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-600">{formatINR(remaining)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (₹) *">
            <Input type="number" min={1} max={remaining} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Reference (optional)" hint="UPI txn id, cheque number, receipt no…">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI-4921XXXX" />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || amount <= 0}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recording…
              </>
            ) : (
              `Record ${formatINR(amount)}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
