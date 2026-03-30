import type { ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  tone = "light",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)] sm:p-8",
        dark
          ? "border-black/10 bg-[radial-gradient(circle_at_top_left,_rgba(196,255,79,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(255,122,89,0.18),_transparent_22%),linear-gradient(135deg,_#111827,_#1f2937_52%,_#284653)] text-white"
          : "border-black/8 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(249,246,241,0.92))] text-slate-900",
        className
      )}
    >
      <div
        className={cx(
          "pointer-events-none absolute inset-0",
          dark
            ? "bg-[linear-gradient(120deg,_rgba(255,255,255,0.08),_transparent_36%,_rgba(255,255,255,0.03)_72%,_transparent)]"
            : "bg-[linear-gradient(120deg,_rgba(255,255,255,0.65),_transparent_36%,_rgba(255,255,255,0.18)_72%,_transparent)]"
        )}
      />
      <div
        className={cx(
          "pointer-events-none absolute -right-12 top-0 h-44 w-44 rounded-full blur-3xl",
          dark ? "bg-white/10" : "bg-amber-200/40"
        )}
      />
      <div
        className={cx(
          "pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full blur-3xl",
          dark ? "bg-lime-200/10" : "bg-emerald-200/40"
        )}
      />

      <div
        className={cx(
          "relative grid gap-8",
          aside ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.9fr)] xl:items-end" : ""
        )}
      >
        <div className="grid gap-5">
          {eyebrow ? (
            <div
              className={cx(
                "w-fit rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]",
                dark
                  ? "border border-white/14 bg-white/8 text-white/78"
                  : "border border-black/8 bg-white/70 text-slate-600"
              )}
            >
              {eyebrow}
            </div>
          ) : null}
          <div className="grid gap-3">
            <h1 className={cx("max-w-5xl font-semibold tracking-[-0.07em]", dark ? "text-4xl text-white sm:text-5xl" : "text-3xl sm:text-4xl")}>
              {title}
            </h1>
            {description ? (
              <div
                className={cx(
                  "max-w-4xl text-sm leading-7 sm:text-[15px] sm:leading-8",
                  dark ? "text-white/78" : "text-slate-600"
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </section>
  );
}

export function PageStat({
  label,
  value,
  hint,
  tone = "light",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cx(
        "rounded-[1.4rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        dark ? "border-white/10 bg-white/8 text-white" : "border-black/6 bg-white/82 text-slate-900",
        className
      )}
    >
      <div className={cx("text-[11px] font-semibold uppercase tracking-[0.2em]", dark ? "text-white/62" : "text-slate-500")}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</div>
      {hint ? (
        <div className={cx("mt-2 text-sm", dark ? "text-white/65" : "text-slate-500")}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[1.8rem] border border-black/8 bg-white/88 p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] backdrop-blur-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

export function InsetCard({
  children,
  className,
  tone = "slate",
}: {
  children: ReactNode;
  className?: string;
  tone?: "slate" | "white" | "tint";
}) {
  return (
    <div
      className={cx(
        "rounded-[1.45rem] border p-4",
        tone === "white"
          ? "border-black/6 bg-white"
          : tone === "tint"
            ? "border-amber-200/70 bg-[linear-gradient(180deg,_rgba(255,251,235,0.9),_rgba(255,255,255,0.96))]"
            : "border-black/5 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.84))]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-1.5">
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
        {description ? <div className="max-w-3xl text-sm leading-7 text-slate-600">{description}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid gap-3 rounded-[1.8rem] border border-dashed border-black/12 bg-[linear-gradient(180deg,_rgba(255,255,255,0.74),_rgba(248,250,252,0.82))] p-8 text-center",
        className
      )}
    >
      <div className="text-lg font-semibold tracking-[-0.03em] text-slate-900">{title}</div>
      <div className="mx-auto max-w-2xl text-sm leading-7 text-slate-600">{body}</div>
      {action ? <div className="mt-2 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function actionButtonClass(tone: "primary" | "secondary" | "ghost" | "danger" | "success" = "primary") {
  switch (tone) {
    case "secondary":
      return "rounded-full border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5";
    case "ghost":
      return "rounded-full border border-black/8 bg-slate-100/80 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5";
    case "danger":
      return "rounded-full bg-red-700 px-4 py-2.5 text-sm font-medium text-white !text-white shadow-[0_12px_30px_rgba(185,28,28,0.22)] transition hover:-translate-y-0.5 hover:!text-white";
    case "success":
      return "rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white !text-white shadow-[0_12px_30px_rgba(4,120,87,0.2)] transition hover:-translate-y-0.5 hover:!text-white";
    default:
      return "rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white !text-white shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:!text-white";
  }
}

export function fieldClass(kind: "input" | "textarea" = "input") {
  return cx(
    "w-full rounded-[1.15rem] border border-black/10 bg-white/92 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70",
    kind === "textarea" ? "min-h-28 py-3" : "py-3"
  );
}
