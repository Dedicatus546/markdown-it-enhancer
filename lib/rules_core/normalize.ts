// Normalize input string

import StateCore from "./state_core";

// https://spec.commonmark.org/0.29/#line-ending
const NEWLINES_RE = /\r\n?|\n/g;
const NULL_RE = /\0/g;

export default function normalize(state: StateCore) {
  state.src = state.src
    // Normalize newlines
    .replace(NEWLINES_RE, "\n")
    // Replace NULL characters
    .replace(NULL_RE, "\uFFFD");
}
