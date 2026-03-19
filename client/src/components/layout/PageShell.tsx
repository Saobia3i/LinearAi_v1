import { PropsWithChildren } from "react";

type PageShellProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
}>;

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="page-shell">
      <div className="page-container">
        {title ? <h1 className="section-title">{title}</h1> : null}
        {subtitle ? <p className="section-subtitle mt-1">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}   