import { useEffect, useState } from "react";
import { Select, SelectItem } from "@carbon/react";
import { fetchReportFilterAutocomplete } from "~/services/report-filter-autocomplete";

const OPTION_LIMIT = 1000;

const optionCache = new Map<string, string[]>();
const pendingCache = new Map<string, Promise<string[]>>();

function loadAllocationFieldOptions(window: string, field: string): Promise<string[]> {
  const cacheKey = `${window}\n${field}`;
  const cached = optionCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = pendingCache.get(cacheKey);
  if (pending) return pending;

  const request = fetchReportFilterAutocomplete({
    layer: "allocation",
    window,
    field,
    limit: OPTION_LIMIT,
  })
    .then((values) => {
      optionCache.set(cacheKey, values);
      pendingCache.delete(cacheKey);
      return values;
    })
    .catch((error: unknown) => {
      pendingCache.delete(cacheKey);
      throw error;
    });
  pendingCache.set(cacheKey, request);
  return request;
}

function useAllocationFieldOptions(window: string | undefined, field: string | null) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window || !field) {
      setOptions([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void loadAllocationFieldOptions(window, field)
      .then((values) => {
        if (!active) return;
        setOptions(values);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setOptions([]);
        setLoading(false);
        setError(err instanceof Error ? err.message : "Unable to load labels.");
      });

    return () => {
      active = false;
    };
  }, [window, field]);

  return { options, loading, error };
}

function optionsIncludingCurrent(options: string[], current: string): string[] {
  const trimmed = current.trim();
  if (!trimmed || options.includes(trimmed)) return options;
  return [trimmed, ...options];
}

interface LabelChoiceSelectProps {
  id?: string;
  labelText?: string;
  ariaLabel?: string;
  window: string;
  field: string | null;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  emptyText: string;
  variant?: "carbon" | "native";
  selectClassName?: string;
  disabled?: boolean;
}

function LabelChoiceSelect({
  id,
  labelText,
  ariaLabel,
  window,
  field,
  value,
  onChange,
  placeholder,
  emptyText,
  variant = "native",
  selectClassName,
  disabled = false,
}: LabelChoiceSelectProps) {
  const { options, loading, error } = useAllocationFieldOptions(disabled ? undefined : window, field);
  const choices = optionsIncludingCurrent(options, value);
  const prompt = disabled
    ? placeholder
    : loading
      ? "Loading labels…"
      : choices.length === 0
        ? emptyText
        : placeholder;

  const hint = error ? (
    <p className="m-0 text-xs text-[#da1e28]">{error}</p>
  ) : null;

  if (variant === "carbon") {
    return (
      <div className="flex flex-col gap-1">
        <Select
          id={id ?? "k8s-label-choice"}
          labelText={labelText ?? placeholder}
          value={value}
          size="sm"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          <SelectItem value="" text={prompt} />
          {choices.map((option) => (
            <SelectItem key={option} value={option} text={option} />
          ))}
        </Select>
        {hint}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <select
        id={id}
        aria-label={ariaLabel ?? labelText ?? placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={
          selectClassName ??
          "h-9 w-full rounded border border-[var(--cds-border-subtle)] bg-[var(--cds-field)] px-2 text-[13px] text-[var(--cds-text-primary)]"
        }
      >
        <option value="">{prompt}</option>
        {choices.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {hint}
    </div>
  );
}

interface K8sLabelKeySelectProps {
  id?: string;
  labelText?: string;
  ariaLabel?: string;
  window: string;
  value: string;
  onChange: (key: string) => void;
  variant?: "carbon" | "native";
  selectClassName?: string;
}

export function K8sLabelKeySelect(props: K8sLabelKeySelectProps) {
  return (
    <LabelChoiceSelect
      {...props}
      field="label"
      placeholder="Choose a label"
      emptyText="No labels in this window"
    />
  );
}

interface K8sLabelValueSelectProps {
  id?: string;
  labelText?: string;
  ariaLabel?: string;
  window: string;
  labelKey: string;
  value: string;
  onChange: (value: string) => void;
  variant?: "carbon" | "native";
  selectClassName?: string;
}

export function K8sLabelValueSelect({
  labelKey,
  ...props
}: K8sLabelValueSelectProps) {
  const key = labelKey.trim();
  return (
    <LabelChoiceSelect
      {...props}
      field={key ? `label:${key}` : null}
      disabled={!key}
      placeholder={key ? "Choose a value" : "Choose a label first"}
      emptyText="No values for this label"
    />
  );
}
