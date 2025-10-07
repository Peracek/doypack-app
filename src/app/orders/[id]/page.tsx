'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Spinner, Accordion, AccordionItem } from '@heroui/react';
import type { Order, Attempt } from '@/types';
import { getPackageSizeLabel } from '@/types';
import AttemptForm from '@/components/AttemptForm';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchOrderData = async () => {
    try {
      const [orderRes, attemptsRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/orders/${orderId}/attempts`),
      ]);

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrder(orderData);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setAttempts(attemptsData);
      }
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
    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchOrderData();
      }
    } catch (error) {
      console.error('Error deleting attempt:', error);
    } finally {
      setDeletingId(null);
    }
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
      <div className="min-h-screen flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Card>
          <CardBody>
            <p className="text-xl">Zakázka nebyla nalezena</p>
            <Button color="primary" onPress={() => router.push('/')} className="mt-4">
              Zpět na hlavní stránku
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="light"
            onPress={() => router.push('/')}
            startContent={<span>🏠</span>}
          >
            Zpět na úvodní stránku
          </Button>
        </div>

        {/* Order Header */}
        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-3xl font-bold">📦 Zakázka: {order.order_code}</h1>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📋 Detaily zakázky:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Materiál</p>
                  <p className="font-medium">{order.material_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pokrytí tiskem v oblasti svařování</p>
                  <p className="font-medium">{order.print_coverage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Velikost doypacku</p>
                  <p className="font-medium">{getPackageSizeLabel(order.package_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sáčkovačka</p>
                  <p className="font-medium">{order.sackovacka || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vytvořeno</p>
                <p className="font-medium">{formatDateTime(order.created_at)}</p>
              </div>
              {order.note && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-semibold mb-1">📝 Poznámka k zakázce:</p>
                  <p className="text-gray-700 dark:text-gray-300">{order.note}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Attempts History */}
        {attempts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-2xl font-bold">📊 Historie pokusů</h2>
            </CardHeader>
            <CardBody>
              <Accordion variant="splitted">
                {attempts.map((attempt, index) => {
                  const outcomeEmoji = attempt.outcome === 'Úspěch' ? '✅' : '❌';
                  const hasMultiphase = attempt.zipper_temperature_c !== null;

                  return (
                    <AccordionItem
                      key={attempt.id}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{outcomeEmoji}</span>
                          <span className="font-semibold">
                            Pokus {index + 1} - {attempt.outcome}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({formatDateTime(attempt.created_at)})
                          </span>
                        </div>
                      }
                    >
                      <div className="space-y-4 p-4">
                        {hasMultiphase ? (
                          <>
                            <h3 className="font-semibold">🔧 Parametry všech fází svařování:</h3>

                            {/* Zipper Phase */}
                            <div className="border-l-4 border-blue-500 pl-4">
                              <p className="font-semibold mb-2">🔗 Svár zip</p>
                              {attempt.zipper_temperature_c ? (
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Teplota</p>
                                    <p className="font-medium">🌡️ {attempt.zipper_temperature_c}°C</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Tlak</p>
                                    <p className="font-medium">⚡ {attempt.zipper_pressure_bar} bar</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Doba</p>
                                    <p className="font-medium">⏱️ {attempt.zipper_dwell_time_s}s</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">Nezadáno</p>
                              )}
                            </div>

                            {/* Bottom Phase */}
                            <div className="border-l-4 border-green-500 pl-4">
                              <p className="font-semibold mb-2">⬇️ Svár dno</p>
                              {attempt.bottom_temperature_c ? (
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-500">Teplota</p>
                                    <p className="font-medium">🌡️ {attempt.bottom_temperature_c}°C</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Tlak</p>
                                    <p className="font-medium">⚡ {attempt.bottom_pressure_bar} bar</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500">Doba</p>
                                    <p className="font-medium">⏱️ {attempt.bottom_dwell_time_s}s</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">Nezadáno</p>
                              )}
                            </div>

                            {/* Side Phases */}
                            {['E', 'D', 'C', 'B', 'A'].map((tower) => {
                              const key = tower.toLowerCase();
                              const temp = attempt[`side_${key}_temperature_c` as keyof Attempt];
                              const pressure = attempt[`side_${key}_pressure_bar` as keyof Attempt];
                              const dwell = attempt[`side_${key}_dwell_time_s` as keyof Attempt];

                              return (
                                <div key={tower} className="border-l-4 border-purple-500 pl-4">
                                  <p className="font-semibold mb-2">🔷 Věž {tower}</p>
                                  {temp ? (
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Teplota</p>
                                        <p className="font-medium">🌡️ {temp}°C</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Tlak</p>
                                        <p className="font-medium">⚡ {pressure} bar</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Doba</p>
                                        <p className="font-medium">⏱️ {dwell}s</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">Nezadáno</p>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div>
                            <h3 className="font-semibold mb-2">🔧 Původní parametry (jedna fáze):</h3>
                            {attempt.sealing_temperature_c ? (
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Teplota</p>
                                  <p className="font-medium">🌡️ {attempt.sealing_temperature_c}°C</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Tlak</p>
                                  <p className="font-medium">⚡ {attempt.sealing_pressure_bar} bar</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Doba</p>
                                  <p className="font-medium">⏱️ {attempt.dwell_time_s}s</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">Žádné parametry</p>
                            )}
                          </div>
                        )}

                        {attempt.note && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm font-semibold mb-1">📝 Poznámka:</p>
                            <p className="text-gray-700 dark:text-gray-300">{attempt.note}</p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => handleDeleteAttempt(attempt.id)}
                            isLoading={deletingId === attempt.id}
                          >
                            Odstranit
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
          <CardHeader>
            <h2 className="text-2xl font-bold">🔬 Pokus {attempts.length + 1}</h2>
          </CardHeader>
          <CardBody>
            <AttemptForm orderId={Number(orderId)} onSuccess={handleAttemptCreated} />
          </CardBody>
        </Card>

        {/* Back Button at Bottom */}
        <div className="mt-6">
          <Button
            variant="light"
            onPress={() => router.push('/')}
            startContent={<span>🏠</span>}
          >
            Zpět na úvodní stránku
          </Button>
        </div>
      </div>
    </div>
  );
}
