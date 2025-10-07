'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import Link from 'next/link';
import type { Order } from '@/types';
import { getPackageSizeLabel } from '@/types';
import NewOrderModal from '@/components/NewOrderModal';
import { getOrders } from '@/actions/orders';

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            🔥 Tepelné svařování Doypack
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Sběr dat - Správa zakázek a pokusů
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Create Order Button - Larger for touch */}
        <div className="mb-6">
          <Button
            color="primary"
            size="lg"
            onPress={() => setIsModalOpen(true)}
            className="w-full md:w-auto h-14 text-lg font-bold"
            startContent={<span className="text-xl">➕</span>}
          >
            Nová zakázka
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
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                  Zatím nemáte žádné zakázky
                </p>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Klikněte na tlačítko výše pro vytvoření vaší první zakázky
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 px-2">
              📋 Seznam zakázek ({orders.length})
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {orders.map((order, index) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${index !== orders.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        📦 {order.order_code}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="truncate">{order.material_type}</span>
                        <span>•</span>
                        <span>{getPackageSizeLabel(order.package_size)}</span>
                        <span>•</span>
                        <span>{order.sackovacka}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-gray-400 dark:text-gray-500">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
