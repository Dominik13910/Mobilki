// app/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { format, addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/router";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://budzetify.onrender.com";

const CATEGORIES: Record<string, string> = {
  transport: "Motoryzacja i transport",
  bills: "Dom i rachunki",
  groceries: "Wydatki podstawowe",
  entertainment: "Rozrywka i podróże",
  finance: "Finanse",
  income: "Przychody",
  other: "Inne",
};

export default function TransactionsPage() {
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("groceries");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const router = useRouter();
  const [filterCategory, setFilterCategory] = useState("");
  const getMonthStart = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return format(start, "yyyy-MM-dd");
  };

  const getMonthEnd = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return format(end, "yyyy-MM-dd");
  };
  const applyFilters = (data: any[]) => {
    return data.filter((t) => {
      const isInDateRange =
        (!filterFrom || t.date >= filterFrom) &&
        (!filterTo || t.date <= filterTo);
      const isInCategory =
        !filterCategory ||
        filterCategory === "all" ||
        t.category === filterCategory;
      return isInDateRange && isInCategory;
    });
  };
  const [filterFrom, setFilterFrom] = useState(getMonthStart());
  const [filterTo, setFilterTo] = useState(getMonthEnd());

  const fetchTransactions = async () => {
    const meRes = await fetch(`${API_URL}/me`, {
      credentials: "include",
    });

    if (meRes.status === 401) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    const nextMonth = format(addMonths(new Date(month + "-01"), 1), "yyyy-MM");
    const params = new URLSearchParams({
      from: filterFrom || `${month}-01`,
      to: filterTo || `${nextMonth}-01`,
    });
    if (filterCategory && filterCategory !== "all")
      params.append("category", filterCategory);

    try {
      const res = await fetch(`${API_URL}/transactions?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("API response not OK");

      const data = await res.json();

      localStorage.setItem(`transactions-${month}`, JSON.stringify(data));
      setTransactions(data);
    } catch (error) {
      console.warn("Nie udało się pobrać danych z API, używam localStorage");

      const cached = localStorage.getItem(`transactions-${month}`);
      const parsed = cached ? JSON.parse(cached) : [];

      const filtered = applyFilters(parsed);
      setTransactions(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [month, filterCategory, filterFrom, filterTo]);

  const handleAddTransaction = async () => {
    const payload = {
      amount: parseFloat(amount),
      description,
      category,
      date,
      is_income: category === "income",
    };
    await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    setAmount("");
    setDescription("");
    setCategory("groceries");
    setDate(format(new Date(), "yyyy-MM-dd"));
    fetchTransactions();
  };

  return (
    <main className="pt-20 p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transakcje</h1>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Dodaj transakcję</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <Input
            type="number"
            placeholder="Kwota"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Opis"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddTransaction}>Dodaj</Button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Filtruj transakcje</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <Input
            type="date"
            placeholder="Od"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <Input
            type="date"
            placeholder="Do"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Transakcje w miesiącu</h2>
        {loading ? (
          <p>Ładowanie...</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t, i) => (
              <li key={i} className="border-b pb-2">
                <div className="text-sm text-gray-600">
                  {t.date.slice(0, 10)}
                </div>
                <div className="font-medium">
                  {t.description} – {t.amount} PLN
                </div>
                <div className="text-sm text-gray-500">
                  {CATEGORIES[t.category] || t.category}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
