import StateCore from "./state_core";

export default async function block(state: StateCore) {
  let token;

  if (state.inlineMode) {
    token = new state.Token("inline", "", 0);
    token.content = state.src;
    token.map = [0, 1];
    token.children = [];
    state.tokens.push(token);
  } else {
    await state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
}
