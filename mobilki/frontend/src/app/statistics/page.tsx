"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addMonths, isBefore } from "date-fns";
import { useRouter } from "next/router";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://budzetify.onrender.com";

export default function StatisticsPage() {
  const today = new Date();
  const defaultMonth = format(today, "yyyy-MM");

  const [month, setMonth] = useState(defaultMonth);
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(today, "yyyy-MM-dd"));
  const router = useRouter();
  const [budget, setBudget] = useState<number | null>(null);
  const [incomeData, setIncomeData] = useState<
    { date: string; amount: number }[]
  >([]);
  const [expenseData, setExpenseData] = useState<
    { date: string; amount: number }[]
  >([]);
  const [barChartData, setBarChartData] = useState<
    { month: string; Przychody: number; Wydatki: number }[]
  >([]);

  const fetchLineChartData = useCallback(
    async (forceRefresh = false) => {
      const fromDate = `${month}-01`;
      const toDate = format(
        new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0),
        "yyyy-MM-dd"
      );

      const cacheKeyBudget = `budget-${month}`;
      const cacheKeyTransactions = `transactions-${month}`;

      try {
        const [budgetRes, txRes] = await Promise.all([
          fetch(`${API_URL}/budget?month=${month}`, { credentials: "include" }),
          fetch(`${API_URL}/transactions?from=${fromDate}&to=${toDate}`, {
            credentials: "include",
          }),
        ]);

        if (!budgetRes.ok || !txRes.ok) throw new Error("API error");

        const budgetData = await budgetRes.json();
        const transactions = await txRes.json();

        localStorage.setItem(cacheKeyBudget, JSON.stringify(budgetData));
        localStorage.setItem(
          cacheKeyTransactions,
          JSON.stringify(transactions)
        );

        const incomePoints = [];
        const expensePoints = [];

        for (const tx of transactions) {
          const date = tx.date?.slice(0, 10);
          if (tx.category === "Przychody") {
            incomePoints.push({ date, amount: tx.amount });
          } else {
            expensePoints.push({ date, amount: tx.amount });
          }
        }

        setIncomeData(
          incomePoints.sort((a, b) => a.date.localeCompare(b.date))
        );
        setExpenseData(
          expensePoints.sort((a, b) => a.date.localeCompare(b.date))
        );
        setBudget(budgetData.amount);
      } catch {
        const cachedBudget = localStorage.getItem(cacheKeyBudget);
        const cachedTx = localStorage.getItem(cacheKeyTransactions);

        if (cachedBudget && cachedTx) {
          try {
            const budgetData = JSON.parse(cachedBudget);
            const transactions = JSON.parse(cachedTx);

            const incomePoints = [];
            const expensePoints = [];

            for (const tx of transactions) {
              const date = tx.date?.slice(0, 10);
              if (tx.category === "Przychody") {
                incomePoints.push({ date, amount: tx.amount });
              } else {
                expensePoints.push({ date, amount: tx.amount });
              }
            }

            setIncomeData(
              incomePoints.sort((a, b) => a.date.localeCompare(b.date))
            );
            setExpenseData(
              expensePoints.sort((a, b) => a.date.localeCompare(b.date))
            );
            setBudget(budgetData.amount);
          } catch {
            console.warn("Brak poprawnych danych w cache.");
          }
        }
      }
    },
    [month]
  );

  const fetchBarChartData = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `barChartData-${from}-${to}`;

      try {
        const txRes = await fetch(
          `${API_URL}/transactions?from=${from}&to=${to}`,
          {
            credentials: "include",
          }
        );

        if (!txRes.ok) throw new Error("API error");

        const transactions = await txRes.json();
        const monthly: Record<string, { Przychody: number; Wydatki: number }> =
          {};

        for (const tx of transactions) {
          const dateStr = tx.date?.slice(0, 10);
          const date = parseISO(dateStr);
          const monthKey = format(date, "yyyy-MM");

          if (!monthly[monthKey]) {
            monthly[monthKey] = { Przychody: 0, Wydatki: 0 };
          }

          if (tx.category === "Przychody") {
            monthly[monthKey].Przychody += tx.amount;
          } else {
            monthly[monthKey].Wydatki += tx.amount;
          }
        }

        const start = startOfMonth(parseISO(from));
        const end = startOfMonth(parseISO(to));
        const monthsList = [];

        let current = start;
        while (!isBefore(end, current)) {
          monthsList.push(format(current, "yyyy-MM"));
          current = addMonths(current, 1);
        }

        const barData = monthsList.map((monthKey) => ({
          month: monthKey,
          Przychody: monthly[monthKey]?.Przychody || 0,
          Wydatki: monthly[monthKey]?.Wydatki || 0,
        }));

        setBarChartData(barData);
        localStorage.setItem(cacheKey, JSON.stringify(barData));
      } catch {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setBarChartData(JSON.parse(cached));
          } catch {
            console.warn("Brak poprawnych danych słupkowych w cache.");
          }
        }
      }
    },
    [from, to]
  );

  useEffect(() => {
    fetchLineChartData();
  }, [month]);

  return (
    <main className="p-4 pt-20 max-w-5xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold mb-4">Statystyki finansowe</h1>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">
          Wykres liniowy (bieżący miesiąc)
        </h2>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Button onClick={() => fetchLineChartData(true)}>Odśwież</Button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[
                0,
                Math.max(
                  ...incomeData.map((d) => d.amount),
                  ...expenseData.map((d) => d.amount),
                  budget || 0
                ),
              ]}
            />
            <Tooltip />
            <Line
              data={incomeData}
              type="monotone"
              dataKey="amount"
              name="Przychody"
              stroke="#22c55e"
              dot={{ r: 4 }}
            />
            <Line
              data={expenseData}
              type="monotone"
              dataKey="amount"
              name="Wydatki"
              stroke="#8b5cf6"
              dot={{ r: 4 }}
            />
            {budget && (
              <ReferenceLine
                y={budget}
                label={`Budżet: ${budget} zł`}
                stroke="red"
                strokeDasharray="3 3"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">
          Wykres słupkowy (porównanie miesięczne)
        </h2>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Button onClick={() => fetchBarChartData(true)}>Pokaż</Button>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Wydatki" fill="#8b5cf6" />
            <Bar dataKey="Przychody" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
