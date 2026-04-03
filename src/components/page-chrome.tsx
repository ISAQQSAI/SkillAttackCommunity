import type { ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageHero({
  eyebrow,
  title,
  titleClassName,
  description,
  actions,
  aside,
  actionsLayout = "bottom",
  tone = "light",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  actionsLayout?: "bottom" | "side";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <section
      className={cx(
        "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] px-6 py-7 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.05)] sm:px-8 sm:py-9",
        className
      )}
    >
      <div
        className={cx(
          "grid gap-8",
          aside
            ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.9fr)] xl:items-end"
            : actions && actionsLayout === "side"
              ? "xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
              : ""
        )}
      >
        <div className="grid gap-5">
          {eyebrow ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {eyebrow}
            </div>
          ) : null}
          <div className="grid gap-3">
            <h1
              className={cx(
                "max-w-5xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl",
                titleClassName
              )}
            >
              {title}
            </h1>
            {description ? (
              <div className="max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-8">
                {description}
              </div>
            ) : null}
          </div>
          {actions && actionsLayout === "bottom" ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {actions && actionsLayout === "side" ? (
          <div className="flex flex-wrap gap-3 xl:justify-end xl:self-end">
            {actions}
          </div>
        ) : null}
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
  layout = "stacked",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "light" | "dark";
  layout?: "stacked" | "row";
  className?: string;
}) {
  if (layout === "row") {
    return (
      <div
        className={cx(
          "grid grid-cols-[minmax(0,1fr)_6rem] bg-white text-slate-900 sm:grid-cols-[minmax(0,1fr)_7rem]",
          className
        )}
      >
        <div className="min-w-0 grid content-center gap-2 px-5 py-4 sm:px-6">
          <div className="inline-flex max-w-full items-center gap-2 self-start border border-slate-300 bg-slate-50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 shrink-0 bg-slate-900" />
            <div className="min-w-0 truncate text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-700">
              {label}
            </div>
          </div>
          {hint ? <div className="text-[13px] leading-5 text-slate-500">{hint}</div> : null}
        </div>
        <div className="flex items-center justify-center border-l border-slate-300 bg-slate-50 px-4 text-center text-4xl font-semibold tracking-[-0.055em] text-slate-950 tabular-nums">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div
        className={cx(
          "border border-slate-200 bg-[linear-gradient(180deg,#fbfdff,#f1f6fc)] px-4 py-4 text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.04)]",
          className
        )}
      >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value}</div>
      {hint ? <div className="mt-2 text-sm text-slate-500">{hint}</div> : null}
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
        "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.97))] p-6 shadow-[0_16px_36px_rgba(15,23,42,0.045)]",
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
        "border p-4",
        tone === "white"
          ? "border-slate-200 bg-white"
          : tone === "tint"
            ? "border-sky-200 bg-sky-50"
            : "border-slate-200 bg-[#f4f8fd]",
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
        "grid gap-3 border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fbff,#eef4fb)] p-8 text-center",
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
      return "inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-400 hover:bg-[#f3f7fd]";
    case "ghost":
      return "inline-flex items-center justify-center border border-slate-300 bg-[#f3f7fd] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#e9f0fb]";
    case "danger":
      return "inline-flex items-center justify-center border border-red-700 bg-red-700 px-4 py-3 text-sm font-medium text-white !text-white transition hover:bg-red-800 hover:!text-white";
    case "success":
      return "inline-flex items-center justify-center border border-emerald-700 bg-emerald-700 px-4 py-3 text-sm font-medium text-white !text-white transition hover:bg-emerald-800 hover:!text-white";
    default:
      return "inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-4 py-3 text-sm font-medium text-white !text-white transition hover:bg-[#0d1f3b] hover:!text-white";
  }
}

export function fieldClass(kind: "input" | "textarea" = "input") {
  return cx(
    "w-full border border-slate-300 bg-[#fbfdff] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#244980] focus:bg-white",
    kind === "textarea" ? "min-h-28 py-3" : "py-3"
  );
}
