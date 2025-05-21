// app/page.tsx (Next.js 13+ with App Router)
'use client';

import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { format, addMonths } from 'date-fns';
import { Button } from '@/components/ui/button';

Chart.register(ArcElement, Tooltip, Legend);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetchWithFallback = async (url: string, cacheKey: string): Promise<any | null> => {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
};

export default function HomePage() {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [budget, setBudget] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const nextMonth = format(addMonths(new Date(month + '-01'), 1), 'yyyy-MM');
      const budgetPromise = fetchWithFallback(`${API_URL}/budget?month=${month}`, `budget-${month}`);
      const transactionsPromise = fetchWithFallback(`${API_URL}/transactions?from=${month}-01&to=${nextMonth}-01`, `transactions-${month}`);
      const [budgetData, txData] = await Promise.all([budgetPromise, transactionsPromise]);

      setBudget(budgetData?.amount || 0);
      setTransactions(txData || []);
      setLoading(false);
    };

    fetchData();
  }, [month]);

  const lastTransaction = [...transactions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const expenses = transactions.filter(t => t.category !== 'Przychody');
  const incomes = transactions.filter(t => t.category === 'Przychody');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);

  const categoryData = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const incomeData = incomes.reduce((acc, t) => {
    acc[t.description || 'Przychód'] = (acc[t.description || 'Przychód'] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const downloadPDF = () => {
    fetch(`${API_URL}/report?month=${month}`, {
      credentials: 'include'
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${month}.pdf`;
        a.click();
      });
  };

  return (
    <main className="pt-20 p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Panel budżetu</h1>

      <label className="block mb-2">Wybierz miesiąc:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="mb-4 border p-2 rounded"
      />

      {loading ? (
        <p>Trwa ładowanie danych...</p>
      ) : (
        <>
          <div className="bg-white rounded shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Ostatnia transakcja</h2>
            {lastTransaction ? (
              <div>
                <p><strong>Opis:</strong> {lastTransaction.description}</p>
                <p><strong>Kwota:</strong> {lastTransaction.amount} PLN</p>
                <p><strong>Data:</strong> {lastTransaction.date.slice(0, 10)}</p>
              </div>
            ) : <p>Brak transakcji.</p>}
          </div>

          <div className="bg-white rounded shadow p-4 mb-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Wykorzystanie budżetu</h2>
            <div className="h-48 inline-block">
              <Pie data={{
                labels: ['Wydane', 'Pozostało'],
                datasets: [{
                  data: [totalExpenses, Math.max(budget - totalExpenses, 0)],
                  backgroundColor: ['#ef4444', '#22c55e'],
                }]
              }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Podział wydatków wg kategorii</h2>
              <div className="h-64">
                <Pie data={{
                  labels: Object.keys(categoryData),
                  datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: ['#f87171', '#facc15', '#34d399', '#60a5fa', '#a78bfa']
                  }]
                }} />
              </div>
            </div>

            <div className="bg-white rounded shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Podział przychodów</h2>
              <div className="h-64">
                <Pie data={{
                  labels: Object.keys(incomeData),
                  datasets: [{
                    data: Object.values(incomeData),
                    backgroundColor: ['#4ade80', '#2dd4bf', '#60a5fa', '#a78bfa', '#f472b6']
                  }]
                }} />
              </div>
            </div>
          </div>

          <Button onClick={downloadPDF} className="bg-blue-500 hover:bg-blue-600 text-white">
            Pobierz raport PDF
          </Button>
        </>
      )}
    </main>
  );
}
