export type SearchIntakeQuestionId =
  | "locationKnowledge"
  | "ageRange"
  | "extraClue"
  | "nameConfidence"
  | "reportFocus";

export type SearchIntakeAnswers = Partial<
  Record<SearchIntakeQuestionId, string>
>;

export interface SearchIntakeOption {
  value: string;
  label: string;
  description: string;
}

export interface SearchIntakeQuestion {
  id: SearchIntakeQuestionId;
  title: string;
  subtitle: string;
  options: SearchIntakeOption[];
}

export const SEARCH_INTAKE_TOKEN_PARAM = "intake";
export const SEARCH_INTAKE_STORAGE_PREFIX = "revealai_search_intake:";

export const SEARCH_INTAKE_QUESTIONS: SearchIntakeQuestion[] = [
  {
    id: "locationKnowledge",
    title: "Do you know where they live or lived recently?",
    subtitle: "Location clues help separate the right person from similar names.",
    options: [
      {
        value: "current-city",
        label: "I know their city",
        description: "Use the city or state already entered as a strong match clue.",
      },
      {
        value: "past-city",
        label: "I know a past city",
        description: "Check older address and relocation signals around that place.",
      },
      {
        value: "state-region",
        label: "Only a state or region",
        description: "Keep the search broad and compare nearby matches.",
      },
      {
        value: "not-sure-location",
        label: "Not sure",
        description: "Lean on name, age, associates, and public profile clues.",
      },
    ],
  },
  {
    id: "ageRange",
    title: "About how old are they?",
    subtitle: "Even a rough age range helps avoid wrong-person matches.",
    options: [
      {
        value: "under-25",
        label: "Under 25",
        description: "Prioritize younger social and education-linked signals.",
      },
      {
        value: "25-34",
        label: "25 to 34",
        description: "Look for current profiles, work history, and address clues.",
      },
      {
        value: "35-49",
        label: "35 to 49",
        description: "Balance current records with longer public history.",
      },
      {
        value: "50-plus-or-unsure",
        label: "50+ or not sure",
        description: "Keep age matching flexible while checking records.",
      },
    ],
  },
  {
    id: "extraClue",
    title: "What other clue do you have about them?",
    subtitle: "One extra clue can make the report much sharper.",
    options: [
      {
        value: "phone-email",
        label: "Phone or email",
        description: "Connect contact clues to directories and public accounts.",
      },
      {
        value: "username-social",
        label: "Username or social profile",
        description: "Compare handles, profile names, and public activity.",
      },
      {
        value: "work-school",
        label: "Work or school",
        description: "Use professional or education clues to narrow matches.",
      },
      {
        value: "no-extra-clue",
        label: "No extra clue yet",
        description: "Start with the name and location, then rank confidence.",
      },
    ],
  },
  {
    id: "nameConfidence",
    title: "How sure are you about their name?",
    subtitle: "This helps RevealAI account for nicknames and alternate spellings.",
    options: [
      {
        value: "exact-name",
        label: "Exact full name",
        description: "Treat the entered name as the primary match.",
      },
      {
        value: "nickname",
        label: "Could be a nickname",
        description: "Check common short names, aliases, and profile names.",
      },
      {
        value: "spelling-unsure",
        label: "Spelling may be off",
        description: "Watch for close spellings and similar-name records.",
      },
      {
        value: "only-partial-name",
        label: "Only part of the name",
        description: "Keep the match broad and explain uncertainty.",
      },
    ],
  },
  {
    id: "reportFocus",
    title: "What should we check first?",
    subtitle: "Pick the section that would help you most right away.",
    options: [
      {
        value: "contact-location",
        label: "Contact and location",
        description: "Address history, phone, email, and location signals.",
      },
      {
        value: "social-web",
        label: "Social and web profiles",
        description: "Profiles, usernames, photos, and public activity.",
      },
      {
        value: "public-records",
        label: "Public records",
        description: "Court, filing, property, and public-record context.",
      },
      {
        value: "safety-red-flags",
        label: "Safety red flags",
        description: "Inconsistencies, risky signals, and confidence notes.",
      },
    ],
  },
];

const INTAKE_PARAM_KEYS: Record<SearchIntakeQuestionId, string> = {
  locationKnowledge: "locationKnowledge",
  ageRange: "ageRange",
  extraClue: "extraClue",
  nameConfidence: "nameConfidence",
  reportFocus: "reportFocus",
};

const VALID_QUESTION_IDS = new Set<SearchIntakeQuestionId>(
  SEARCH_INTAKE_QUESTIONS.map((question) => question.id),
);

function getQuestionOptionLabel(
  questionId: SearchIntakeQuestionId,
  value: string | undefined,
) {
  if (!value) return null;

  const question = SEARCH_INTAKE_QUESTIONS.find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label ?? null;
}

function isSearchIntakeQuestionId(value: string): value is SearchIntakeQuestionId {
  return VALID_QUESTION_IDS.has(value as SearchIntakeQuestionId);
}

function isValidAnswer(
  questionId: SearchIntakeQuestionId,
  value: unknown,
): value is string {
  return typeof value === "string" && Boolean(getQuestionOptionLabel(questionId, value));
}

export function createSearchIntakeToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSearchIntakeStorageKey(token: string | null | undefined) {
  if (!token || !/^[a-zA-Z0-9_-]{8,80}$/.test(token)) return null;
  return `${SEARCH_INTAKE_STORAGE_PREFIX}${token}`;
}

export function normalizeSearchIntakeAnswers(value: unknown): SearchIntakeAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const answers: SearchIntakeAnswers = {};

  for (const [questionId, answer] of Object.entries(value)) {
    if (isSearchIntakeQuestionId(questionId) && isValidAnswer(questionId, answer)) {
      answers[questionId] = answer;
    }
  }

  return answers;
}

export function appendSearchIntakeParams(
  params: URLSearchParams,
  answers: SearchIntakeAnswers,
) {
  for (const question of SEARCH_INTAKE_QUESTIONS) {
    const answer = answers[question.id];
    if (answer) {
      params.set(INTAKE_PARAM_KEYS[question.id], answer);
    }
  }
}

export function getSearchIntakeAnswersFromParams(params: {
  get: (key: string) => string | null;
}): SearchIntakeAnswers {
  const answers: SearchIntakeAnswers = {};

  for (const question of SEARCH_INTAKE_QUESTIONS) {
    const value = params.get(INTAKE_PARAM_KEYS[question.id]);
    if (isValidAnswer(question.id, value)) {
      answers[question.id] = value;
    }
  }

  return answers;
}

export function hasSearchIntakeAnswers(answers: SearchIntakeAnswers) {
  return SEARCH_INTAKE_QUESTIONS.some((question) => Boolean(answers[question.id]));
}

export function buildSearchIntakePromptContext(answers: SearchIntakeAnswers) {
  const lines = SEARCH_INTAKE_QUESTIONS.flatMap((question) => {
    const label = getQuestionOptionLabel(question.id, answers[question.id]);
    return label ? [`- ${question.title} ${label}`] : [];
  });

  if (lines.length === 0) return "";

  return [
    "The user answered a short pre-search intake about the person they are searching. Use it to narrow matching, prioritize the report, explain confidence carefully, and avoid overclaiming when details are uncertain.",
    ...lines,
  ].join("\n");
}
