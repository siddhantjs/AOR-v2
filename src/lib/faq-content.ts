/**
 * Plain-text FAQ for JSON-LD (must match visible LandingFaq Q&As).
 * Answers are direct and factual for AEO / featured snippets.
 */
export const HOME_FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: "What exactly is a cohort group?",
    answer:
      "Everyone who received AOR in the same month, on the same stream (inland or outland). Because IRCC broadly processes files in intake order, your AOR-month cohort is the most meaningful comparison group there is. Enter your AOR date and you're in - no joining step.",
  },
  {
    question: "Can I see other people's timelines?",
    answer:
      "Yes - every tracked application becomes an anonymous community timeline showing pathway, AOR month, and milestone days. Filter to your cohort to see exactly what statuses people around your AOR date are getting. Names, emails and application numbers are never shown.",
  },
  {
    question: "Do I have to join WhatsApp or Facebook to use the tracker?",
    answer:
      "No - the tracker is fully functional on its own. The communities are optional and free; most people join once their file hits the background-check stage and the questions start piling up.",
  },
  {
    question: "Does this connect to my IRCC account?",
    answer:
      "No. You check your status in your IRCC account or the official status tracker on canada.ca, then log it here. We never ask for your GCKey, UCI or application number.",
  },
  {
    question: 'Where do the "typical day" numbers come from?',
    answer:
      "Community medians from tracked timelines with your pathway and stream. They are reference points, not IRCC promises - official standards live on canada.ca.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes - free forever, no card, no signup to start. It is a community tool from GetNorthPath.",
  },
];
