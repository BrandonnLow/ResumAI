'use client'

import React, { useState } from 'react';
import { Education } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface EducationFormProps {
    education: Education[];
    onAdd: (education: Education) => void;
    onUpdate: (index: number, education: Education) => void;
    onRemove: (index: number) => void;
}

export default function EducationForm({
    education,
    onAdd,
    onUpdate,
    onRemove,
}: EducationFormProps) {
    const [formData, setFormData] = useState<Omit<Education, 'id'>>({
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editIndex !== null) {
            onUpdate(editIndex, { ...education[editIndex], ...formData });
            setEditIndex(null);
        } else {
            onAdd({ id: uuidv4(), ...formData });
        }

        // Reset form
        setFormData({
            institution: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            gpa: '',
        });
    };

    const handleEdit = (index: number) => {
        setFormData(education[index]);
        setEditIndex(index);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 shadow rounded-lg divide-y divide-gray-600">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-white">Education</h3>
                    <p className="mt-1 text-sm text-gray-400">Add your educational background.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="institution" className="block text-sm font-medium text-gray-300">
                                    Institution
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="institution"
                                        id="institution"
                                        value={formData.institution}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="degree" className="block text-sm font-medium text-gray-300">
                                    Degree
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="degree"
                                        id="degree"
                                        value={formData.degree}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="field" className="block text-sm font-medium text-gray-300">
                                    Field of Study
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="field"
                                        id="field"
                                        value={formData.field}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="gpa" className="block text-sm font-medium text-gray-300">
                                    GPA (optional)
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="gpa"
                                        id="gpa"
                                        value={formData.gpa || ''}
                                        onChange={handleInputChange}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">
                                    Start Date
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="startDate"
                                        id="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">
                                    End Date (or Expected)
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="endDate"
                                        id="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        institution: '',
                                        degree: '',
                                        field: '',
                                        startDate: '',
                                        endDate: '',
                                        gpa: '',
                                    });
                                    setEditIndex(null);
                                }}
                                className="bg-gray-700 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editIndex !== null ? 'Update' : 'Add'} Education
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {education.length > 0 && (
                <div className="bg-gray-800 border border-gray-600 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-600">
                        {education.map((edu, index) => (
                            <li key={edu.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-blue-400 truncate">
                                                {edu.degree} in {edu.field}
                                            </p>
                                            <p className="text-sm text-gray-300">
                                                {edu.institution}
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-400">
                                                <span>
                                                    {new Date(edu.startDate).toLocaleDateString()} - {new Date(edu.endDate).toLocaleDateString()}
                                                </span>
                                                {edu.gpa && (
                                                    <span className="ml-4">GPA: {edu.gpa}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(index)}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-600 shadow-sm text-xs font-medium rounded text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onRemove(index)}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-300 bg-red-900/20 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}