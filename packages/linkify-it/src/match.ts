/**
 * class Match
 *
 * Match result. Single element of array, returned by [[LinkifyIt#match]]
 **/

import type { LinkifyIt } from "./linkify-it";

export class Match {
  /**
   * Match#schema -> String
   *
   * Prefix (protocol) for matched string.
   **/
  schema: string;
  /**
   * Match#index -> Number
   *
   * First position of matched string.
   **/
  index: number;
  /**
   * Match#lastIndex -> Number
   *
   * Next position after matched string.
   **/
  lastIndex: number;
  /**
   * Match#raw -> String
   *
   * Matched string.
   **/
  raw: string;
  /**
   * Match#text -> String
   *
   * Notmalized text of matched string.
   **/
  text: string;
  /**
   * Match#url -> String
   *
   * Normalized url of matched string.
   **/
  url: string;

  constructor(linkifyIt: LinkifyIt, shift: number) {
    const start = linkifyIt.__index__;
    const end = linkifyIt.__last_index__;
    const text = linkifyIt.__text_cache__.slice(start, end);

    this.schema = linkifyIt.__schema__.toLowerCase();
    this.index = start + shift;
    this.lastIndex = end + shift;
    this.raw = text;

    this.text = text;
    this.url = text;
  }
}
