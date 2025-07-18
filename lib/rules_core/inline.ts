import StateCore from "./state_core";

export default function inline(state: StateCore) {
  const tokens = state.tokens;

  // Parse inlines
  for (let i = 0, l = tokens.length; i < l; i++) {
    const token = tokens[i];
    if (token.type === "inline") {
      state.md.inline.parse(token.content, state.md, state.env, token.children);
    }
  }
}
