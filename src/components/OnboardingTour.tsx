import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";

interface TourStep {
  targetTab: string;
  titleKey: string;
  descKey: string;
  /** CSS selector for the element to point at; empty = centered modal */
  targetSelector: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetTab: "analysis",
    titleKey: "onboarding.steps.welcome.title",
    descKey: "onboarding.steps.welcome.desc",
    targetSelector: "",
  },
  {
    targetTab: "analysis",
    titleKey: "onboarding.steps.function.title",
    descKey: "onboarding.steps.function.desc",
    targetSelector: ".tools-sidebar",
  },
  {
    targetTab: "analysis",
    titleKey: "onboarding.steps.upload.title",
    descKey: "onboarding.steps.upload.desc",
    targetSelector: ".chat-upload",
  },
  {
    targetTab: "settings",
    titleKey: "onboarding.steps.model.title",
    descKey: "onboarding.steps.model.desc",
    targetSelector: ".tools-sidebar",
  },
  {
    targetTab: "settings",
    titleKey: "onboarding.steps.embedding.title",
    descKey: "onboarding.steps.embedding.desc",
    targetSelector: ".tool-panel",
  },
  {
    targetTab: "about",
    titleKey: "onboarding.steps.help.title",
    descKey: "onboarding.steps.help.desc",
    targetSelector: ".tools-sidebar",
  },
];

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export const OnboardingTour: React.FC<{
  currentPage: string;
  onPageChange: (page: string) => void;
}> = ({ currentPage, onPageChange }) => {
  const { t } = useTranslation();
  const { onboardingCompleted, setOnboardingCompleted } = useAppStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [arrowDir, setArrowDir] = useState<"top" | "bottom" | "left" | "right" | "none">("none");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Show on first launch
  useEffect(() => {
    if (!onboardingCompleted) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const currentStep = TOUR_STEPS[step];

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (visible && currentStep && currentPage !== currentStep.targetTab) {
      onPageChange(currentStep.targetTab);
    }
  }, [step, visible, currentStep, currentPage, onPageChange]);

  // Calculate tooltip position — keeps tooltip inside viewport
  const updatePosition = useCallback(() => {
    if (!visible || !currentStep) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = 340;
    const tooltipH = 200; // estimated max height
    const gap = 14;
    const margin = 12;

    // No target selector → center of viewport
    if (!currentStep.targetSelector) {
      setPos({
        top: Math.round(vh / 2 - tooltipH / 2),
        left: Math.round(vw / 2 - tooltipW / 2),
      });
      setArrowDir("none");
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      setPos({
        top: Math.round(vh / 2 - tooltipH / 2),
        left: Math.round(vw / 2 - tooltipW / 2),
      });
      setArrowDir("none");
      return;
    }

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Try positions in priority order: right, bottom, left, top
    type Candidate = { top: number; left: number; arrow: typeof arrowDir };
    const candidates: Candidate[] = [];

    // Right of target
    candidates.push({
      top: Math.round(cy - tooltipH / 2),
      left: Math.round(rect.right + gap),
      arrow: "left",
    });
    // Bottom of target
    candidates.push({
      top: Math.round(rect.bottom + gap),
      left: Math.round(cx - tooltipW / 2),
      arrow: "top",
    });
    // Left of target
    candidates.push({
      top: Math.round(cy - tooltipH / 2),
      left: Math.round(rect.left - tooltipW - gap),
      arrow: "right",
    });
    // Top of target
    candidates.push({
      top: Math.round(rect.top - tooltipH - gap),
      left: Math.round(cx - tooltipW / 2),
      arrow: "bottom",
    });

    // Pick the first candidate that fits mostly inside the viewport
    for (const c of candidates) {
      const clampedTop = clamp(c.top, margin, vh - tooltipH - margin);
      const clampedLeft = clamp(c.left, margin, vw - tooltipW - margin);
      if (Math.abs(clampedTop - c.top) < tooltipH * 0.4 && Math.abs(clampedLeft - c.left) < tooltipW * 0.4) {
        setPos({ top: clampedTop, left: clampedLeft });
        setArrowDir(c.arrow);
        return;
      }
    }

    // Fallback: first candidate clamped
    const best = candidates[0];
    setPos({
      top: clamp(best.top, margin, vh - tooltipH - margin),
      left: clamp(best.left, margin, vw - tooltipW - margin),
    });
    setArrowDir(best.arrow);
  }, [visible, step, currentStep]);

  // Debounced position update using rAF to prevent flickering
  const scheduleUpdate = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updatePosition);
  }, [updatePosition]);

  // Recalculate when step changes or page changes
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(scheduleUpdate, 350);
      return () => clearTimeout(timer);
    }
  }, [visible, step, currentPage, scheduleUpdate]);

  // Resize listener
  useEffect(() => {
    if (visible) {
      window.addEventListener("resize", scheduleUpdate);
      return () => window.removeEventListener("resize", scheduleUpdate);
    }
  }, [visible, scheduleUpdate]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setVisible(false);
    setOnboardingCompleted(true);
  };

  // Block all pointer events outside the tooltip while onboarding is active
  useEffect(() => {
    if (visible && !onboardingCompleted) {
      const handler = (e: MouseEvent | TouchEvent) => {
        if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("mousedown", handler, true);
      document.addEventListener("touchstart", handler, true);
      document.addEventListener("click", handler, true);
      return () => {
        document.removeEventListener("mousedown", handler, true);
        document.removeEventListener("touchstart", handler, true);
        document.removeEventListener("click", handler, true);
      };
    }
  }, [visible, onboardingCompleted]);

  if (!visible || onboardingCompleted || !currentStep) return null;

  return (
    <div className="onboarding-overlay">
      {/* Highlight cutout for the target element */}
      {currentStep.targetSelector && (
        <OnboardingHighlight selector={currentStep.targetSelector} />
      )}

      <div
        ref={tooltipRef}
        className={`onboarding-tooltip ${!currentStep.targetSelector ? "onboarding-tooltip-centered" : ""}`}
        style={{ top: pos.top, left: pos.left }}
      >
        {arrowDir !== "none" && (
          <div className={`onboarding-arrow onboarding-arrow-${arrowDir}`} />
        )}
        <div className="onboarding-step-indicator">
          {step + 1} / {TOUR_STEPS.length}
        </div>
        <h3 className="onboarding-title">{t(currentStep.titleKey)}</h3>
        <p className="onboarding-desc">{t(currentStep.descKey)}</p>
        <div className="onboarding-actions">
          {step > 0 && (
            <button className="onboarding-btn onboarding-btn-prev" onClick={handlePrev}>
              {t("onboarding.prev")}
            </button>
          )}
          <button className="onboarding-btn onboarding-btn-skip" onClick={handleSkip}>
            {t("onboarding.skip")}
          </button>
          <button className="onboarding-btn onboarding-btn-next" onClick={handleNext}>
            {step < TOUR_STEPS.length - 1
              ? t("onboarding.next")
              : t("onboarding.finish")}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Renders a highlight box around the target element */
const OnboardingHighlight: React.FC<{ selector: string }> = ({ selector }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    const timer = setTimeout(update, 350);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [selector]);

  if (!rect) return null;

  const pad = 6;
  return (
    <div
      className="onboarding-highlight"
      style={{
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    />
  );
};
