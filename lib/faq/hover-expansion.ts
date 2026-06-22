type HoverExpandedQuestionsInput = {
  expandedQuestions: string[];
  hoveredQuestion: string | null;
};

type HoverLeaveInput = {
  hoveredQuestion: string | null;
  leavingQuestion: string;
};

type ManualExpandedQuestionsInput = {
  expandedQuestions: string[];
  hoveredQuestion: string | null;
  nextVisibleExpandedQuestions: string[];
};

export function getHoverExpandedQuestions({
  expandedQuestions,
  hoveredQuestion,
}: HoverExpandedQuestionsInput): string[] {
  if (!hoveredQuestion || expandedQuestions.includes(hoveredQuestion)) {
    return expandedQuestions;
  }

  return [...expandedQuestions, hoveredQuestion];
}

export function getNextHoveredQuestionAfterLeave({
  hoveredQuestion,
  leavingQuestion,
}: HoverLeaveInput): string | null {
  return hoveredQuestion === leavingQuestion ? null : hoveredQuestion;
}

export function getNextHoveredQuestionAfterVisibleChange({
  hoveredQuestion,
  nextVisibleExpandedQuestions,
}: ManualExpandedQuestionsInput): string | null {
  if (!hoveredQuestion) {
    return null;
  }

  return nextVisibleExpandedQuestions.includes(hoveredQuestion)
    ? hoveredQuestion
    : null;
}

export function getNextManualExpandedQuestionsAfterVisibleChange({
  expandedQuestions,
  hoveredQuestion,
  nextVisibleExpandedQuestions,
}: ManualExpandedQuestionsInput): string[] {
  if (!hoveredQuestion) {
    return nextVisibleExpandedQuestions;
  }

  const isHoveredQuestionManual = expandedQuestions.includes(hoveredQuestion);
  if (isHoveredQuestionManual) {
    return nextVisibleExpandedQuestions;
  }

  const nextManualExpandedQuestions = nextVisibleExpandedQuestions.filter(
    (visibleQuestion) => visibleQuestion !== hoveredQuestion,
  );

  if (nextVisibleExpandedQuestions.includes(hoveredQuestion)) {
    return nextManualExpandedQuestions;
  }

  return [...nextManualExpandedQuestions, hoveredQuestion];
}
