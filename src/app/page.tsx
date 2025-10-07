'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import Link from 'next/link';
import type { Order } from '@/types';
import { getPackageSizeLabel } from '@/types';
import NewOrderModal from '@/components/NewOrderModal';

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderCreated = () => {
    setIsModalOpen(false);
    fetchOrders();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔥 Tepelné svařování Doypack
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sběr dat - Správa zakázek a pokusů svařování
          </p>
        </div>

        {/* Create Order Button */}
        <div className="mb-6">
          <Button
            color="primary"
            size="lg"
            onPress={() => setIsModalOpen(true)}
            className="font-semibold"
          >
            ➕ Nová zakázka
          </Button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8">
            <CardBody>
              <div className="text-center">
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                  👋 Vítejte! Klikněte na tlačítko výše pro vytvoření vaší první zakázky.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              📋 Seznam zakázek
            </h2>
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      📦 {order.order_code}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button color="primary" size="sm">
                      📝 Otevřít zakázku
                    </Button>
                  </Link>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Materiál</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.material_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pokrytí</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.print_coverage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Velikost</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getPackageSizeLabel(order.package_size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sáčkovačka</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.sackovacka || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {order.note && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Poznámka:</strong> {order.note}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOrderCreated}
      />
    </div>
  );
}
