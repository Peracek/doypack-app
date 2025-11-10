'use client';

import { useState, useTransition, useEffect } from 'react';
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
  Textarea,
  Divider,
} from '@heroui/react';
import {
  MATERIAL_OPTIONS,
  PACKAGE_SIZE_OPTIONS,
  SACKOVACKA_OPTIONS,
  type UpdateOrderInput,
  type Order,
} from '@/types';
import ParameterInput from './ParameterInput';
import { updateOrder } from '@/actions/orders';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: Order;
}

export default function EditOrderModal({ isOpen, onClose, onSuccess, order }: EditOrderModalProps) {
  const [orderCode, setOrderCode] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [printCoverage, setPrintCoverage] = useState(50);
  const [packageSize, setPackageSize] = useState('3');
  const [sackovacka, setSackovacka] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Initialize form with order data when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setOrderCode(order.order_code);
      setMaterialType(order.material_type);
      setPrintCoverage(order.print_coverage);
      setPackageSize(String(order.package_size));
      setSackovacka(order.sackovacka || '');
      setNote(order.note || '');
      setError('');
    }
  }, [isOpen, order]);

  const handleSubmit = async () => {
    if (!orderCode.trim() || !materialType || !sackovacka) {
      setError('Vyplňte všechna povinná pole');
      return;
    }

    setError('');

    startTransition(async () => {
      const orderData: UpdateOrderInput = {
        order_code: orderCode.trim(),
        material_type: materialType,
        print_coverage: printCoverage,
        package_size: Number(packageSize),
        sackovacka,
        note: note.trim() || undefined,
      };

      const result = await updateOrder(order.id, orderData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Nepodařilo se upravit zakázku');
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      classNames={{
        base: 'md:max-w-2xl m-0 md:m-auto',
        wrapper: 'items-end md:items-center',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-2xl font-bold">Upravit zakázku</h2>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            className="md:hidden"
            size="lg"
          >
            ✕
          </Button>
        </ModalHeader>
        <ModalBody className="px-6 py-6">
          <div className="space-y-6">
            {/* Order Code */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Identifikace zakázky</h3>
              <Input
                label="Kód zakázky"
                placeholder="např. 2500001"
                value={orderCode}
                onValueChange={setOrderCode}
                isRequired
                variant="bordered"
                size="lg"
              />
            </div>

            <Divider className="my-4" />

            <div>
              <h3 className="text-lg font-semibold mb-4">Parametry materiálu a tisku</h3>
              <div className="space-y-4">
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
                  size="lg"
                  classNames={{
                    trigger: 'h-14',
                    value: 'text-base',
                  }}
                >
                  {MATERIAL_OPTIONS.map((material) => (
                    <SelectItem key={material}>
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
                  size="lg"
                  classNames={{
                    trigger: 'h-14',
                    value: 'text-base',
                  }}
                >
                  {PACKAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={String(option.value)}>
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
                  size="lg"
                  classNames={{
                    trigger: 'h-14',
                    value: 'text-base',
                  }}
                >
                  {SACKOVACKA_OPTIONS.map((option) => (
                    <SelectItem key={option}>
                      {option}
                    </SelectItem>
                  ))}
                </Select>

                {/* Print Coverage */}
                <div className="mt-6">
                  <ParameterInput
                    label="Pokrytí tiskem v oblasti svařování"
                    value={printCoverage}
                    onChange={setPrintCoverage}
                    min={0}
                    max={500}
                    step={10}
                    unit="%"
                    icon="🎨"
                  />
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            {/* Note */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Poznámka</h3>
              <Textarea
                label="Poznámka k zakázce (nepovinné)"
                placeholder="Zadejte jakékoliv poznámky k této zakázce..."
                value={note}
                onValueChange={setNote}
                variant="bordered"
                minRows={3}
                classNames={{
                  input: 'text-base',
                }}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-t px-6 py-4">
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            size="lg"
            className="flex-1 md:flex-none h-12"
          >
            Zrušit
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isPending}
            isDisabled={!orderCode || !materialType || !sackovacka}
            size="lg"
            className="flex-1 md:flex-none h-12 font-semibold"
          >
            {isPending ? 'Ukládání...' : 'Uložit změny'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
