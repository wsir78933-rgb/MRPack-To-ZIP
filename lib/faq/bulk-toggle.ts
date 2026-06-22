type FaqBulkToggleStateInput = {
  closeAllLabel: string;
  expandedQuestions: string[];
  faqQuestions: string[];
  openAllLabel: string;
};

type FaqBulkToggleState = {
  buttonLabel: string;
  nextExpandedQuestions: string[];
};

export function getFaqBulkToggleState({
  closeAllLabel,
  expandedQuestions,
  faqQuestions,
  openAllLabel
}: FaqBulkToggleStateInput): FaqBulkToggleState {
  const expandedQuestionSet = new Set(expandedQuestions);
  const areAllQuestionsExpanded =
    faqQuestions.length > 0 &&
    faqQuestions.every((faqQuestion) => expandedQuestionSet.has(faqQuestion));

  return {
    buttonLabel: areAllQuestionsExpanded ? closeAllLabel : openAllLabel,
    nextExpandedQuestions: areAllQuestionsExpanded ? [] : faqQuestions
  };
}
