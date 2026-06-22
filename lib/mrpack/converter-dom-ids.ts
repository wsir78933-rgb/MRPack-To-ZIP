export const uploadInputId = "mrpack-upload-input";

export function getFaqItemDomIds(faqItemIndex: number) {
  if (!Number.isInteger(faqItemIndex) || faqItemIndex < 0) {
    throw new Error(`Invalid FAQ item index: ${faqItemIndex}. Expected a non-negative integer.`);
  }

  return {
    triggerId: `mrpack-faq-item-${faqItemIndex}-trigger`,
    contentId: `mrpack-faq-item-${faqItemIndex}-content`,
  };
}
