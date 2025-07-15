'use client'

import React, { useState } from 'react';
import { WorkExperience } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { getCardClasses, getInputClasses, getButtonClasses } from '../../../styles/theme';

interface WorkExperienceFormProps {
    experiences: WorkExperience[];
    onAdd: (experience: WorkExperience) => void;
    onUpdate: (index: number, experience: WorkExperience) => void;
    onRemove: (index: number) => void;
}

export default function WorkExperienceForm({
    experiences,
    onAdd,
    onUpdate,
    onRemove,
}: WorkExperienceFormProps) {
    const [formData, setFormData] = useState<Omit<WorkExperience, 'id' | 'description'> & { description: string }>({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert description to array of bullet points
        const descriptionArray = formData.description
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (editIndex !== null) {
            onUpdate(editIndex, {
                ...experiences[editIndex],
                ...formData,
                description: descriptionArray
            });
            setEditIndex(null);
        } else {
            onAdd({
                id: uuidv4(),
                ...formData,
                description: descriptionArray
            });
        }

        // Reset form
        setFormData({
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
        });
    };

    const handleEdit = (index: number) => {
        const exp = experiences[index];
        setFormData({
            company: exp.company,
            position: exp.position,
            startDate: exp.startDate,
            endDate: exp.endDate,
            description: exp.description.join('\n'),
        });
        setEditIndex(index);
    };

    return (
        <div className="space-y-6">
            <div className={`${getCardClasses()} divide-y divide-gray-600`}>
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-white">Work Experience</h3>
                    <p className="mt-1 text-sm text-gray-400">Add your professional experience.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="company" className="block text-sm font-medium text-gray-300">
                                    Company
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="company"
                                        id="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        required
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="position" className="block text-sm font-medium text-gray-300">
                                    Position
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="position"
                                        id="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        required
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
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
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">
                                    End Date (or "Present")
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="endDate"
                                        id="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        required
                                        className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                                    Description (one bullet point per line)
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        className={`${getInputClasses('textarea')} block w-full sm:text-sm rounded-md`}
                                        placeholder="• Achieved X by implementing Y, resulting in Z&#10;• Led a team of N people to accomplish...&#10;• Reduced costs by X% through..."
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-400">
                                    Use bullet points to highlight your achievements and responsibilities.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        company: '',
                                        position: '',
                                        startDate: '',
                                        endDate: '',
                                        description: '',
                                    });
                                    setEditIndex(null);
                                }}
                                className={`${getButtonClasses('secondary')} mr-3`}
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                className={getButtonClasses('primary')}
                            >
                                {editIndex !== null ? 'Update' : 'Add'} Experience
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {experiences.length > 0 && (
                <div className="bg-gray-800 border border-gray-600 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-600">
                        {experiences.map((exp, index) => (
                            <li key={exp.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-blue-400 truncate">
                                                {exp.position} at {exp.company}
                                            </p>
                                            <p className="mt-2 text-sm text-gray-400">
                                                {new Date(exp.startDate).toLocaleDateString()} - {new Date(exp.endDate).toLocaleDateString()}
                                            </p>
                                            <div className="mt-2 text-sm text-gray-300">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {exp.description.map((bullet, i) => (
                                                        <li key={i}>{bullet}</li>
                                                    ))}
                                                </ul>
                                            </div>
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
                                                className={getButtonClasses('danger')}
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