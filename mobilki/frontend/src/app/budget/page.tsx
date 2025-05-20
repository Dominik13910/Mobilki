// app/budget/page.tsx
"use client";

import { useEffect, useState } from "react";
import { format, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  requestNotificationPermission,
  showBudgetWarning,
} from "@/utils/notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function BudgetPage() {
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [budget, setBudget] = useState<number | null>(null);
  const [expenses, setExpenses] = useState(0);
  const [incomes, setIncomes] = useState(0);
  const [newBudget, setNewBudget] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const nextMonth = format(
        addMonths(new Date(month + "-01"), 1),
        "yyyy-MM"
      );
      try {
        const [budgetRes, txRes] = await Promise.all([
          fetch(`${API_URL}/budget?month=${month}`, { credentials: "include" }),
          fetch(`${API_URL}/transactions?from=${month}-01&to=${nextMonth}-01`, {
            credentials: "include",
          }),
        ]);

        if (!budgetRes.ok || !txRes.ok) throw new Error("Offline fallback");

        const budgetData = await budgetRes.json();
        const transactions = await txRes.json();

        localStorage.setItem(`budget-${month}`, JSON.stringify(budgetData));
        localStorage.setItem(
          `transactions-${month}`,
          JSON.stringify(transactions)
        );

        setBudget(budgetData?.amount || null);
        setNewBudget(budgetData?.amount?.toString() || "");

        const incomeTotal = transactions
          .filter((t: any) => t.category === "Przychody")
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        const expenseTotal = transactions
          .filter((t: any) => t.category !== "Przychody")
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        setIncomes(incomeTotal);
        setExpenses(expenseTotal);
      } catch {
        const cachedBudget = localStorage.getItem(`budget-${month}`);
        const cachedTx = localStorage.getItem(`transactions-${month}`);
        const budgetData = cachedBudget ? JSON.parse(cachedBudget) : null;
        const transactions = cachedTx ? JSON.parse(cachedTx) : [];

        setBudget(budgetData?.amount || null);
        setNewBudget(budgetData?.amount?.toString() || "");

        const incomeTotal = transactions
          .filter((t: any) => t.category === "Przychody")
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        const expenseTotal = transactions
          .filter((t: any) => t.category !== "Przychody")
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        setIncomes(incomeTotal);
        setExpenses(expenseTotal);

        requestNotificationPermission();

        if (budget && expenseTotal >= budget - 500 && expenseTotal < budget) {
          showBudgetWarning(
            `Uwaga! Zbliżasz się do limitu budżetu. Pozostało ${Math.round(
              budget - expenseTotal
            )} PLN.`
          );
        }

        if (budget && expenseTotal >= budget) {
          showBudgetWarning("Przekroczono budżet!");
        }
      }
    };

    fetchData();
  }, [month]);

  const handleSubmit = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount)) return alert("Nieprawidłowa wartość budżetu");

    await fetch(`${API_URL}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ month, amount }),
    });

    setBudget(amount);
    const updatedBudget = { amount };
    localStorage.setItem(`budget-${month}`, JSON.stringify(updatedBudget));
  };

  return (
    <main className="pt-20 p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Budżet miesięczny</h1>

      <label className="block mb-2">Wybierz miesiąc:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="mb-4 border p-2 rounded"
      />

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Aktualny budżet: {budget !== null ? `${budget} PLN` : "Brak"}
        </h2>
        <p>Wydano: {expenses} PLN</p>
        <p>
          Wykorzystanie budżetu:{" "}
          {budget ? `${((expenses / budget) * 100).toFixed(1)}%` : "—"}
        </p>
        <p>
          Budżet to{" "}
          {incomes ? `${(((budget || 0) / incomes) * 100).toFixed(1)}%` : "—"}{" "}
          Twoich przychodów
        </p>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Ustaw nowy budżet</h2>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
            placeholder="Nowy budżet w PLN"
          />
          <Button onClick={handleSubmit} className="bg-blue-500 text-white">
            Zapisz
          </Button>
        </div>
      </div>
    </main>
  );
}
