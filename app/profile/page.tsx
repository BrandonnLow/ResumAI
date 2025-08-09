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
    const [originalSummary, setOriginalSummary] = useState('');
    const [showComparison, setShowComparison] = useState(false);
    const [changedFields, setChangedFields] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchProfile = async () => {
            if (!currentUser) return;
            try {
                setLoading(true);
                const userProfile = await getUserProfile(currentUser.uid);
                if (!userProfile) return router.push('/profile/setup');
                setProfile(userProfile);
                setFormData(userProfile);
            } catch (error) {
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser, router]);

    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !profile) return; 
        
        try {
            setUpdating(true);
            await updateUserProfile({ ...formData, uid: currentUser.uid });
            setProfile(prev => prev ? { ...prev, ...formData } : null);
            toast.success('Profile updated!');
            setShowComparison(false);
            setChangedFields([]); //clear all prev stuff
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    
    const enhanceProfile = async () => {
        if (!profile) return;
        
        try {
            setBeautifying(true);
            toast.loading('Enhancing with AI...');
            setOriginalSummary(formData.summary || '');

            const enhanced = await beautifyProfile(profile);
            const changed = Object.keys(enhanced).filter(key => 
                JSON.stringify(enhanced[key as keyof UserProfile]) !== 
                JSON.stringify(profile[key as keyof UserProfile])
            );

            setChangedFields(changed);
            setFormData(prev => ({ ...prev, ...enhanced }));
            toast.dismiss();

            if (changed.length > 0) {
                toast.success('Profile enhanced!');
                if (changed.includes('summary')) setShowComparison(true);
            } else {
                toast.success('Profile looks great already!');
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Enhancement failed');
        } finally {
            setBeautifying(false);
        }
    };

    
    const ProfileSection = ({ title, description, items, editPath }: {
        title: string;
        description: string;
        items: any[];
        editPath: string;
    }) => (
        <div className={getCardClasses()}>
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-white">{title}</h2>
                    <p className="mt-1 text-sm text-gray-400">{description}</p>
                </div>
                <button
                    onClick={() => router.push(editPath)}
                    className={getButtonClasses('secondary')}
                >
                    Edit {title}
                </button>
            </div>
            <div className="border-t border-gray-600">
                {items?.length > 0 ? (
                    <div className="px-4 py-5">
                        {title === 'Skills' ? (
                            <div className="flex flex-wrap gap-2">
                                {items.map((skill) => (
                                    <span key={skill.id} className="px-2.5 py-0.5 rounded-full text-xs bg-blue-900/20 text-blue-300 border border-blue-600/30">
                                        {skill.name} {skill.level && `(${skill.level})`}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-600">
                                {items.map((item, index) => (
                                    <li key={item.id || index} className="py-4">
                                        {title === 'Education' && (
                                            <div>
                                                <p className="text-sm font-medium text-blue-400">{item.degree} in {item.field}</p>
                                                <p className="text-sm text-gray-300">{item.institution}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                                    {item.gpa && ` • GPA: ${item.gpa}`}
                                                </p>
                                            </div>
                                        )}
                                        {title === 'Work Experience' && (
                                            <div>
                                                <p className="text-sm font-medium text-blue-400">{item.position}</p>
                                                <p className="text-sm text-gray-300">{item.company}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                                                </p>
                                                <ul className="mt-2 text-sm text-gray-300 list-disc list-inside">
                                                    {item.description.map((desc: string, i: number) => (
                                                        <li key={i}>{desc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {title === 'Projects' && (
                                            <div>
                                                <div className="flex items-center">
                                                    <p className="text-sm font-medium text-blue-400">{item.name}</p>
                                                    {item.link && (
                                                        <a href={item.link} target="_blank" className="ml-2 text-gray-400 hover:text-gray-300">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                                <ul className="mt-2 text-sm text-gray-300 list-disc list-inside">
                                                    {item.description.map((desc: string, i: number) => (
                                                        <li key={i}>{desc}</li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {item.technologies.map((tech: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div className="px-4 py-5 text-center">
                        <p className="text-sm text-gray-400">No {title.toLowerCase()} added yet.</p>
                    </div>
                )}
            </div>
        </div>
    );

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-2xl font-bold text-white mb-8">Your Profile</h1>

                    {/* Main Form */}
                    <div className={`${getCardClasses()} mb-8`}>
                        <form onSubmit={handleSubmit}>
                            <div className="px-4 py-5 sm:p-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                    {[
                                        { name: 'name', label: 'Full Name', type: 'text', required: true, cols: 3 },
                                        { name: 'email', label: 'Email', type: 'email', required: true, cols: 3 },
                                        { name: 'phone', label: 'Phone Number', type: 'tel', cols: 3 },
                                        { name: 'location', label: 'Location', type: 'text', cols: 3, placeholder: 'City, State, Country' }
                                    ].map(field => (
                                        <div key={field.name} className={`sm:col-span-${field.cols}`}>
                                            <label className="block text-sm font-medium text-gray-300">
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                id={field.name}
                                                value={formData[field.name as keyof UserProfile] as string || ''}
                                                onChange={handleChange}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                                style={changedFields.includes(field.name) ? { borderColor: '#3b82f6' } : {}}
                                            />
                                        </div>
                                    ))}

                                    <div className="sm:col-span-6">
                                        <label className="text-sm font-medium text-gray-300">
                                            Professional Summary
                                        </label>
                                        <textarea
                                            id="summary"
                                            name="summary"
                                            rows={4}
                                            value={formData.summary || ''}
                                            onChange={handleChange}
                                            className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                            style={changedFields.includes('summary') ? { borderColor: '#3b82f6' } : {}}
                                        />

                                        {showComparison && originalSummary && (
                                            <div className="mt-3 p-3 bg-gray-700 rounded-md border border-gray-600">
                                                <h4 className="text-xs font-medium text-gray-300 mb-2">Changes:</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">Before:</p>
                                                        <p className="text-xs text-gray-300 bg-gray-800 p-2 rounded">{originalSummary}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">After:</p>
                                                        <p className="text-xs text-gray-300 bg-gray-800 p-2 rounded border border-blue-600">{formData.summary}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowComparison(false)}
                                                    className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-300">
                                            Additional Information
                                        </label>
                                        <textarea
                                            name="additionalInfo"
                                            rows={4}
                                            value={formData.additionalInfo || ''}
                                            onChange={handleChange}
                                            className={`${getInputClasses()} block w-full sm:text-sm rounded-md mt-1`}
                                            style={changedFields.includes('additionalInfo') ? { borderColor: '#3b82f6' } : {}}
                                        />
                                    </div>
                                </div>

                                {/* AI Enhancement */}
                                <div className="mt-6 bg-blue-900/10 border border-blue-600/30 p-5 rounded-lg">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-blue-200 mb-2">
                                                Enhance Your Profile with AI
                                            </h3>
                                            <p className="text-sm text-blue-300 mb-3">
                                                Instantly improve your profile with AI that enhances vocabulary, keywords, and professional language.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={enhanceProfile}
                                            disabled={beautifying}
                                            className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white rounded-md disabled:opacity-50"
                                        >
                                            {beautifying ? 'Enhancing...' : 'Enhance with AI'}
                                        </button>
                                    </div>

                                    {changedFields.length > 0 && (
                                        <div className="mt-3 bg-gray-800/70 p-3 rounded-md">
                                            <p className="text-sm text-blue-300">
                                                Enhancement applied!
                                                {!showComparison && changedFields.includes('summary') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowComparison(true)}
                                                        className="ml-2 text-blue-400 hover:text-blue-300 underline"
                                                    >
                                                        View changes
                                                    </button>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form stuff */}
                            <div className="px-4 py-3 bg-gray-800 text-right border-t border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => router.push('/profile/setup')}
                                    className={getButtonClasses('secondary')}
                                >
                                    Edit Profile
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className={`ml-3 px-4 py-2 rounded-md text-white ${
                                        changedFields.length > 0 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    } disabled:opacity-50`}
                                >
                                    {updating ? 'Saving...' : changedFields.length > 0 ? 'Save Enhanced Profile' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <ProfileSection 
                            title="Education" 
                            description="Your academic background"
                            items={profile?.education || []}
                            editPath="/profile/setup"
                        />
                        <ProfileSection 
                            title="Work Experience" 
                            description="Your professional experience"
                            items={profile?.workExperience || []}
                            editPath="/profile/setup"
                        />
                        <ProfileSection 
                            title="Skills" 
                            description="Your technical and soft skills"
                            items={profile?.skills || []}
                            editPath="/profile/setup"
                        />
                        <ProfileSection 
                            title="Projects" 
                            description="Your personal and academic projects"
                            items={profile?.projects || []}
                            editPath="/profile/setup"
                        />
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}