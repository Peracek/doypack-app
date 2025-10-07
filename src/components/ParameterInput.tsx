'use client';

import { Button, Input } from '@heroui/react';
import { useState } from 'react';

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
  const [inputValue, setInputValue] = useState(value.toString());

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const numValue = parseFloat(val);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString());
    } else {
      onChange(numValue);
      setInputValue(numValue.toString());
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
        {icon && <span>{icon}</span>}
        {label}
      </label>
      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <Button
          isIconOnly
          size="lg"
          variant="flat"
          onPress={handleDecrement}
          isDisabled={value <= min}
          className="min-w-12 h-12 text-xl font-bold"
        >
          −
        </Button>

        {/* Value Input */}
        <Input
          type="number"
          value={inputValue}
          onValueChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          endContent={unit && <span className="text-sm text-gray-500">{unit}</span>}
          classNames={{
            input: 'text-center text-lg font-semibold',
            inputWrapper: 'h-12',
          }}
          variant="bordered"
        />

        {/* Increment Button */}
        <Button
          isIconOnly
          size="lg"
          variant="flat"
          onPress={handleIncrement}
          isDisabled={value >= max}
          className="min-w-12 h-12 text-xl font-bold"
        >
          +
        </Button>
      </div>

      {/* Range indicator */}
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
