"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centavos, formatCentavos } from "@/lib/money";
import {
  checkFitmentWarningAction,
  getAvailableDatesAction,
  getAvailableTimesAction,
  submitBooking,
} from "@/lib/booking/actions";

type Service = { id: string; name: string; base_price: number; duration_minutes: number };
type Product = { id: string; sku: string; name: string; retail_price: number };

const STEPS = ["Service & Parts", "Vehicle", "Schedule", "Confirm"] as const;

export function BookingWizard({
  services,
  products,
  defaultProductSku,
}: {
  services: Service[];
  products: Product[];
  defaultProductSku?: string;
}) {
  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>(
    defaultProductSku ? products.filter((p) => p.sku === defaultProductSku).map((p) => p.id) : [],
  );
  const [customerSuppliedParts, setCustomerSuppliedParts] = useState(false);

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [fitmentWarning, setFitmentWarning] = useState(false);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const selectedProducts = products.filter((p) => productIds.includes(p.id));
  const durationMinutes = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const estimatedTotal = useMemo(() => {
    const servicesTotal = selectedServices.reduce((sum, s) => sum + s.base_price, 0);
    const productsTotal = customerSuppliedParts ? 0 : selectedProducts.reduce((sum, p) => sum + p.retail_price, 0);
    return servicesTotal + productsTotal;
  }, [selectedServices, selectedProducts, customerSuppliedParts]);

  useEffect(() => {
    if (step !== 2 || durationMinutes === 0) return;
    getAvailableDatesAction(durationMinutes).then(setAvailableDates);
  }, [step, durationMinutes]);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedTime(null);
    getAvailableTimesAction(selectedDate, durationMinutes).then(setAvailableTimes);
  }, [selectedDate, durationMinutes]);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }
  function toggleProduct(id: string) {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function goNext() {
    setError(null);
    if (step === 0 && serviceIds.length === 0) {
      setError("Pick at least one service.");
      return;
    }
    if (step === 1) {
      if (!vehicleMake || !vehicleModel) {
        setError("Vehicle make and model are required.");
        return;
      }
      startTransition(async () => {
        const warn = await checkFitmentWarningAction(
          productIds,
          vehicleMake,
          vehicleModel,
          vehicleYear ? Number(vehicleYear) : undefined,
        );
        setFitmentWarning(warn);
        setStep((s) => s + 1);
      });
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTime)) {
      setError("Pick a date and time.");
      return;
    }
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitBooking({
        serviceIds,
        productIds,
        customerSuppliedParts,
        vehicleMake,
        vehicleModel,
        vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
        plateNumber,
        scheduledAt: selectedTime ?? "",
        fullName,
        phone,
        email,
        notes,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setConfirmedRef(result.reference);
    });
  }

  if (confirmedRef) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border p-8 text-center">
        <h2 className="font-heading text-2xl font-bold">Booking confirmed</h2>
        <p className="text-3xl font-mono">{confirmedRef}</p>
        <p className="text-muted-foreground text-sm">
          Save this reference — you can check your booking status anytime.
        </p>
        <Button className="rounded-full font-semibold" render={<Link href={`/book/${confirmedRef}`} />}>
          View booking status
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <div key={label} className={`flex-1 border-t-2 pt-2 ${i <= step ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}>
            {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading mb-3 text-lg font-bold">Choose services</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <label key={s.id} className="bg-card flex items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                    {s.name}
                  </span>
                  <span className="font-semibold">{formatCentavos(centavos(s.base_price))}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading mb-3 text-lg font-bold">Parts (optional)</h2>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={customerSuppliedParts}
                onChange={(e) => setCustomerSuppliedParts(e.target.checked)}
              />
              I have my own parts
            </label>
            {!customerSuppliedParts ? (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {products.map((p) => (
                  <label key={p.id} className="bg-card flex items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      {p.name}
                    </span>
                    <span className="font-semibold">{formatCentavos(centavos(p.retail_price))}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold">Your vehicle</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="vehicleMake">Make</Label>
              <Input id="vehicleMake" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicleModel">Model</Label>
              <Input id="vehicleModel" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicleYear">Year</Label>
              <Input id="vehicleYear" type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="plateNumber">Plate (optional)</Label>
              <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold">Pick a date &amp; time</h2>
          {fitmentWarning ? (
            <p className="rounded-xl border border-yellow-600/40 bg-yellow-600/10 p-3 text-xs text-yellow-500">
              This part isn&apos;t listed as a fit for your vehicle — we&apos;ll confirm before your appointment.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {availableDates.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={selectedDate === d ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setSelectedDate(d)}
              >
                {new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </Button>
            ))}
            {availableDates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open dates in the next 30 days — please message us.</p>
            ) : null}
          </div>
          {selectedDate ? (
            <div className="flex flex-wrap gap-2">
              {availableTimes.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={selectedTime === t ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedTime(t)}
                >
                  {new Date(t).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold">Contact &amp; confirm</h2>
          <div className="space-y-1">
            <Label htmlFor="fullName">Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bookingPhone">Phone</Label>
            <Input id="bookingPhone" placeholder="09XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bookingEmail">Email (optional)</Label>
            <Input id="bookingEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bookingNotes">Notes (optional)</Label>
            <Input id="bookingNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="bg-card rounded-xl border p-4 text-sm">
            <p className="font-heading text-xl font-bold">{formatCentavos(centavos(estimatedTotal))}</p>
            <p className="text-muted-foreground text-xs">
              Estimated total — payable on-site by cash or GCash. Final price confirmed at your appointment.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" className="rounded-full" onClick={goBack} disabled={step === 0 || isPending}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="rounded-full font-semibold" onClick={goNext} disabled={isPending}>
            Continue
          </Button>
        ) : (
          <Button className="rounded-full font-semibold" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Booking..." : "Confirm booking"}
          </Button>
        )}
      </div>
    </div>
  );
}
