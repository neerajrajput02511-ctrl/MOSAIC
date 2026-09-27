"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Info, RefreshCw, XCircle } from "lucide-react";

/* ========================================================================= */
/* MOSAIC UNIFIED DESIGN SYSTEM TOKENS & COMPONENTS                          */
/* Premium Meteorological Command Center Theme (SIH26081)                    */
/* ========================================================================= */

// 1. MOSAIC CARD
export interface MosaicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "interactive" | "highlight";
  glow?: boolean;
}

export const MosaicCard: React.FC<MosaicCardProps> = ({
  variant = "default",
  glow = false,
  className = "",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-[#0D1B2E] border-[#1E293B] text-[#F4F8FC]",
    secondary: "bg-[#081426] border-[#1E293B] text-[#F4F8FC]",
    interactive: "bg-[#0D1B2E] border-[#233852] hover:border-[#00B8E6]/50 hover:bg-[#111F33] transition-all cursor-pointer text-[#F4F8FC]",
    highlight: "bg-gradient-to-br from-[#0D1B2E] to-[#101F34] border-[#00B8E6]/40 text-[#F4F8FC]"
  };

  const glowStyle = glow ? "shadow-lg shadow-[#00B8E6]/10" : "shadow-md";

  return (
    <div
      className={`rounded-xl border p-5 ${variantStyles[variant]} ${glowStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// 2. MOSAIC BUTTON
export interface MosaicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const MosaicButton: React.FC<MosaicButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-xs font-semibold",
    lg: "px-5 py-2.5 text-sm font-bold"
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white hover:brightness-110 shadow-sm border border-transparent font-semibold",
    secondary: "bg-[#0D1B2E] hover:bg-[#172A43] text-[#F4F8FC] border border-[#233852] hover:border-[#00B8E6]/40 font-semibold",
    ghost: "bg-transparent hover:bg-[#111F33] text-[#9DAFC4] hover:text-[#F4F8FC] border border-transparent",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold",
    icon: "p-2 bg-[#0D1B2E] hover:bg-[#172A43] text-[#9DAFC4] hover:text-[#00B8E6] border border-[#233852] rounded-lg"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

// 3. MOSAIC BADGE
export interface MosaicBadgeProps {
  status?: "LIVE" | "OPERATIONAL" | "STALE" | "OFFLINE" | "ERROR" | "WARNING" | "AUTH_REQUIRED" | "INFO";
  children?: React.ReactNode;
  className?: string;
}

export const MosaicBadge: React.FC<MosaicBadgeProps> = ({
  status = "INFO",
  children,
  className = ""
}) => {
  const styles: Record<string, string> = {
    LIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    OPERATIONAL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    STALE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    WARNING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    OFFLINE: "bg-slate-800 text-slate-400 border-slate-700",
    ERROR: "bg-red-500/10 text-red-400 border-red-500/30",
    AUTH_REQUIRED: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    INFO: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
  };

  const activeClass = styles[status] || styles.INFO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${activeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      <span>{children || status}</span>
    </span>
  );
};

// 4. MOSAIC TABS
export interface MosaicTabsProps {
  tabs: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const MosaicTabs: React.FC<MosaicTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 bg-[#081426] p-1.5 rounded-xl border border-[#1E293B] ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              isActive
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white hover:bg-[#0D1B2E]"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// 5. MOSAIC LOADING SKELETON / SPINNER
export interface MosaicLoadingProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export const MosaicLoading: React.FC<MosaicLoadingProps> = ({
  message = "Synchronizing Telemetry Feeds...",
  subtext = "Ingesting multi-model NWP runs and satellite assimilation",
  className = ""
}) => {
  return (
    <div className={`bg-[#0D1B2E] border border-[#1E293B] rounded-2xl p-12 text-center shadow-lg ${className}`}>
      <div className="relative w-12 h-12 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-[#1E293B]" />
        <div className="absolute inset-0 rounded-full border-2 border-[#00B8E6] border-t-transparent animate-spin" />
      </div>
      <h4 className="text-sm font-bold text-white tracking-wide">{message}</h4>
      <p className="text-xs text-[#9DAFC4] mt-1 max-w-md mx-auto">{subtext}</p>
    </div>
  );
};

// 6. MOSAIC ERROR STATE
export interface MosaicErrorProps {
  title?: string;
  message?: string;
  source?: string;
  lastSuccessfulUpdate?: string;
  onRetry?: () => void;
  className?: string;
}

export const MosaicError: React.FC<MosaicErrorProps> = ({
  title = "DATA UNAVAILABLE",
  message = "Unable to retrieve the latest meteorological telemetry for this coordinate.",
  source,
  lastSuccessfulUpdate,
  onRetry,
  className = ""
}) => {
  return (
    <div className={`bg-[#0D1B2E] border border-red-500/30 rounded-2xl p-8 text-center space-y-4 shadow-lg ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white uppercase font-mono tracking-wide">{title}</h4>
        <p className="text-xs text-[#9DAFC4] max-w-md mx-auto mt-1">{message}</p>
      </div>
      {(source || lastSuccessfulUpdate) && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-[#667B94] pt-2 border-t border-[#1E293B] max-w-md mx-auto">
          {source && <span>Source: <strong className="text-[#F4F8FC]">{source}</strong></span>}
          {lastSuccessfulUpdate && <span>Last sync: <strong className="text-[#F4F8FC]">{lastSuccessfulUpdate}</strong></span>}
        </div>
      )}
      {onRetry && (
        <div className="pt-2">
          <MosaicButton variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </MosaicButton>
        </div>
      )}
    </div>
  );
};

// 7. MOSAIC EMPTY STATE
export interface MosaicEmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const MosaicEmptyState: React.FC<MosaicEmptyStateProps> = ({
  title = "NO OBSERVATIONS AVAILABLE",
  message = "No valid telemetry records are currently available for this selection.",
  actionText,
  onAction,
  className = ""
}) => {
  return (
    <div className={`bg-[#0D1B2E] border border-[#1E293B] rounded-2xl p-10 text-center space-y-3 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-[#081426] border border-[#233852] text-[#667B94] flex items-center justify-center mx-auto">
        <Clock className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-[#F4F8FC] uppercase font-mono tracking-wide">{title}</h4>
      <p className="text-xs text-[#9DAFC4] max-w-md mx-auto">{message}</p>
      {actionText && onAction && (
        <div className="pt-2">
          <MosaicButton variant="secondary" size="sm" onClick={onAction}>
            {actionText}
          </MosaicButton>
        </div>
      )}
    </div>
  );
};
