import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/ProductCard";
import { useCart } from "../store/cart";

const step1 = z.object({
  contactName: z.string().min(2, "Укажите имя"),
  contactPhone: z.string().min(10, "Телефон"),
  contactEmail: z.string().email("Email"),
});
const step2 = z.object({
  addressLine: z.string().min(3, "Адрес"),
  city: z.string().min(2, "Город"),
  postalCode: z.string().min(4, "Индекс"),
});
const step3 = z.object({ deliveryMethod: z.enum(["courier", "pickup", "pvz"]) });
const step4 = z.object({ paymentMethod: z.enum(["card", "cash", "online"]) });

type S1 = z.infer<typeof step1>;
type S2 = z.infer<typeof step2>;
type S3 = z.infer<typeof step3>;
type S4 = z.infer<typeof step4>;

const steps = ["Контакты", "Адрес", "Доставка", "Оплата", "Подтверждение"] as const;

export function CheckoutPage() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { promo?: string; discountPct?: number } };
  const { lines, clear } = useCart();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<S1 & S2 & S3 & S4>>({});

  const f1 = useForm<S1>({ resolver: zodResolver(step1), defaultValues: { contactName: "", contactPhone: "", contactEmail: "" } });
  const f2 = useForm<S2>({ resolver: zodResolver(step2), defaultValues: { addressLine: "", city: "", postalCode: "" } });
  const f3 = useForm<S3>({ resolver: zodResolver(step3), defaultValues: { deliveryMethod: "courier" } });
  const f4 = useForm<S4>({ resolver: zodResolver(step4), defaultValues: { paymentMethod: "online" } });

  const promo = loc.state?.promo || "";

  const submitAll = async () => {
    try {
      const order = await api.createOrder(
        {
          userId: "buyer-1",
          lines: lines.map((l) => ({
            productId: l.productId,
            producerId: l.producerId,
            name: l.name,
            image: l.image,
            unitPrice: l.unitPrice,
            qty: l.qty,
            deliveryFee: 0,
          })),
          promoCode: promo,
          contactName: data.contactName!,
          contactPhone: data.contactPhone!,
          contactEmail: data.contactEmail!,
          addressLine: data.addressLine!,
          city: data.city!,
          postalCode: data.postalCode!,
          deliveryMethod: data.deliveryMethod!,
          paymentMethod: data.paymentMethod!,
        },
        { "X-User-Id": "buyer-1" }
      );
      clear();
      toast.success("Заказ " + order.id + " оформлен");
      nav("/account");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка оформления");
    }
  };

  const summary = useMemo(() => {
    const sub = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
    return { sub };
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Breadcrumbs items={[{ label: "Корзина", to: "/cart" }, { label: "Оформление" }]} />
        <p className="mt-6">
          Корзина пуста. <Link to="/catalog">В каталог</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Корзина", to: "/cart" }, { label: "Оформление" }]} />
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold text-moss-dark">Оформление</h1>
        <ol className="mt-6 flex flex-wrap gap-2 text-xs" aria-label="Шаги">
          {steps.map((s, i) => (
            <li
              key={s}
              className={
                "rounded-full px-3 py-1 " + (i === step ? "bg-moss text-white" : i < step ? "bg-moss/15 text-moss" : "bg-cream-dark/40")
              }
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <form
            className="mt-6 space-y-4"
            onSubmit={f1.handleSubmit((v) => {
              setData((d) => ({ ...d, ...v }));
              setStep(1);
            })}
          >
            <Field label="Имя" err={f1.formState.errors.contactName?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f1.register("contactName")} autoComplete="name" />
            </Field>
            <Field label="Телефон" err={f1.formState.errors.contactPhone?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f1.register("contactPhone")} autoComplete="tel" />
            </Field>
            <Field label="Email" err={f1.formState.errors.contactEmail?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f1.register("contactEmail")} autoComplete="email" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="submit">Далее</Button>
            </div>
          </form>
        )}

        {step === 1 && (
          <form
            className="mt-6 space-y-4"
            onSubmit={f2.handleSubmit((v) => {
              setData((d) => ({ ...d, ...v }));
              setStep(2);
            })}
          >
            <Field label="Адрес (улица, дом)" err={f2.formState.errors.addressLine?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f2.register("addressLine")} autoComplete="street-address" />
            </Field>
            <Field label="Город" err={f2.formState.errors.city?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f2.register("city")} autoComplete="address-level2" />
            </Field>
            <Field label="Индекс" err={f2.formState.errors.postalCode?.message}>
              <input className="w-full rounded-lg border px-3 py-2" {...f2.register("postalCode")} autoComplete="postal-code" />
            </Field>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                Назад
              </Button>
              <Button type="submit">Далее</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form
            className="mt-6 space-y-4"
            onSubmit={f3.handleSubmit((v) => {
              setData((d) => ({ ...d, ...v }));
              setStep(3);
            })}
          >
            <fieldset>
              <legend className="font-medium">Способ доставки</legend>
              <div className="mt-2 space-y-2">
                {[
                  ["courier", "Курьер"],
                  ["pickup", "Самовывоз"],
                  ["pvz", "Пункт выдачи"],
                ].map(([val, lab]) => (
                  <label key={val} className="flex items-center gap-2 rounded-lg border p-3">
                    <input type="radio" value={val} {...f3.register("deliveryMethod")} />
                    {lab}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button type="submit">Далее</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            className="mt-6 space-y-4"
            onSubmit={f4.handleSubmit((v) => {
              setData((d) => ({ ...d, ...v }));
              setStep(4);
            })}
          >
            <fieldset>
              <legend className="font-medium">Оплата</legend>
              <div className="mt-2 space-y-2">
                {[
                  ["card", "Карта"],
                  ["cash", "Наличные"],
                  ["online", "Онлайн"],
                ].map(([val, lab]) => (
                  <label key={val} className="flex items-center gap-2 rounded-lg border p-3">
                    <input type="radio" value={val} {...f4.register("paymentMethod")} />
                    {lab}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Назад
              </Button>
              <Button type="submit">Далее</Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="mt-6 space-y-4 rounded-2xl border border-cream-dark/40 bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-semibold">Проверьте заказ</h2>
            <ul className="text-sm text-soil/80">
              <li>Имя: {data.contactName}</li>
              <li>Телефон: {data.contactPhone}</li>
              <li>Email: {data.contactEmail}</li>
              <li>
                Адрес: {data.addressLine}, {data.city}, {data.postalCode}
              </li>
              <li>Доставка: {data.deliveryMethod}</li>
              <li>Оплата: {data.paymentMethod}</li>
              {promo && <li>Промокод: {promo}</li>}
              <li className="mt-2 font-semibold text-soil">Товары на сумму: {Math.round(summary.sub)} ₽</li>
            </ul>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                Назад
              </Button>
              <Button type="button" onClick={submitAll}>
                Подтвердить
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-soil">{label}</label>
      {children}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
