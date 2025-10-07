'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Slider,
  Textarea,
} from '@heroui/react';
import {
  MATERIAL_OPTIONS,
  PACKAGE_SIZE_OPTIONS,
  SACKOVACKA_OPTIONS,
  type CreateOrderInput,
} from '@/types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewOrderModal({ isOpen, onClose, onSuccess }: NewOrderModalProps) {
  const [orderCode, setOrderCode] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [printCoverage, setPrintCoverage] = useState(50);
  const [packageSize, setPackageSize] = useState('3');
  const [sackovacka, setSackovacka] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!orderCode.trim() || !materialType || !sackovacka) {
      setError('Vyplňte všechna povinná pole');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData: CreateOrderInput = {
        order_code: orderCode.trim(),
        material_type: materialType,
        print_coverage: printCoverage,
        package_size: Number(packageSize),
        sackovacka,
        note: note.trim() || undefined,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Reset form
        setOrderCode('');
        setMaterialType('');
        setPrintCoverage(50);
        setPackageSize('3');
        setSackovacka('');
        setNote('');
        onSuccess();
      } else {
        const data = await response.json();
        if (response.status === 409) {
          setError('Zakázka s tímto kódem již existuje');
        } else {
          setError(data.error || 'Nepodařilo se vytvořit zakázku');
        }
      }
    } catch (err) {
      setError('Chyba při komunikaci se serverem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">📋 Nová zakázka</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Order Code */}
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Identifikace zakázky</h3>
              <Input
                label="Kód zakázky"
                placeholder="např. Z2024-001"
                value={orderCode}
                onValueChange={setOrderCode}
                isRequired
                variant="bordered"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">🏭 Parametry materiálu a tisku</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material Type */}
                <Select
                  label="Typ materiálu"
                  placeholder="Vyberte materiál"
                  selectedKeys={materialType ? [materialType] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setMaterialType(selected);
                  }}
                  isRequired
                  variant="bordered"
                >
                  {MATERIAL_OPTIONS.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </Select>

                {/* Package Size */}
                <Select
                  label="Velikost doypacku"
                  selectedKeys={[packageSize]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setPackageSize(selected);
                  }}
                  isRequired
                  variant="bordered"
                >
                  {PACKAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Sackovacka */}
                <Select
                  label="Sáčkovačka"
                  placeholder="Vyberte sáčkovačku"
                  selectedKeys={sackovacka ? [sackovacka] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSackovacka(selected);
                  }}
                  isRequired
                  variant="bordered"
                >
                  {SACKOVACKA_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Print Coverage Slider */}
              <div className="mt-4">
                <Slider
                  label="Pokrytí tiskem v oblasti svařování (%)"
                  value={printCoverage}
                  onChange={(value) => setPrintCoverage(value as number)}
                  minValue={0}
                  maxValue={500}
                  step={10}
                  showSteps={false}
                  showTooltip={true}
                  className="max-w-full"
                />
              </div>
            </div>

            {/* Note */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">📝 Poznámka</h3>
              <Textarea
                label="Poznámka k zakázce (nepovinné)"
                placeholder="Zadejte jakékoliv poznámky k této zakázce..."
                value={note}
                onValueChange={setNote}
                variant="bordered"
                minRows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">❌ {error}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={!orderCode || !materialType || !sackovacka}
          >
            🚀 Vytvořit zakázku
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
