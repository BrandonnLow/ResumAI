'use client'

import React from 'react';
import { UserProfile } from '../../../types';
import { getInputClasses } from '../../../ui/styles/theme';

interface BasicInfoStepProps {
    profile: Partial<UserProfile>;
    processingResume: boolean;
    debugInfo: any;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    profile,
    processingResume,
    debugInfo,
    onInputChange,
    onResumeUpload
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-700 p-6 rounded-lg border border-blue-600/30">
                <h3 className="text-lg font-medium text-white mb-4">Upload Resume (PDF)</h3>
                <p className="text-sm text-gray-300 mb-4">
                    Upload your resume in PDF format and we'll automatically extract the information.
                    Any fields you've already filled in will be preserved, and empty fields will be populated with data from your resume.
                </p>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={onResumeUpload}
                    disabled={processingResume}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-900/20 file:text-blue-300 hover:file:bg-blue-900/40 file:border file:border-blue-600/30"
                />
                {processingResume && <p className="mt-2 text-sm text-blue-400">Processing your resume...</p>}

                {/* Debug info section */}
                {debugInfo && (
                    <div className="mt-4 p-3 bg-gray-600 rounded-md">
                        <details>
                            <summary className="text-xs font-medium text-gray-300 cursor-pointer">Resume Processing Details</summary>
                            <div className="mt-2 text-xs overflow-auto max-h-40">
                                <p className="font-semibold mt-1 text-gray-200">Fields extracted:</p>
                                <ul className="list-disc list-inside text-gray-300">
                                    {Object.keys(debugInfo.extractedInfo).map(key => (
                                        <li key={key}>
                                            {key}: {typeof debugInfo.extractedInfo[key] === 'object'
                                                ? (Array.isArray(debugInfo.extractedInfo[key])
                                                    ? `${debugInfo.extractedInfo[key].length} items`
                                                    : 'Object')
                                                : String(debugInfo.extractedInfo[key]).substring(0, 50)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </details>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                            Full Name*
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={profile.name || ''}
                            onChange={onInputChange}
                            required
                            className={`${getInputClasses()} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email*
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={profile.email || ''}
                            onChange={onInputChange}
                            required
                            className={`${getInputClasses()} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={profile.phone || ''}
                            onChange={onInputChange}
                            className={`${getInputClasses()} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                            Location
                        </label>
                        <input
                            type="text"
                            name="location"
                            id="location"
                            value={profile.location || ''}
                            onChange={onInputChange}
                            className={`${getInputClasses()} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                            placeholder="City, State/Province, Country"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="summary" className="block text-sm font-medium text-gray-300">
                        Professional Summary
                    </label>
                    <textarea
                        name="summary"
                        id="summary"
                        rows={4}
                        value={profile.summary || ''}
                        onChange={onInputChange}
                        className={`${getInputClasses('textarea')} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                        placeholder="Brief overview of your professional background and career goals"
                    />
                </div>
            </div>
        </div>
    );
};