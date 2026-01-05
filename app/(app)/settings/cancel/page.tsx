"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Loader2,
  X,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const CANCELLATION_QUESTIONS = [
  "What was the main reason you decided to cancel your subscription?",
  "What features or improvements would have made you want to keep your subscription?",
  "How did you primarily use RevealAI during your subscription?",
  "What alternatives are you considering instead of RevealAI?",
  "On a scale of 1-10, how satisfied were you with the search results quality? Please explain your rating.",
  "Did you encounter any technical issues or bugs that affected your experience? If so, please describe them.",
  "What price point would make RevealAI more appealing to you?",
  "How did you first hear about RevealAI, and did it meet your initial expectations?",
  "Would you consider resubscribing in the future if certain changes were made? What would those changes need to be?",
  "Is there anything else you'd like to share about your experience with RevealAI?",
];

const MIN_CHARACTERS = 250;

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const getCurrentAnswer = () => answers[currentQuestion] || "";
  const getCurrentCharacterCount = () => getCurrentAnswer().length;
  const isCurrentAnswerValid = () => getCurrentCharacterCount() >= MIN_CHARACTERS;

  const handleNext = () => {
    if (!isCurrentAnswerValid()) {
      setError(`Please write at least ${MIN_CHARACTERS} characters for this question.`);
      return;
    }
    setError(null);
    if (currentQuestion < CANCELLATION_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setError(null);
    }
  };

  const handleCancel = async () => {
    // Validate all answers
    const allValid = answers.every((answer) => answer.length >= MIN_CHARACTERS);
    if (!allValid) {
      setError("Please complete all questions with at least 250 characters each.");
      setCurrentQuestion(answers.findIndex((a) => a.length < MIN_CHARACTERS));
      return;
    }

    if (!user) {
      setError("You must be signed in to cancel your subscription.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit questionnaire and cancel subscription
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          questionnaire: answers.map((answer, index) => ({
            question: CANCELLATION_QUESTIONS[index],
            answer,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/settings?canceled=true&message=" + encodeURIComponent("Your subscription will be canceled at the end of your billing period. Thank you for your feedback!"));
      } else {
        setError(data.error || "Failed to cancel subscription. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progressive percentage: Q1=1%, Q2=2%, Q3=3%, Q4=4%, Q5=5%, then Q6-Q10 add 19% each (24%, 43%, 62%, 81%, 100%)
  const getProgress = () => {
    if (currentQuestion === 0) return 1;
    if (currentQuestion === 1) return 2;
    if (currentQuestion === 2) return 3;
    if (currentQuestion === 3) return 4;
    if (currentQuestion === 4) return 5;
    if (currentQuestion === 5) return 24;
    if (currentQuestion === 6) return 43;
    if (currentQuestion === 7) return 62;
    if (currentQuestion === 8) return 81;
    if (currentQuestion === 9) return 100;
    return 0;
  };

  const progress = getProgress();
  const allQuestionsAnswered = answers.every((a) => a.length >= MIN_CHARACTERS);

  return (
    <div>
      <PageHeader
        title="Cancel Subscription"
        description="We're sorry to see you go. Please help us improve by answering a few questions."
        icon={AlertCircle}
        iconColor="text-red-500"
        iconBgColor="bg-red-100"
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          {error}
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-end items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {CANCELLATION_QUESTIONS[currentQuestion]}
            </h3>
            <Textarea
              value={getCurrentAnswer()}
              onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
              placeholder={`Please provide a detailed answer (minimum ${MIN_CHARACTERS} characters)...`}
              className="min-h-[200px] resize-none"
              disabled={isSubmitting}
            />
            <div className="mt-2 flex justify-between items-center">
              <span
                className={`text-sm ${
                  isCurrentAnswerValid()
                    ? "text-green-600"
                    : getCurrentCharacterCount() > 0
                    ? "text-orange-600"
                    : "text-muted-foreground"
                }`}
              >
                {getCurrentCharacterCount()} / {MIN_CHARACTERS} characters
                {isCurrentAnswerValid() && (
                  <Check className="inline w-4 h-4 ml-1" />
                )}
              </span>
              {!isCurrentAnswerValid() && getCurrentCharacterCount() > 0 && (
                <span className="text-sm text-orange-600">
                  {MIN_CHARACTERS - getCurrentCharacterCount()} more characters needed
                </span>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="ghost" disabled={isSubmitting}>
                  Go Back
                </Button>
              </Link>

              {currentQuestion < CANCELLATION_QUESTIONS.length - 1 ? (
                <Button onClick={handleNext} disabled={!isCurrentAnswerValid() || isSubmitting}>
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={handleCancel}
                  disabled={!allQuestionsAnswered || isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel Subscription
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

