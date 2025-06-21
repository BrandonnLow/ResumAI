'use client'

import React, { useState } from 'react';
import { Project } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectFormProps {
    projects: Project[];
    onAdd: (project: Project) => void;
    onUpdate: (index: number, project: Project) => void;
    onRemove: (index: number) => void;
}

export default function ProjectForm({
    projects,
    onAdd,
    onUpdate,
    onRemove,
}: ProjectFormProps) {
    const [formData, setFormData] = useState<Omit<Project, 'id' | 'description' | 'technologies'> & {
        description: string,
        technologiesStr: string
    }>({
        name: '',
        description: '',
        technologiesStr: '',
        link: '',
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

        // Convert technologies string to array
        const technologiesArray = formData.technologiesStr
            .split(',')
            .map(tech => tech.trim())
            .filter(tech => tech.length > 0);

        if (editIndex !== null) {
            onUpdate(editIndex, {
                ...projects[editIndex],
                name: formData.name,
                description: descriptionArray,
                technologies: technologiesArray,
                link: formData.link,
            });
            setEditIndex(null);
        } else {
            onAdd({
                id: uuidv4(),
                name: formData.name,
                description: descriptionArray,
                technologies: technologiesArray,
                link: formData.link,
            });
        }

        // Reset form
        setFormData({
            name: '',
            description: '',
            technologiesStr: '',
            link: '',
        });
    };

    return (
        <div className="space-y-6">
            {projects.length > 0 && (
                <div className="bg-gray-800 border border-gray-600 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-600">
                        {projects.map((project, index) => (
                            <li key={project.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-blue-400 truncate">
                                                    {project.name}
                                                </p>
                                                {project.link && (
                                                    <a
                                                        href={project.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-xs text-gray-400 hover:text-gray-300"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm text-gray-300">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {project.description.map((bullet, i) => (
                                                        <li key={i}>{bullet}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {project.technologies.map((tech, i) => (
                                                    <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
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