import { Select, SelectItem, TextInput } from "@carbon/react";
import {
  K8S_LABEL_OPTION,
  isK8sLabelToken,
  labelKeyFromToken,
  tokenFromLabelKey,
} from "~/lib/k8s-label";

export interface AllocationPropertyOption {
  label: string;
  value: string;
}

interface AllocationPropertySelectProps {
  id?: string;
  labelText?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: AllocationPropertyOption[];
  /** Allocation queries can group and filter by any pod label. */
  allowLabel?: boolean;
  variant?: "carbon" | "native";
  selectClassName?: string;
}

export default function AllocationPropertySelect({
  id,
  labelText,
  ariaLabel,
  value,
  onChange,
  options,
  allowLabel = false,
  variant = "native",
  selectClassName,
}: AllocationPropertySelectProps) {
  const labelMode = allowLabel && isK8sLabelToken(value);
  const selectValue = labelMode ? K8S_LABEL_OPTION : value;
  const labelKey = labelMode ? labelKeyFromToken(value) : "";

  const handleSelect = (next: string) => {
    if (next === K8S_LABEL_OPTION) {
      onChange(tokenFromLabelKey(""));
      return;
    }
    onChange(next);
  };

  const keyInput =
    labelMode && variant === "carbon" ? (
      <TextInput
        id={`${id ?? "allocation-property"}-label-key`}
        labelText="Label key"
        size="sm"
        value={labelKey}
        placeholder="solution"
        onChange={(event) => onChange(tokenFromLabelKey(event.target.value))}
      />
    ) : labelMode ? (
      <input
        aria-label={ariaLabel ? `${ariaLabel} label key` : "Label key"}
        value={labelKey}
        placeholder="Label key, e.g. solution"
        onChange={(event) => onChange(tokenFromLabelKey(event.target.value))}
        className="h-9 w-full rounded border border-[var(--cds-border-subtle)] bg-[var(--cds-field)] px-2 text-[13px] text-[var(--cds-text-primary)]"
      />
    ) : null;

  if (variant === "carbon") {
    return (
      <div className="flex flex-col gap-2">
        <Select
          id={id ?? "allocation-property"}
          labelText={labelText ?? "Aggregate by"}
          value={selectValue}
          size="sm"
          onChange={(event) => handleSelect(event.target.value)}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} text={option.label} />
          ))}
          {allowLabel ? (
            <SelectItem value={K8S_LABEL_OPTION} text="Kubernetes label" />
          ) : null}
        </Select>
        {keyInput}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <select
        id={id}
        aria-label={ariaLabel}
        value={selectValue}
        onChange={(event) => handleSelect(event.target.value)}
        className={selectClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {allowLabel ? <option value={K8S_LABEL_OPTION}>Kubernetes label</option> : null}
      </select>
      {keyInput}
    </div>
  );
}
