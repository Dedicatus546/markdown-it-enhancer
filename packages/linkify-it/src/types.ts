import type { LinkifyIt } from "./linkify-it";
import type { Match } from "./match";

export interface LinkifyItOptions {
  "fuzzyLink"?: boolean
  "fuzzyEmail"?: boolean
  "fuzzyIP"?: boolean
  "---"?: boolean
}

export type LinkifyItNormalizedOptions = Required<LinkifyItOptions>;

export interface LinkifyItSchemasObject {
  validate:
    | RegExp
    | ((text: string, pos: number, linkifyIt: LinkifyIt) => number)
  normalize?: (match: Match, linkifyIt: LinkifyIt) => void
}

export interface LinkifyItSchemas {
  [key: string]: string | LinkifyItSchemasObject
}

export interface LinkifyItNormalizedSchemas {
  [key: string]: {
    validate: (text: string, pos: number, linkifyIt: LinkifyIt) => number
    normalize: (match: Match, linkifyIt: LinkifyIt) => void
  }
}

export type CreateRegExpResult = {
  src_Any: string
  src_Cc: string
  src_Z: string
  src_P: string
  src_ZPCc: string
  src_ZCc: string
  src_pseudo_letter: string
  src_ip4: string
  src_auth: string
  src_port: string
  src_host_terminator: string
  src_path: string
  src_email_name: string
  src_xn: string
  src_domain_root: string
  src_domain: string
  src_host: string
  tpl_host_fuzzy: string
  tpl_host_no_ip_fuzzy: string
  src_host_strict: string
  tpl_host_fuzzy_strict: string
  src_host_port_strict: string
  tpl_host_port_fuzzy_strict: string
  tpl_host_port_no_ip_fuzzy_strict: string
  tpl_host_fuzzy_test: string
  tpl_email_fuzzy: string
  tpl_link_fuzzy: string
  tpl_link_no_ip_fuzzy: string
};

export type LinkifyItRegExp = CreateRegExpResult & {
  src_tlds: string
  schema_test: RegExp
  schema_search: RegExp
  schema_at_start: RegExp
  pretest: RegExp
  email_fuzzy: RegExp
  link_fuzzy: RegExp
  link_no_ip_fuzzy: RegExp
  host_fuzzy_test: RegExp
  http?: RegExp
  no_http?: RegExp
  mailto?: RegExp
} & {
  [key: string]: RegExp | undefined
};
