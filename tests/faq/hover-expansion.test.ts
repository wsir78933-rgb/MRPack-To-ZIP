import { describe, expect, test } from "vitest";

import {
  getHoverExpandedQuestions,
  getNextHoveredQuestionAfterVisibleChange,
  getNextManualExpandedQuestionsAfterVisibleChange,
  getNextHoveredQuestionAfterLeave,
} from "@/lib/faq/hover-expansion";

describe("FAQ hover expansion", () => {
  test("adds a hovered question to the visible expanded questions", () => {
    expect(
      getHoverExpandedQuestions({
        expandedQuestions: ["Will my file be uploaded?"],
        hoveredQuestion: "Why convert .mrpack to ZIP?",
      }),
    ).toEqual(["Will my file be uploaded?", "Why convert .mrpack to ZIP?"]);
  });

  test("does not duplicate a manually expanded hovered question", () => {
    expect(
      getHoverExpandedQuestions({
        expandedQuestions: ["Will my file be uploaded?"],
        hoveredQuestion: "Will my file be uploaded?",
      }),
    ).toEqual(["Will my file be uploaded?"]);
  });

  test("keeps manually expanded questions when there is no hovered question", () => {
    expect(
      getHoverExpandedQuestions({
        expandedQuestions: ["Will my file be uploaded?"],
        hoveredQuestion: null,
      }),
    ).toEqual(["Will my file be uploaded?"]);
  });

  test("clears the hovered question only when that question is left", () => {
    expect(
      getNextHoveredQuestionAfterLeave({
        hoveredQuestion: "Why convert .mrpack to ZIP?",
        leavingQuestion: "Why convert .mrpack to ZIP?",
      }),
    ).toBeNull();

    expect(
      getNextHoveredQuestionAfterLeave({
        hoveredQuestion: "Why convert .mrpack to ZIP?",
        leavingQuestion: "Will my file be uploaded?",
      }),
    ).toBe("Why convert .mrpack to ZIP?");
  });

  test("keeps a hovered question temporary when another question is clicked", () => {
    expect(
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions: [],
        hoveredQuestion: "Why convert .mrpack to ZIP?",
        nextVisibleExpandedQuestions: [
          "Why convert .mrpack to ZIP?",
          "Will my file be uploaded?",
        ],
      }),
    ).toEqual(["Will my file be uploaded?"]);
  });

  test("turns a hover-opened question into a manual question when it is clicked", () => {
    expect(
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions: [],
        hoveredQuestion: "Why convert .mrpack to ZIP?",
        nextVisibleExpandedQuestions: [],
      }),
    ).toEqual(["Why convert .mrpack to ZIP?"]);
  });

  test("lets a manually opened hovered question close when it is clicked", () => {
    expect(
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions: ["Why convert .mrpack to ZIP?"],
        hoveredQuestion: "Why convert .mrpack to ZIP?",
        nextVisibleExpandedQuestions: [],
      }),
    ).toEqual([]);
  });

  test("clears hover state when a hovered manual question is clicked closed", () => {
    const hoveredQuestion = "Why convert .mrpack to ZIP?";
    const nextManualExpandedQuestions =
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions: [hoveredQuestion],
        hoveredQuestion,
        nextVisibleExpandedQuestions: [],
      });
    const nextHoveredQuestion = getNextHoveredQuestionAfterVisibleChange({
      expandedQuestions: [hoveredQuestion],
      hoveredQuestion,
      nextVisibleExpandedQuestions: [],
    });

    expect(
      getHoverExpandedQuestions({
        expandedQuestions: nextManualExpandedQuestions,
        hoveredQuestion: nextHoveredQuestion,
      }),
    ).toEqual([]);
  });

  test("keeps a clicked hover-opened question visible as a manual question", () => {
    const hoveredQuestion = "Why convert .mrpack to ZIP?";
    const nextManualExpandedQuestions =
      getNextManualExpandedQuestionsAfterVisibleChange({
        expandedQuestions: [],
        hoveredQuestion,
        nextVisibleExpandedQuestions: [],
      });
    const nextHoveredQuestion = getNextHoveredQuestionAfterVisibleChange({
      expandedQuestions: [],
      hoveredQuestion,
      nextVisibleExpandedQuestions: [],
    });

    expect(
      getHoverExpandedQuestions({
        expandedQuestions: nextManualExpandedQuestions,
        hoveredQuestion: nextHoveredQuestion,
      }),
    ).toEqual([hoveredQuestion]);
  });
});
