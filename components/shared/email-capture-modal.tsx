"use client";

import { useState } from "react";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "@/components/ui/modal";

import { type QuestionAnswers } from "./search-loading-screen";

interface EmailCaptureModalProps {
  isOpen: boolean;
  onContinue: (email: string) => void;
  searchQuery?: string;
  answers?: QuestionAnswers;
}

export function EmailCaptureModal({
  isOpen,
  onContinue,
  searchQuery,
  answers,
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    onContinue(email.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} className="max-w-md bg-white border-0 shadow-2xl">
      <ModalHeader className="bg-green-50 rounded-t-2xl border-b border-green-100 pb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4">
          <ShieldCheck className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          Report Compiled
        </h3>
        {searchQuery && (
          <p className="mt-1 text-sm font-medium text-gray-600">
            Subject: <span className="text-gray-900 font-bold">{searchQuery}</span>
          </p>
        )}
        <p className="mt-3 text-sm text-green-800 font-medium bg-green-100/50 inline-block px-3 py-1 rounded-full border border-green-200">
          Where should we send your results?
        </p>
      </ModalHeader>
      
      <form onSubmit={handleSubmit}>
        <ModalContent className="pt-6">
          <div className="space-y-4">
            {answers && (answers.plateNumber || answers.additionalInfo) && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm mb-4">
                <p className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">Included in Report</p>
                <ul className="space-y-1.5 text-gray-600">
                  {answers.plateNumber && (
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">Vehicle Plate:</span>
                      <span className="text-gray-900">{answers.plateNumber}</span>
                    </li>
                  )}
                  {answers.additionalInfo && (
                    <li className="flex items-start gap-2">
                      <span className="font-medium min-w-[80px]">Extra Info:</span>
                      <span className="text-gray-900 line-clamp-2">{answers.additionalInfo}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 text-base font-medium rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                autoFocus
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            
            <p className="text-xs text-center text-gray-500 leading-relaxed mt-4">
              Your report requires verification. By entering your email, you agree to receive your results and occasional updates. We hate spam and you can unsubscribe at any time.
            </p>
          </div>
        </ModalContent>
        <ModalFooter className="border-t border-gray-100 bg-gray-50/50 rounded-b-2xl pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-semibold text-white bg-green-600 hover:bg-green-700 shadow-md transition-all rounded-xl"
          >
            Continue to Report
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
