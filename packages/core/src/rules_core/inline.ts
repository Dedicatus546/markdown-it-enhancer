import StateCore from "./state_core";

export default async function inline(state: StateCore) {
  const tokens = state.tokens;

  // Parse inlines
  for (let i = 0, l = tokens.length; i < l; i++) {
    const token = tokens[i];
    if (token.type === "inline") {
      await state.md.inline.parse(
        token.content,
        state.md,
        state.env,
        token.children,
      );
    }
  }
}
