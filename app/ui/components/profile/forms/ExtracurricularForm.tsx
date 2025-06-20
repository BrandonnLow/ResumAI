'use client'

import React, { useState } from 'react';
import { Extracurricular } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface ExtracurricularFormProps {
    extracurriculars: Extracurricular[];
    onAdd: (extracurricular: Extracurricular) => void;
    onUpdate: (index: number, extracurricular: Extracurricular) => void;
    onRemove: (index: number) => void;
}

export default function ExtracurricularForm({
    extracurriculars,
    onAdd,
    onUpdate,
    onRemove,
}: ExtracurricularFormProps) {
    const [formData, setFormData] = useState<Extracurricular>({
        id: '',
        name: '',
        role: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ ...formData, id: uuidv4() });
        setFormData({
            id: '',
            name: '',
            role: '',
            description: '',
            startDate: '',
            endDate: '',
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-white">Extracurricular Activities</h3>
                    <p className="mt-1 text-sm text-gray-400">Add your extracurricular activities, volunteer work, or leadership roles.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                    Organization/Activity Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                                    Your Role
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="role"
                                        id="role"
                                        value={formData.role || ''}
                                        onChange={handleInputChange}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                        placeholder="E.g., Volunteer, Club President, Team Captain"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                        placeholder="Briefly describe your involvement and any achievements"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Add Activity
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}