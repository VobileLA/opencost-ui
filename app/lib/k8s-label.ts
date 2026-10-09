/** Sentinel stored in selects. The API value is `label:<key>`, never this token. */
export const K8S_LABEL_OPTION = "__k8s_label__";

const LABEL_TOKEN = /^label:(.*)$/;

export function isK8sLabelToken(value: string): boolean {
  return value.startsWith("label:");
}

export function labelKeyFromToken(value: string): string {
  return LABEL_TOKEN.exec(value)?.[1] ?? "";
}

export function tokenFromLabelKey(key: string): string {
  return `label:${key.trim()}`;
}

/** A `label:` aggregate with no key is not a valid `/allocation` query. */
export function isQueryableAggregate(aggregate: string): boolean {
  const parts = aggregate.split(",").map((part) => part.trim());
  if (parts.length === 0 || parts.some((part) => part.length === 0)) return false;
  return parts.every((part) => !isK8sLabelToken(part) || labelKeyFromToken(part).length > 0);
}

export function aggregateDisplayName(value: string, presetName?: string): string {
  if (presetName) return presetName;
  if (isK8sLabelToken(value)) {
    const key = labelKeyFromToken(value);
    return key ? `${key} label` : "kubernetes label";
  }
  return value;
}

const MAP_FIELD = /^(label|annotation|namespaceLabel|nodeLabel):(.*)$/;

/**
 * Allocation filters for map fields use `label[key]:"value"`.
 * Other properties stay `property:"value"`.
 */
export function toFilterClause(property: string, rawValue: string): string | null {
  if (String(rawValue).trim().length === 0) return null;
  const escaped = String(rawValue).replace(/"/g, '\\"');
  const mapField = MAP_FIELD.exec(property);
  if (mapField) {
    const key = mapField[2].trim();
    if (!key) return null;
    return `${mapField[1]}[${key}]:"${escaped}"`;
  }
  return `${property}:"${escaped}"`;
}

export function parseFilterPart(
  part: string,
): { property: string; value: string } | null {
  const mapField = part.match(
    /^(label|annotation|namespaceLabel|nodeLabel)\[([^\]]+)\]:"((?:[^"\\]|\\.)*)"$/,
  );
  if (mapField) {
    return {
      property: `${mapField[1]}:${mapField[2]}`,
      value: mapField[3].replace(/\\"/g, '"'),
    };
  }
  const plain = part.match(/^([^:]+):"((?:[^"\\]|\\.)*)"$/);
  if (!plain) return null;
  return {
    property: plain[1].trim(),
    value: plain[2].replace(/\\"/g, '"'),
  };
}

export function withLabelFilter(
  filters: { property: string; value: string }[] | undefined,
  key: string | undefined,
  value: string | undefined,
): { property: string; value: string }[] | undefined {
  const labelKey = key?.trim() ?? "";
  const labelValue = value?.trim() ?? "";
  const base = filters ?? [];
  if (!labelKey || !labelValue) return base.length > 0 ? base : undefined;
  return [...base, { property: `label:${labelKey}`, value: labelValue }];
}
