"use client";

import { useEffect, useState } from "react";
import { NoteIcon, TrashIcon } from "./Icons";
import type { TaskItem } from "@/types/dashboard";

const STORAGE_KEY = "employee:quick-tasks";

export function TaskList() {
    const [items, setItems] = useState<TaskItem[]>(() => {
        if (typeof window === "undefined") {
            return [];
        }

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return [];
            }

            return JSON.parse(raw) as TaskItem[];
        } catch {
            return [];
        }
    });
    const [draft, setDraft] = useState("");

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // ignore storage errors
        }
    }, [items]);

    const addTask = () => {
        const title = draft.trim();
        if (!title) return;
        setItems((prev) => [...prev, { title }]);
        setDraft("");
    };

    const toggleTask = (index: number) => {
        setItems((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)));
    };

    const deleteTask = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="rounded-3xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <NoteIcon className="h-5 w-5 text-blue-600" />
                    <span>Quick Task Notes</span>
                </div>
                <div className="flex gap-2">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addTask();
                        }}
                        placeholder="Add note"
                        className="h-9 rounded-full border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={addTask}
                        className="rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow hover:bg-blue-700"
                    >
                        Add
                    </button>
                </div>
            </div>

            <ul className="space-y-3">
                {items.map((task, index) => (
                    <li
                        key={`${task.title}-${index}`}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-800"
                    >
                        <button
                            onClick={() => toggleTask(index)}
                            className={`flex items-center gap-3 text-left ${task.done ? "text-slate-700" : ""}`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${task.done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                                    }`}
                            >
                                {task.done ? "✓" : ""}
                            </span>
                            <span>{task.title}</span>
                        </button>
                        <button
                            onClick={() => deleteTask(index)}
                            className="rounded-full p-1 text-slate-400 hover:bg-slate-50"
                            aria-label="Delete task"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
