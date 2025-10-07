'use client';

import { useState } from 'react';
import { Button, Slider, RadioGroup, Radio, Textarea, Divider } from '@heroui/react';
import type { CreateAttemptInput } from '@/types';

interface AttemptFormProps {
  orderId: number;
  onSuccess: () => void;
}

export default function AttemptForm({ orderId, onSuccess }: AttemptFormProps) {
  // Zipper phase
  const [zipperTemp, setZipperTemp] = useState(150);
  const [zipperPressure, setZipperPressure] = useState(4.0);
  const [zipperDwell, setZipperDwell] = useState(1.0);

  // Bottom phase
  const [bottomTemp, setBottomTemp] = useState(160);
  const [bottomPressure, setBottomPressure] = useState(4.5);
  const [bottomDwell, setBottomDwell] = useState(1.2);

  // Side phases
  const [sideETemp, setSideETemp] = useState(155);
  const [sideEPressure, setSideEPressure] = useState(4.2);
  const [sideEDwell, setSideEDwell] = useState(1.1);

  const [sideDTemp, setSideDTemp] = useState(158);
  const [sideDPressure, setSideDPressure] = useState(4.3);
  const [sideDDwell, setSideDDwell] = useState(1.15);

  const [sideCTemp, setSideCTemp] = useState(162);
  const [sideCPressure, setSideCPressure] = useState(4.4);
  const [sideCDwell, setSideCDwell] = useState(1.2);

  const [sideBTemp, setSideBTemp] = useState(165);
  const [sideBPressure, setSideBPressure] = useState(4.5);
  const [sideBDwell, setSideBDwell] = useState(1.25);

  const [sideATemp, setSideATemp] = useState(168);
  const [sideAPressure, setSideAPressure] = useState(4.6);
  const [sideADwell, setSideADwell] = useState(1.3);

  const [outcome, setOutcome] = useState<'Úspěch' | 'Neúspěch'>('Neúspěch');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCopyFromE = () => {
    // Copy values from Side E to all other side phases
    setSideDTemp(sideETemp);
    setSideDPressure(sideEPressure);
    setSideDDwell(sideEDwell);

    setSideCTemp(sideETemp);
    setSideCPressure(sideEPressure);
    setSideCDwell(sideEDwell);

    setSideBTemp(sideETemp);
    setSideBPressure(sideEPressure);
    setSideBDwell(sideEDwell);

    setSideATemp(sideETemp);
    setSideAPressure(sideEPressure);
    setSideADwell(sideEDwell);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const attemptData: CreateAttemptInput = {
        order_id: orderId,
        outcome,
        zipper_temperature_c: zipperTemp,
        zipper_pressure_bar: zipperPressure,
        zipper_dwell_time_s: zipperDwell,
        bottom_temperature_c: bottomTemp,
        bottom_pressure_bar: bottomPressure,
        bottom_dwell_time_s: bottomDwell,
        side_e_temperature_c: sideETemp,
        side_e_pressure_bar: sideEPressure,
        side_e_dwell_time_s: sideEDwell,
        side_d_temperature_c: sideDTemp,
        side_d_pressure_bar: sideDPressure,
        side_d_dwell_time_s: sideDDwell,
        side_c_temperature_c: sideCTemp,
        side_c_pressure_bar: sideCPressure,
        side_c_dwell_time_s: sideCDwell,
        side_b_temperature_c: sideBTemp,
        side_b_pressure_bar: sideBPressure,
        side_b_dwell_time_s: sideBDwell,
        side_a_temperature_c: sideATemp,
        side_a_pressure_bar: sideAPressure,
        side_a_dwell_time_s: sideADwell,
        note: note.trim() || undefined,
      };

      const response = await fetch(`/api/orders/${orderId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attemptData),
      });

      if (response.ok) {
        // Reset form to defaults
        setOutcome('Neúspěch');
        setNote('');
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Nepodařilo se uložit pokus');
      }
    } catch (err) {
      setError('Chyba při komunikaci se serverem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">📋 Parametry svařování</h3>

      {/* Zipper Sealing Phase */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-blue-600 dark:text-blue-400">🔗 Svár zip</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Slider
            label="Teplota (°C)"
            value={zipperTemp}
            onChange={(value) => setZipperTemp(value as number)}
            minValue={100}
            maxValue={220}
            step={1}
            showTooltip
            className="max-w-full"
          />
          <Slider
            label="Tlak (bar)"
            value={zipperPressure}
            onChange={(value) => setZipperPressure(value as number)}
            minValue={1.0}
            maxValue={8.0}
            step={0.1}
            showTooltip
            className="max-w-full"
          />
          <Slider
            label="Doba (s)"
            value={zipperDwell}
            onChange={(value) => setZipperDwell(value as number)}
            minValue={0.1}
            maxValue={3.0}
            step={0.1}
            showTooltip
            className="max-w-full"
          />
        </div>
      </div>

      <Divider />

      {/* Bottom Sealing Phase */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-green-600 dark:text-green-400">⬇️ Svár dno</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Slider
            label="Teplota (°C)"
            value={bottomTemp}
            onChange={(value) => setBottomTemp(value as number)}
            minValue={100}
            maxValue={220}
            step={1}
            showTooltip
            className="max-w-full"
          />
          <Slider
            label="Tlak (bar)"
            value={bottomPressure}
            onChange={(value) => setBottomPressure(value as number)}
            minValue={1.0}
            maxValue={8.0}
            step={0.1}
            showTooltip
            className="max-w-full"
          />
          <Slider
            label="Doba (s)"
            value={bottomDwell}
            onChange={(value) => setBottomDwell(value as number)}
            minValue={0.1}
            maxValue={3.0}
            step={0.1}
            showTooltip
            className="max-w-full"
          />
        </div>
      </div>

      <Divider />

      {/* Side Sealing Phases */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-md font-semibold text-purple-600 dark:text-purple-400">
            Příčné sváry
          </h4>
        </div>

        {/* Side E */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <div className="flex justify-between items-center">
            <h5 className="font-semibold">🔷 Věž E</h5>
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onPress={handleCopyFromE}
            >
              🔗 Kopírovat do D,C,B,A
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Slider
              label="Teplota (°C)"
              value={sideETemp}
              onChange={(value) => setSideETemp(value as number)}
              minValue={100}
              maxValue={220}
              step={1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Tlak (bar)"
              value={sideEPressure}
              onChange={(value) => setSideEPressure(value as number)}
              minValue={1.0}
              maxValue={8.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Doba (s)"
              value={sideEDwell}
              onChange={(value) => setSideEDwell(value as number)}
              minValue={0.1}
              maxValue={3.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
          </div>
        </div>

        {/* Side D */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <h5 className="font-semibold">🔶 Věž D</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Slider
              label="Teplota (°C)"
              value={sideDTemp}
              onChange={(value) => setSideDTemp(value as number)}
              minValue={100}
              maxValue={220}
              step={1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Tlak (bar)"
              value={sideDPressure}
              onChange={(value) => setSideDPressure(value as number)}
              minValue={1.0}
              maxValue={8.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Doba (s)"
              value={sideDDwell}
              onChange={(value) => setSideDDwell(value as number)}
              minValue={0.1}
              maxValue={3.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
          </div>
        </div>

        {/* Side C */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <h5 className="font-semibold">🔸 Věž C</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Slider
              label="Teplota (°C)"
              value={sideCTemp}
              onChange={(value) => setSideCTemp(value as number)}
              minValue={100}
              maxValue={220}
              step={1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Tlak (bar)"
              value={sideCPressure}
              onChange={(value) => setSideCPressure(value as number)}
              minValue={1.0}
              maxValue={8.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Doba (s)"
              value={sideCDwell}
              onChange={(value) => setSideCDwell(value as number)}
              minValue={0.1}
              maxValue={3.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
          </div>
        </div>

        {/* Side B */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <h5 className="font-semibold">🔹 Věž B</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Slider
              label="Teplota (°C)"
              value={sideBTemp}
              onChange={(value) => setSideBTemp(value as number)}
              minValue={100}
              maxValue={220}
              step={1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Tlak (bar)"
              value={sideBPressure}
              onChange={(value) => setSideBPressure(value as number)}
              minValue={1.0}
              maxValue={8.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Doba (s)"
              value={sideBDwell}
              onChange={(value) => setSideBDwell(value as number)}
              minValue={0.1}
              maxValue={3.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
          </div>
        </div>

        {/* Side A */}
        <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <h5 className="font-semibold">🔺 Věž A</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Slider
              label="Teplota (°C)"
              value={sideATemp}
              onChange={(value) => setSideATemp(value as number)}
              minValue={100}
              maxValue={220}
              step={1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Tlak (bar)"
              value={sideAPressure}
              onChange={(value) => setSideAPressure(value as number)}
              minValue={1.0}
              maxValue={8.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
            <Slider
              label="Doba (s)"
              value={sideADwell}
              onChange={(value) => setSideADwell(value as number)}
              minValue={0.1}
              maxValue={3.0}
              step={0.1}
              showTooltip
              className="max-w-full"
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Note */}
      <div className="space-y-2">
        <h4 className="text-md font-semibold">📝 Poznámka</h4>
        <Textarea
          placeholder="Zadejte jakékoliv poznámky k tomuto pokusu..."
          value={note}
          onValueChange={setNote}
          variant="bordered"
          minRows={3}
        />
      </div>

      {/* Outcome */}
      <div className="space-y-2">
        <h4 className="text-md font-semibold">🎯 Výsledek pokusu</h4>
        <RadioGroup
          value={outcome}
          onValueChange={(value) => setOutcome(value as 'Úspěch' | 'Neúspěch')}
          orientation="horizontal"
        >
          <Radio value="Neúspěch">Neúspěch</Radio>
          <Radio value="Úspěch">Úspěch</Radio>
        </RadioGroup>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          color="primary"
          size="lg"
          onPress={handleSubmit}
          isLoading={loading}
          className="font-semibold"
        >
          Uložit pokus
        </Button>
      </div>
    </div>
  );
}
