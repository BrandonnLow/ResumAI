'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../ui/Context/AuthContext';
import { getUserProfile, updateUserProfile } from '../Services/firebase/firestore';
import { beautifyProfile } from '../Services/openai/functions';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';
import PrivateRoute from '../ui/components/PrivateRoute';
import { getCardClasses, getInputClasses, getButtonClasses } from '../ui/styles/theme';
import { LoadingPage } from '../ui/components/Loading';

export default function Profile() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [beautifying, setBeautifying] = useState(false);

    const [originalSummary, setOriginalSummary] = useState<string>('');
    const [showComparison, setShowComparison] = useState<boolean>(false);
    const [fieldsChanged, setFieldsChanged] = useState<string[]>([]);
    const [saveHighlighted, setSaveHighlighted] = useState<boolean>(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const userProfile = await getUserProfile(currentUser.uid);

                if (!userProfile) {
                    return router.push('/profile/setup');
                }

                setProfile(userProfile);
                setFormData(userProfile);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load your profile. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !profile) return;

        try {
            setUpdating(true);

            await updateUserProfile({
                ...formData,
                uid: currentUser.uid
            });

            setProfile(prev => prev ? { ...prev, ...formData } : null);
            toast.success('Profile updated successfully!');

            // Reset states after successful update
            setShowComparison(false);
            setFieldsChanged([]);
            setSaveHighlighted(false);

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    // beautifyProfile function
    const handleBeautifyProfile = async () => {
        if (!profile) return;

        try {
            setBeautifying(true);
            toast.loading('Enhancing your profile content with AI magic...');

            // Store original values for comparison
            setOriginalSummary(formData.summary || '');

            // Track modified fields
            const changedFields: string[] = [];

            const enhancedProfile = await beautifyProfile(profile);

            // Check what fields were modified
            Object.keys(enhancedProfile).forEach(key => {
                if (JSON.stringify(enhancedProfile[key as keyof UserProfile]) !==
                    JSON.stringify(profile[key as keyof UserProfile])) {
                    changedFields.push(key);
                }
            });

            setFieldsChanged(changedFields);

            // Update form data with enhanced content
            setFormData(prev => ({
                ...prev,
                ...enhancedProfile
            }));

            toast.dismiss();

            // Show specific toast based on what changed
            if (changedFields.length > 0) {
                const changedText = changedFields.join(', ');
                toast.success(
                    `Profile enhanced! Improvements made to your ${changedText}. Review and save the changes.`,
                    { duration: 5000 }
                );

                // Show comparison for summary if it changed
                if (changedFields.includes('summary')) {
                    setShowComparison(true);
                }

                // Highlight save button
                setSaveHighlighted(true);

                // Apply visual highlight to fields that were changed
                setTimeout(() => {
                    changedFields.forEach(field => {
                        const element = document.getElementById(field);
                        if (element) {
                            element.style.borderColor = '#3b82f6';
                            element.style.backgroundColor = '#1e3a8a';
                            setTimeout(() => {
                                element.style.backgroundColor = '';
                                element.style.transition = 'background-color 1s ease-out';
                            }, 100);
                        }
                    });
                }, 500);
            } else {
                toast.success('Profile looks great already! No significant improvements needed.');
            }

        } catch (error) {
            console.error('Error beautifying profile:', error);
            toast.dismiss();
            toast.error('Failed to enhance profile. Please try again.');
        } finally {
            setBeautifying(false);
        }
    };

    if (loading) {
        return (
            <PrivateRoute>
                <LoadingPage text="Loading..." />
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <div className="min-h-screen bg-gray-700">
                <div className="w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-white">Your Profile</h1>
                            <p className="mt-1 text-gray-400">
                                Update your personal information to get more relevant interview questions
                            </p>
                        </div>

                        {/* Main Profile Form */}
                        <div className={`${getCardClasses()} mb-8`}>
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                                                Full Name
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    value={formData.name || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    style={fieldsChanged.includes('name') ? { borderColor: '#3b82f6' } : {}}
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                                Email
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={formData.email || ''}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                                                Phone Number
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    id="phone"
                                                    value={formData.phone || ''}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    style={fieldsChanged.includes('phone') ? { borderColor: '#3b82f6' } : {}}
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                                                Location
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    name="location"
                                                    id="location"
                                                    value={formData.location || ''}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    placeholder="City, State/Province, Country"
                                                    style={fieldsChanged.includes('location') ? { borderColor: '#3b82f6' } : {}}
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="summary" className="block text-sm font-medium text-gray-300">
                                                Professional Summary
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="summary"
                                                    name="summary"
                                                    rows={4}
                                                    value={formData.summary || ''}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    style={fieldsChanged.includes('summary') ? { borderColor: '#3b82f6' } : {}}
                                                />
                                            </div>

                                            {/* Before/After Comparison */}
                                            {showComparison && originalSummary && (
                                                <div className="mt-3 p-3 bg-gray-700 rounded-md border border-gray-600">
                                                    <h4 className="text-xs font-medium text-gray-300 mb-2">See what changed:</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-1">Before:</p>
                                                            <p className="text-xs text-gray-300 whitespace-pre-line bg-gray-800 p-2 rounded border border-gray-600">{originalSummary}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-1">After:</p>
                                                            <p className="text-xs text-gray-300 whitespace-pre-line bg-gray-800 p-2 rounded border border-blue-600">{formData.summary}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowComparison(false)}
                                                        className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                                                    >
                                                        Close comparison
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="sm:col-span-6">
                                            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-300">
                                                Additional Information
                                            </label>
                                            <div className="mt-1">
                                                <textarea
                                                    id="additionalInfo"
                                                    name="additionalInfo"
                                                    rows={4}
                                                    value={formData.additionalInfo || ''}
                                                    onChange={handleInputChange}
                                                    className={`${getInputClasses()} block w-full sm:text-sm rounded-md`}
                                                    style={fieldsChanged.includes('additionalInfo') ? { borderColor: '#3b82f6' } : {}}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Beautify Profile Section */}
                                    <div className="mt-6 bg-blue-900/10 border border-blue-600/30 p-5 rounded-lg shadow-sm">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-blue-200 mb-2 flex items-center">
                                                    <span className="mr-2">✨</span>
                                                    Enhance My Profile with AI
                                                </h3>
                                                <p className="text-sm text-blue-300 mb-3">
                                                    Instantly transform your profile content with our AI enhancement that will:
                                                </p>
                                                <ul className="list-disc list-inside text-sm text-blue-300 mb-4 space-y-1">
                                                    <li>Add powerful action verbs that make your experience stand out</li>
                                                    <li>Quantify your achievements with specific metrics where possible</li>
                                                    <li>Restructure content for maximum professional impact</li>
                                                    <li>Highlight your most relevant skills and accomplishments</li>
                                                </ul>
                                            </div>
                                            <div className="mt-4 md:mt-0">
                                                <button
                                                    type="button"
                                                    onClick={handleBeautifyProfile}
                                                    disabled={beautifying}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:opacity-50 disabled:hover:scale-100"
                                                >
                                                    {beautifying ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Enhancing with AI...
                                                        </>
                                                    ) : (
                                                        'Enhance with AI Magic'
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {fieldsChanged.length > 0 && (
                                            <div className="mt-3 bg-gray-800/70 p-3 rounded-md border border-blue-600/30">
                                                <p className="text-sm text-blue-300">
                                                    <span className="font-medium">✅ AI enhancement applied!</span>
                                                    <br />
                                                    Your profile has been improved with professional language and structure.
                                                    {!showComparison && fieldsChanged.includes('summary') && (
                                                        <>
                                                            <br />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowComparison(true)}
                                                                className="mt-1 text-blue-400 hover:text-blue-300 underline text-xs"
                                                            >
                                                                Click here to view the changes
                                                            </button>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="px-4 py-3 bg-gray-800 text-right sm:px-6 border-t border-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Edit Full Profile
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className={`ml-3 ${saveHighlighted ? 'bg-green-600 hover:bg-green-700 transform scale-105' : 'bg-blue-600 hover:bg-blue-700'} inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300`}
                                        style={saveHighlighted ? { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' } : {}}
                                    >
                                        {updating ? 'Saving...' : saveHighlighted ? 'Save Enhanced Profile' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Profile Sections Grid */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Education section */}
                            <div className={getCardClasses()}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Education</h2>
                                        <p className="mt-1 text-sm text-gray-400">Your academic background</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Edit Education
                                    </button>
                                </div>
                                <div className="border-t border-gray-600">
                                    {profile?.education && profile.education.length > 0 ? (
                                        <ul className="divide-y divide-gray-600">
                                            {profile.education.map((edu) => (
                                                <li key={edu.id} className="px-4 py-4 sm:px-6">
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-blue-400">
                                                            {edu.degree} in {edu.field}
                                                        </p>
                                                        <p className="mt-1 text-sm text-gray-300">{edu.institution}</p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {new Date(edu.startDate).toLocaleDateString()} - {new Date(edu.endDate).toLocaleDateString()}
                                                            {edu.gpa && ` • GPA: ${edu.gpa}`}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-5 sm:px-6 text-center">
                                            <p className="text-sm text-gray-400">No education information added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Work Experience section */}
                            <div className={getCardClasses()}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Work Experience</h2>
                                        <p className="mt-1 text-sm text-gray-400">Your professional experience</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Edit Experience
                                    </button>
                                </div>
                                <div className="border-t border-gray-600">
                                    {profile?.workExperience && profile.workExperience.length > 0 ? (
                                        <ul className="divide-y divide-gray-600">
                                            {profile.workExperience.map((exp) => (
                                                <li key={exp.id} className="px-4 py-4 sm:px-6">
                                                    <div className="flex flex-col">
                                                        <p className="text-sm font-medium text-blue-400">{exp.position}</p>
                                                        <p className="mt-1 text-sm text-gray-300">{exp.company}</p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {new Date(exp.startDate).toLocaleDateString()} - {new Date(exp.endDate).toLocaleDateString()}
                                                        </p>
                                                        <ul className="mt-2 text-sm text-gray-300 list-disc list-inside">
                                                            {exp.description.map((bullet, index) => (
                                                                <li key={index}>{bullet}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-5 sm:px-6 text-center">
                                            <p className="text-sm text-gray-400">No work experience added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Skills section */}
                            <div className={getCardClasses()}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Skills</h2>
                                        <p className="mt-1 text-sm text-gray-400">Your technical and soft skills</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Edit Skills
                                    </button>
                                </div>
                                <div className="border-t border-gray-600 px-4 py-5 sm:p-6">
                                    {profile?.skills && profile.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill) => (
                                                <span key={skill.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                                    {skill.name}
                                                    {skill.level && (
                                                        <span className="ml-1 text-xs text-blue-400">
                                                            ({skill.level})
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-sm text-gray-400">No skills added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Projects section */}
                            <div className={getCardClasses()}>
                                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-medium text-white">Projects</h2>
                                        <p className="mt-1 text-sm text-gray-400">Your personal and academic projects</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile/setup')}
                                        className={getButtonClasses('secondary')}
                                    >
                                        Edit Projects
                                    </button>
                                </div>
                                <div className="border-t border-gray-600">
                                    {profile?.projects && profile.projects.length > 0 ? (
                                        <ul className="divide-y divide-gray-600">
                                            {profile.projects.map((project) => (
                                                <li key={project.id} className="px-4 py-4 sm:px-6">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center">
                                                            <p className="text-sm font-medium text-blue-400">{project.name}</p>
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
                                                        <ul className="mt-2 text-sm text-gray-300 list-disc list-inside">
                                                            {project.description.map((bullet, index) => (
                                                                <li key={index}>{bullet}</li>
                                                            ))}
                                                        </ul>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {project.technologies.map((tech, index) => (
                                                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-5 sm:px-6 text-center">
                                            <p className="text-sm text-gray-400">No projects added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}