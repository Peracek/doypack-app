'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Spinner, Accordion, AccordionItem, Chip } from '@heroui/react';
import type { Order, Attempt } from '@/types';
import { getPackageSizeLabel } from '@/types';
import AttemptForm from '@/components/AttemptForm';
import { getOrder, getAttempts, deleteAttempt } from '@/actions/orders';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchOrderData = async () => {
    try {
      const [orderData, attemptsData] = await Promise.all([
        getOrder(orderId),
        getAttempts(orderId),
      ]);

      setOrder(orderData);
      setAttempts(attemptsData);
    } catch (error) {
      console.error('Error fetching order data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const handleAttemptCreated = () => {
    fetchOrderData();
  };

  const handleDeleteAttempt = async (attemptId: number) => {
    if (!confirm('Opravdu chcete smazat tento pokus?')) {
      return;
    }

    setDeletingId(attemptId);
    startTransition(async () => {
      const result = await deleteAttempt(attemptId, orderId);

      if (result.success) {
        fetchOrderData();
      }
      setDeletingId(null);
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card>
          <CardBody className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-xl font-semibold mb-4">Zakázka nebyla nalezena</p>
            <Button
              color="primary"
              onPress={() => router.push('/')}
              size="lg"
              className="h-12"
            >
              🏠 Zpět na hlavní stránku
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.push('/')}
              size="lg"
              className="min-w-12 h-12"
            >
              ←
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                📦 {order.order_code}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {attempts.length} {attempts.length === 1 ? 'pokus' : 'pokusů'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Order Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-bold">📋 Detaily zakázky</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Materiál</p>
                <p className="font-medium text-sm">{order.material_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Pokrytí tiskem</p>
                <p className="font-medium text-sm">{order.print_coverage}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Velikost doypacku</p>
                <p className="font-medium text-sm">{getPackageSizeLabel(order.package_size)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sáčkovačka</p>
                <p className="font-medium text-sm">{order.sackovacka || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Vytvořeno</p>
                <p className="font-medium text-sm">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
            {order.note && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-semibold mb-1">📝 Poznámka k zakázce:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{order.note}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Attempts History */}
        {attempts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-lg font-bold">📊 Historie pokusů ({attempts.length})</h2>
            </CardHeader>
            <CardBody className="pt-2">
              <Accordion variant="splitted" className="px-0">
                {attempts.map((attempt, index) => {
                  const hasMultiphase = attempt.zipper_temperature_c !== null;

                  return (
                    <AccordionItem
                      key={attempt.id}
                      title={
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-2">
                            <Chip
                              color={attempt.outcome === 'Úspěch' ? 'success' : 'danger'}
                              variant="flat"
                              size="sm"
                            >
                              {attempt.outcome === 'Úspěch' ? '✅' : '❌'} {attempt.outcome}
                            </Chip>
                            <span className="font-semibold text-base">
                              Pokus {index + 1}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {formatDateTime(attempt.created_at)}
                          </span>
                        </div>
                      }
                      classNames={{
                        trigger: 'py-4',
                      }}
                    >
                      <div className="space-y-4 p-4">
                        {hasMultiphase ? (
                          <>
                            <h3 className="font-semibold text-sm">🔧 Parametry všech fází svařování:</h3>

                            {/* Zipper Phase */}
                            <div className="border-l-4 border-blue-500 pl-3">
                              <p className="font-semibold mb-2 text-sm">🔗 Svár zip</p>
                              {attempt.zipper_temperature_c ? (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Teplota</p>
                                    <p className="font-medium text-sm">🌡️ {attempt.zipper_temperature_c}°C</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Tlak</p>
                                    <p className="font-medium text-sm">⚡ {attempt.zipper_pressure_bar} bar</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Doba</p>
                                    <p className="font-medium text-sm">⏱️ {attempt.zipper_dwell_time_s}s</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic text-sm">Nezadáno</p>
                              )}
                            </div>

                            {/* Bottom Phase */}
                            <div className="border-l-4 border-green-500 pl-3">
                              <p className="font-semibold mb-2 text-sm">⬇️ Svár dno</p>
                              {attempt.bottom_temperature_c ? (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">Teplota</p>
                                    <p className="font-medium text-sm">🌡️ {attempt.bottom_temperature_c}°C</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Tlak</p>
                                    <p className="font-medium text-sm">⚡ {attempt.bottom_pressure_bar} bar</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Doba</p>
                                    <p className="font-medium text-sm">⏱️ {attempt.bottom_dwell_time_s}s</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic text-sm">Nezadáno</p>
                              )}
                            </div>

                            {/* Side Phases */}
                            {['E', 'D', 'C', 'B', 'A'].map((tower) => {
                              const key = tower.toLowerCase();
                              const temp = attempt[`side_${key}_temperature_c` as keyof Attempt];
                              const pressure = attempt[`side_${key}_pressure_bar` as keyof Attempt];
                              const dwell = attempt[`side_${key}_dwell_time_s` as keyof Attempt];

                              return (
                                <div key={tower} className="border-l-4 border-purple-500 pl-3">
                                  <p className="font-semibold mb-2 text-sm">🔷 Věž {tower}</p>
                                  {temp ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <p className="text-xs text-gray-500">Teplota</p>
                                        <p className="font-medium text-sm">🌡️ {temp}°C</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Tlak</p>
                                        <p className="font-medium text-sm">⚡ {pressure} bar</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Doba</p>
                                        <p className="font-medium text-sm">⏱️ {dwell}s</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic text-sm">Nezadáno</p>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div>
                            <h3 className="font-semibold mb-2 text-sm">🔧 Původní parametry (jedna fáze):</h3>
                            {attempt.sealing_temperature_c ? (
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <p className="text-xs text-gray-500">Teplota</p>
                                  <p className="font-medium text-sm">🌡️ {attempt.sealing_temperature_c}°C</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Tlak</p>
                                  <p className="font-medium text-sm">⚡ {attempt.sealing_pressure_bar} bar</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Doba</p>
                                  <p className="font-medium text-sm">⏱️ {attempt.dwell_time_s}s</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic text-sm">Žádné parametry</p>
                            )}
                          </div>
                        )}

                        {attempt.note && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-xs font-semibold mb-1">📝 Poznámka:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{attempt.note}</p>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <Button
                            color="danger"
                            variant="light"
                            size="md"
                            onPress={() => handleDeleteAttempt(attempt.id)}
                            isLoading={deletingId === attempt.id}
                            className="h-10"
                          >
                            🗑️ Odstranit
                          </Button>
                        </div>
                      </div>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardBody>
          </Card>
        )}

        {/* New Attempt Form */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg md:text-xl font-bold">
              🔬 Pokus {attempts.length + 1}
            </h2>
          </CardHeader>
          <CardBody className="pt-2">
            <AttemptForm orderId={Number(orderId)} onSuccess={handleAttemptCreated} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
