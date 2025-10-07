'use client';

import { Slider } from '@heroui/react';

interface ParameterInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  icon?: string;
}

export default function ParameterInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  icon = '',
}: ParameterInputProps) {
  return (
    <Slider
      label={
        <span className="text-sm font-medium flex items-center gap-1">
          {icon && <span>{icon}</span>}
          {label}
        </span>
      }
      value={value}
      onChange={(val) => onChange(typeof val === 'number' ? val : val[0])}
      minValue={min}
      maxValue={max}
      step={step}
      showTooltip
      showSteps={step >= 1}
      getValue={(val) => `${typeof val === 'number' ? val : val[0]}${unit}`}
      classNames={{
        base: 'max-w-full',
        label: 'text-sm font-medium',
        value: 'text-sm font-semibold',
      }}
    />
  );
}
