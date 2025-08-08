'use client'

import React, { useState } from 'react';
import { getInputClasses, getButtonClasses } from '../../ui/styles/theme';

interface GoalSettingsProps {
    currentTarget: number;
    onSave: (target: number) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function GoalSettings({ currentTarget, onSave, onCancel, loading }: GoalSettingsProps) {
    const [target, setTarget] = useState(currentTarget || 5);

    const presets = [3, 5, 10, 15, 20, 25];

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (target < 1) return;
        await onSave(target);
    };

    const getNote = (val: number) => {
        if (val <= 3) return { text: "Easy start", color: "text-green-400" };
        if (val <= 7) return { text: "Steady pace", color: "text-blue-400" };
        if (val <= 15) return { text: "Good momentum", color: "text-yellow-400" };
        if (val <= 25) return { text: "Intensive prep", color: "text-orange-400" };
        return { text: "Expert mode", color: "text-red-400" };
    };

    const note = getNote(target);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                            {currentTarget > 0 ? 'Update Goal' : 'Set Goal'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-6">
                    <div className="mb-6">
                        <label htmlFor="target" className="block text-sm font-medium text-gray-300 mb-2">
                            Questions per week
                        </label>
                        <input
                            type="number"
                            id="target"
                            min="1"
                            max="100"
                            value={target}
                            onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
                            className={`${getInputClasses()} block w-full sm:text-sm rounded-md text-center text-lg font-semibold`}
                            disabled={loading}
                        />
                        <p className={`mt-2 text-sm ${note.color}`}>
                            {note.text}
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-300 mb-3">Quick pick:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setTarget(preset)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${target === preset
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    disabled={loading}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6 bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400">
                            About {Math.round(target * 5)} minutes per week
                            <span className="text-gray-500 ml-1">
                                ({Math.round(target * 5 / 7)} min/day)
                            </span>
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className={`${getButtonClasses('secondary')} flex-1`}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`${getButtonClasses('primary')} flex-1`}
                            disabled={loading || target < 1}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Setting...
                                </div>
                            ) : (
                                currentTarget > 0 ? 'Update Goal' : 'Set Goal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}