"use client";

import { useState, useTransition } from "react";
import {
  Button,
  RadioGroup,
  Radio,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";
import type { CreateAttemptInput } from "@/types";
import ParameterInput from "./ParameterInput";
import { createAttempt } from "@/actions/orders";

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
  const [sideESetup, setSideESetup] = useState<'iron-iron' | 'iron-silicon' | 'silicon-iron'>('iron-iron');
  const [sideETempUpper, setSideETempUpper] = useState(155);
  const [sideETempLower, setSideETempLower] = useState(155);
  const [sideEPressure, setSideEPressure] = useState(4.2);
  const [sideEDwell, setSideEDwell] = useState(1.1);

  const [sideDSetup, setSideDSetup] = useState<'iron-iron' | 'iron-silicon' | 'silicon-iron'>('iron-iron');
  const [sideDTempUpper, setSideDTempUpper] = useState(158);
  const [sideDTempLower, setSideDTempLower] = useState(158);
  const [sideDPressure, setSideDPressure] = useState(4.3);
  const [sideDDwell, setSideDDwell] = useState(1.15);

  const [sideCSetup, setSideCSetup] = useState<'iron-iron' | 'iron-silicon' | 'silicon-iron'>('iron-iron');
  const [sideCTempUpper, setSideCTempUpper] = useState(162);
  const [sideCTempLower, setSideCTempLower] = useState(162);
  const [sideCPressure, setSideCPressure] = useState(4.4);
  const [sideCDwell, setSideCDwell] = useState(1.2);

  const [sideBSetup, setSideBSetup] = useState<'iron-iron' | 'iron-silicon' | 'silicon-iron'>('iron-iron');
  const [sideBTempUpper, setSideBTempUpper] = useState(165);
  const [sideBTempLower, setSideBTempLower] = useState(165);
  const [sideBPressure, setSideBPressure] = useState(4.5);
  const [sideBDwell, setSideBDwell] = useState(1.25);

  const [sideASetup, setSideASetup] = useState<'iron-iron' | 'iron-silicon' | 'silicon-iron'>('iron-iron');
  const [sideATempUpper, setSideATempUpper] = useState(168);
  const [sideATempLower, setSideATempLower] = useState(168);
  const [sideAPressure, setSideAPressure] = useState(4.6);
  const [sideADwell, setSideADwell] = useState(1.3);

  const [outcome, setOutcome] = useState<"Úspěch" | "Neúspěch">("Neúspěch");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCopyFromE = () => {
    // Copy values from Side E to all other side phases
    setSideDTempUpper(sideETempUpper);
    setSideDTempLower(sideETempLower);
    setSideDPressure(sideEPressure);
    setSideDDwell(sideEDwell);

    setSideCTempUpper(sideETempUpper);
    setSideCTempLower(sideETempLower);
    setSideCPressure(sideEPressure);
    setSideCDwell(sideEDwell);

    setSideBTempUpper(sideETempUpper);
    setSideBTempLower(sideETempLower);
    setSideBPressure(sideEPressure);
    setSideBDwell(sideEDwell);

    setSideATempUpper(sideETempUpper);
    setSideATempLower(sideETempLower);
    setSideAPressure(sideEPressure);
    setSideADwell(sideEDwell);
  };

  const handleSubmit = async () => {
    setError("");

    startTransition(async () => {
      const attemptData: CreateAttemptInput = {
        order_id: orderId,
        outcome,
        zipper_temperature_c: zipperTemp,
        zipper_pressure_bar: zipperPressure,
        zipper_dwell_time_s: zipperDwell,
        bottom_temperature_c: bottomTemp,
        bottom_pressure_bar: bottomPressure,
        bottom_dwell_time_s: bottomDwell,
        side_e_setup: sideESetup,
        side_e_temperature_upper_c: sideETempUpper,
        side_e_temperature_lower_c: sideETempLower,
        side_e_pressure_bar: sideEPressure,
        side_e_dwell_time_s: sideEDwell,
        side_d_setup: sideDSetup,
        side_d_temperature_upper_c: sideDTempUpper,
        side_d_temperature_lower_c: sideDTempLower,
        side_d_pressure_bar: sideDPressure,
        side_d_dwell_time_s: sideDDwell,
        side_c_setup: sideCSetup,
        side_c_temperature_upper_c: sideCTempUpper,
        side_c_temperature_lower_c: sideCTempLower,
        side_c_pressure_bar: sideCPressure,
        side_c_dwell_time_s: sideCDwell,
        side_b_setup: sideBSetup,
        side_b_temperature_upper_c: sideBTempUpper,
        side_b_temperature_lower_c: sideBTempLower,
        side_b_pressure_bar: sideBPressure,
        side_b_dwell_time_s: sideBDwell,
        side_a_setup: sideASetup,
        side_a_temperature_upper_c: sideATempUpper,
        side_a_temperature_lower_c: sideATempLower,
        side_a_pressure_bar: sideAPressure,
        side_a_dwell_time_s: sideADwell,
        note: note.trim() || undefined,
      };

      const result = await createAttempt(orderId, attemptData);

      if (result.success) {
        // Reset form to defaults
        setOutcome("Neúspěch");
        setNote("");
        onSuccess();
      } else {
        setError(result.error || "Nepodařilo se uložit pokus");
      }
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Parameter Sections */}
      <div className="space-y-4">
        {/* Zipper Phase */}
        <Card className="border-2 border-blue-500 dark:border-blue-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Svár zip
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <ParameterInput
              label="Teplota"
              value={zipperTemp}
              onChange={setZipperTemp}
              min={100}
              max={220}
              step={1}
              unit="°C"
              icon="🌡️"
            />
            <ParameterInput
              label="Tlak"
              value={zipperPressure}
              onChange={setZipperPressure}
              min={1.0}
              max={8.0}
              step={0.1}
              unit="bar"
              icon="⚡"
            />
            <ParameterInput
              label="Doba"
              value={zipperDwell}
              onChange={setZipperDwell}
              min={0.1}
              max={3.0}
              step={0.01}
              unit="s"
              icon="⏱️"
            />
          </CardBody>
        </Card>

        {/* Bottom Phase */}
        <Card className="border-2 border-green-500 dark:border-green-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⬇️</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                Svár dno
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <ParameterInput
              label="Teplota"
              value={bottomTemp}
              onChange={setBottomTemp}
              min={100}
              max={220}
              step={1}
              unit="°C"
              icon="🌡️"
            />
            <ParameterInput
              label="Tlak"
              value={bottomPressure}
              onChange={setBottomPressure}
              min={1.0}
              max={8.0}
              step={0.1}
              unit="bar"
              icon="⚡"
            />
            <ParameterInput
              label="Doba"
              value={bottomDwell}
              onChange={setBottomDwell}
              min={0.1}
              max={3.0}
              step={0.01}
              unit="s"
              icon="⏱️"
            />
          </CardBody>
        </Card>

        {/* Side Phases */}
        <Card className="border-2 border-purple-500 dark:border-purple-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔷</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Příčné sváry (Věže)
              </span>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Copy Button */}
            <Button
              color="secondary"
              variant="flat"
              onPress={handleCopyFromE}
              className="w-full h-12 text-base font-semibold"
              startContent={<span className="text-lg">🔗</span>}
            >
              Kopírovat z Věže E do D, C, B, A
            </Button>

            {/* Tower E */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span>🔷</span> Věž E
              </h5>
              <div>
                <label className="text-sm font-medium mb-2 block">Sestavení (horní-dolní)</label>
                <RadioGroup
                  value={sideESetup}
                  onValueChange={(value) => setSideESetup(value as 'iron-iron' | 'iron-silicon' | 'silicon-iron')}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2",
                  }}
                >
                  <Radio value="iron-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Železo</span>
                  </Radio>
                  <Radio value="iron-silicon" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Silikon</span>
                  </Radio>
                  <Radio value="silicon-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Silikon-Železo</span>
                  </Radio>
                </RadioGroup>
              </div>
              <ParameterInput
                label="Teplota (horní)"
                value={sideETempUpper}
                onChange={(value) => {
                  setSideETempUpper(value);
                  if (sideESetup === 'iron-iron') {
                    setSideETempLower(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Teplota (dolní)"
                value={sideETempLower}
                onChange={(value) => {
                  setSideETempLower(value);
                  if (sideESetup === 'iron-iron') {
                    setSideETempUpper(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Tlak"
                value={sideEPressure}
                onChange={setSideEPressure}
                min={1.0}
                max={8.0}
                step={0.1}
                unit="bar"
                icon="⚡"
              />
              <ParameterInput
                label="Doba"
                value={sideEDwell}
                onChange={setSideEDwell}
                min={0.1}
                max={3.0}
                step={0.01}
                unit="s"
                icon="⏱️"
              />
            </div>

            {/* Tower D */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span>🔶</span> Věž D
              </h5>
              <div>
                <label className="text-sm font-medium mb-2 block">Sestavení (horní-dolní)</label>
                <RadioGroup
                  value={sideDSetup}
                  onValueChange={(value) => setSideDSetup(value as 'iron-iron' | 'iron-silicon' | 'silicon-iron')}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2",
                  }}
                >
                  <Radio value="iron-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Železo</span>
                  </Radio>
                  <Radio value="iron-silicon" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Silikon</span>
                  </Radio>
                  <Radio value="silicon-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Silikon-Železo</span>
                  </Radio>
                </RadioGroup>
              </div>
              <ParameterInput
                label="Teplota (horní)"
                value={sideDTempUpper}
                onChange={(value) => {
                  setSideDTempUpper(value);
                  if (sideDSetup === 'iron-iron') {
                    setSideDTempLower(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Teplota (dolní)"
                value={sideDTempLower}
                onChange={(value) => {
                  setSideDTempLower(value);
                  if (sideDSetup === 'iron-iron') {
                    setSideDTempUpper(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Tlak"
                value={sideDPressure}
                onChange={setSideDPressure}
                min={1.0}
                max={8.0}
                step={0.1}
                unit="bar"
                icon="⚡"
              />
              <ParameterInput
                label="Doba"
                value={sideDDwell}
                onChange={setSideDDwell}
                min={0.1}
                max={3.0}
                step={0.01}
                unit="s"
                icon="⏱️"
              />
            </div>

            {/* Tower C */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span>🔸</span> Věž C
              </h5>
              <div>
                <label className="text-sm font-medium mb-2 block">Sestavení (horní-dolní)</label>
                <RadioGroup
                  value={sideCSetup}
                  onValueChange={(value) => setSideCSetup(value as 'iron-iron' | 'iron-silicon' | 'silicon-iron')}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2",
                  }}
                >
                  <Radio value="iron-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Železo</span>
                  </Radio>
                  <Radio value="iron-silicon" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Silikon</span>
                  </Radio>
                  <Radio value="silicon-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Silikon-Železo</span>
                  </Radio>
                </RadioGroup>
              </div>
              <ParameterInput
                label="Teplota (horní)"
                value={sideCTempUpper}
                onChange={(value) => {
                  setSideCTempUpper(value);
                  if (sideCSetup === 'iron-iron') {
                    setSideCTempLower(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Teplota (dolní)"
                value={sideCTempLower}
                onChange={(value) => {
                  setSideCTempLower(value);
                  if (sideCSetup === 'iron-iron') {
                    setSideCTempUpper(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Tlak"
                value={sideCPressure}
                onChange={setSideCPressure}
                min={1.0}
                max={8.0}
                step={0.1}
                unit="bar"
                icon="⚡"
              />
              <ParameterInput
                label="Doba"
                value={sideCDwell}
                onChange={setSideCDwell}
                min={0.1}
                max={3.0}
                step={0.01}
                unit="s"
                icon="⏱️"
              />
            </div>

            {/* Tower B */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span>🔹</span> Věž B
              </h5>
              <div>
                <label className="text-sm font-medium mb-2 block">Sestavení (horní-dolní)</label>
                <RadioGroup
                  value={sideBSetup}
                  onValueChange={(value) => setSideBSetup(value as 'iron-iron' | 'iron-silicon' | 'silicon-iron')}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2",
                  }}
                >
                  <Radio value="iron-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Železo</span>
                  </Radio>
                  <Radio value="iron-silicon" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Silikon</span>
                  </Radio>
                  <Radio value="silicon-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Silikon-Železo</span>
                  </Radio>
                </RadioGroup>
              </div>
              <ParameterInput
                label="Teplota (horní)"
                value={sideBTempUpper}
                onChange={(value) => {
                  setSideBTempUpper(value);
                  if (sideBSetup === 'iron-iron') {
                    setSideBTempLower(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Teplota (dolní)"
                value={sideBTempLower}
                onChange={(value) => {
                  setSideBTempLower(value);
                  if (sideBSetup === 'iron-iron') {
                    setSideBTempUpper(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Tlak"
                value={sideBPressure}
                onChange={setSideBPressure}
                min={1.0}
                max={8.0}
                step={0.1}
                unit="bar"
                icon="⚡"
              />
              <ParameterInput
                label="Doba"
                value={sideBDwell}
                onChange={setSideBDwell}
                min={0.1}
                max={3.0}
                step={0.01}
                unit="s"
                icon="⏱️"
              />
            </div>

            {/* Tower A */}
            <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <h5 className="font-bold text-lg flex items-center gap-2">
                <span>🔺</span> Věž A
              </h5>
              <div>
                <label className="text-sm font-medium mb-2 block">Sestavení (horní-dolní)</label>
                <RadioGroup
                  value={sideASetup}
                  onValueChange={(value) => setSideASetup(value as 'iron-iron' | 'iron-silicon' | 'silicon-iron')}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-2",
                  }}
                >
                  <Radio value="iron-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Železo</span>
                  </Radio>
                  <Radio value="iron-silicon" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Železo-Silikon</span>
                  </Radio>
                  <Radio value="silicon-iron" classNames={{ base: "flex-1 max-w-none" }}>
                    <span className="text-sm">Silikon-Železo</span>
                  </Radio>
                </RadioGroup>
              </div>
              <ParameterInput
                label="Teplota (horní)"
                value={sideATempUpper}
                onChange={(value) => {
                  setSideATempUpper(value);
                  if (sideASetup === 'iron-iron') {
                    setSideATempLower(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Teplota (dolní)"
                value={sideATempLower}
                onChange={(value) => {
                  setSideATempLower(value);
                  if (sideASetup === 'iron-iron') {
                    setSideATempUpper(value);
                  }
                }}
                min={100}
                max={220}
                step={1}
                unit="°C"
                icon="🌡️"
              />
              <ParameterInput
                label="Tlak"
                value={sideAPressure}
                onChange={setSideAPressure}
                min={1.0}
                max={8.0}
                step={0.1}
                unit="bar"
                icon="⚡"
              />
              <ParameterInput
                label="Doba"
                value={sideADwell}
                onChange={setSideADwell}
                min={0.1}
                max={3.0}
                step={0.01}
                unit="s"
                icon="⏱️"
              />
            </div>
          </CardBody>
        </Card>

        {/* Note */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="font-semibold">Poznámka (nepovinné)</span>
            </div>
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder="Zadejte jakékoliv poznámky k tomuto pokusu..."
              value={note}
              onValueChange={setNote}
              variant="bordered"
              minRows={4}
              classNames={{
                input: "text-base",
              }}
            />
          </CardBody>
        </Card>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-semibold mb-3">🎯 Výsledek pokusu</h4>
          <RadioGroup
            value={outcome}
            onValueChange={(value) =>
              setOutcome(value as "Úspěch" | "Neúspěch")
            }
            orientation="horizontal"
            classNames={{
              wrapper: "gap-4",
            }}
          >
            <Radio value="Neúspěch" classNames={{ base: "flex-1 max-w-none" }}>
              <span className="text-base">❌ Neúspěch</span>
            </Radio>
            <Radio value="Úspěch" classNames={{ base: "flex-1 max-w-none" }}>
              <span className="text-base">✅ Úspěch</span>
            </Radio>
          </RadioGroup>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-800 dark:text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
        <Button
          color="primary"
          size="lg"
          onPress={handleSubmit}
          isLoading={isPending}
          className="w-full h-14 text-lg font-bold"
        >
          {isPending ? "Ukládání..." : "Uložit pokus"}
        </Button>
      </div>
    </div>
  );
}
