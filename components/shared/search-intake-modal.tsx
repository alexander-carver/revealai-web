"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  SEARCH_INTAKE_QUESTIONS,
  type SearchIntakeAnswers,
} from "@/lib/search-intake";

interface SearchIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: SearchIntakeAnswers) => void;
  productLabel: string;
  queryLabel: string;
  themeColor: string;
  themeSoftColor: string;
  themeBorderColor: string;
  Icon: LucideIcon;
}

export function SearchIntakeModal({
  isOpen,
  onClose,
  onComplete,
  productLabel,
  queryLabel,
  themeColor,
  themeSoftColor,
  themeBorderColor,
  Icon,
}: SearchIntakeModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SearchIntakeAnswers>({});
  const currentQuestion = SEARCH_INTAKE_QUESTIONS[currentIndex];
  const selectedValue = answers[currentQuestion.id];
  const progress = ((currentIndex + 1) / SEARCH_INTAKE_QUESTIONS.length) * 100;
  const isLastStep = currentIndex === SEARCH_INTAKE_QUESTIONS.length - 1;
  const answeredCount = useMemo(
    () =>
      SEARCH_INTAKE_QUESTIONS.filter((question) => answers[question.id]).length,
    [answers],
  );

  useEffect(() => {
    if (!isOpen) return;

    setCurrentIndex(0);
    setAnswers({});
  }, [isOpen, queryLabel]);

  const handleOptionSelect = (value: string) => {
    if (value !== selectedValue) {
      triggerHapticFeedback("selection");
    }

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (!selectedValue) {
      triggerHapticFeedback("warning");
      return;
    }

    if (isLastStep) {
      triggerHapticFeedback("success");
      onComplete(answers);
      return;
    }

    triggerHapticFeedback("impact");
    setCurrentIndex((index) => index + 1);
  };

  const handleBack = () => {
    triggerHapticFeedback("selection");
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const handleSkip = () => {
    triggerHapticFeedback("impact");
    onComplete({});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="mx-0 flex h-[100dvh] max-h-[100dvh] max-w-none flex-col overflow-hidden rounded-none border-0 sm:mx-4 sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-[28px] sm:border"
    >
      <ModalHeader className="shrink-0 px-4 pb-2 pr-14 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] sm:mb-5 sm:text-xs"
          style={{
            backgroundColor: themeSoftColor,
            borderColor: themeBorderColor,
            color: themeColor,
          }}
        >
          <Icon className="h-4 w-4" />
          {productLabel}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-500">
            <span>
              Question {currentIndex + 1} of {SEARCH_INTAKE_QUESTIONS.length}
            </span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: themeColor,
              }}
            />
          </div>
        </div>

        <h3 className="mt-4 text-[1.7rem] font-bold leading-[1.08] text-gray-950 sm:mt-5 sm:text-3xl">
          {currentQuestion.title}
        </h3>
        <p className="mt-2 hidden text-sm leading-6 text-gray-600 sm:block">
          {currentQuestion.subtitle}
        </p>
        {queryLabel && (
          <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 sm:mt-4 sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 sm:text-xs">
              Current search
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-gray-900">
              {queryLabel}
            </p>
          </div>
        )}
      </ModalHeader>

      <ModalContent className="min-h-0 flex-1 px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="grid gap-2 sm:gap-2.5">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className={cn(
                  "group flex min-h-[54px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all sm:min-h-[76px] sm:items-start sm:p-4",
                  isSelected
                    ? "bg-white shadow-lg"
                    : "border-gray-100 bg-white hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md",
                )}
                style={{
                  borderColor: isSelected ? themeColor : undefined,
                  boxShadow: isSelected
                    ? `0 18px 45px -30px ${themeColor}`
                    : undefined,
                  }}
                >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all sm:mt-0.5",
                    isSelected ? "text-white" : "text-transparent",
                  )}
                  style={{
                    backgroundColor: isSelected ? themeColor : "#ffffff",
                    borderColor: isSelected ? themeColor : "#d1d5db",
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-5 text-gray-950 sm:text-sm">
                    {option.label}
                  </span>
                  <span className="mt-1 hidden text-xs leading-5 text-gray-500 sm:block sm:text-sm">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </ModalContent>

      <ModalFooter className="mt-auto flex-col items-stretch gap-3 border-t border-gray-100 bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
          <strong>Disclaimer:</strong> RevealAI is not a Consumer Reporting Agency. Data may not be used for employment, tenant screening, or credit decisions. Results are not guaranteed.
        </p>
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={currentIndex === 0}
              onClick={handleBack}
              className="gap-1.5 px-2.5 sm:gap-2 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
            >
              Skip
            </Button>
          </div>

          <Button
            type="button"
            disabled={!selectedValue}
            onClick={handleNext}
            className="min-w-[132px] gap-2 text-white"
            style={{ backgroundColor: themeColor }}
          >
            {isLastStep ? "Start Search" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
