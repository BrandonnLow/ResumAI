'use client'

import React, { useState } from 'react';
import { Skill } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface SkillFormProps {
    skills: Skill[];
    onAdd: (skill: Skill) => void;
    onUpdate: (index: number, skill: Skill) => void;
    onRemove: (index: number) => void;
}

export default function SkillForm({
    skills,
    onAdd,
    onUpdate,
    onRemove,
}: SkillFormProps) {
    const [formData, setFormData] = useState<Omit<Skill, 'id'>>({
        name: '',
        level: 'Intermediate',
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editIndex !== null) {
            onUpdate(editIndex, { ...skills[editIndex], ...formData });
            setEditIndex(null);
        } else {
            onAdd({ id: uuidv4(), ...formData });
        }

        setFormData({
            name: '',
            level: 'Intermediate',
        });
    };

    const handleEdit = (index: number) => {
        setFormData(skills[index]);
        setEditIndex(index);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 shadow rounded-lg divide-y divide-gray-600">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-white">Skills</h3>
                    <p className="mt-1 text-sm text-gray-400">Add your technical and soft skills.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                    Skill Name
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
                                        placeholder="E.g., JavaScript, Project Management, Data Analysis"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="level" className="block text-sm font-medium text-gray-300">
                                    Proficiency Level
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="level"
                                        name="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-700 text-white appearance-none"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        name: '',
                                        level: 'Intermediate',
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
                                {editIndex !== null ? 'Update' : 'Add'} Skill
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {skills.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Your Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <div
                                key={skill.id}
                                className="inline-flex items-center bg-blue-900/20 border border-blue-600/30 rounded-full px-3 py-1 text-sm font-medium text-blue-300"
                            >
                                {skill.name}
                                {skill.level && (
                                    <span className="ml-1 text-xs text-blue-400">
                                        ({skill.level})
                                    </span>
                                )}
                                <div className="flex ml-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(index)}
                                        className="text-blue-400 hover:text-blue-300 mr-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}