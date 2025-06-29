'use client'

import React from 'react';
import { UserProfile } from '../../../types';
import { getInputClasses } from '../../../ui/styles/theme';

interface AdditionalInfoStepProps {
    profile: Partial<UserProfile>;
    loading: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBeautifyProfile: () => void;
}

export const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
    profile,
    loading,
    onInputChange,
    onBeautifyProfile
}) => {
    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-300">
                    Additional Information
                </label>
                <textarea
                    name="additionalInfo"
                    id="additionalInfo"
                    rows={6}
                    value={profile.additionalInfo || ''}
                    onChange={onInputChange}
                    className={`${getInputClasses('textarea')} mt-1 block w-full shadow-sm sm:text-sm border rounded-md`}
                    placeholder="Any other information you'd like to include (certifications, languages, interests, etc.)"
                />
            </div>

            <div className="bg-blue-900/20 border border-blue-600/30 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-200 mb-2">Beautify My Profile</h3>
                <p className="text-sm text-blue-300 mb-4">
                    Let our AI enhance your profile content with better phrasing, structure, and emphasis.
                    This can help polish your resume bullets and create LinkedIn-style summaries.
                </p>
                <button
                    type="button"
                    onClick={onBeautifyProfile}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Enhancing...' : 'Beautify My Profile'}
                </button>
            </div>
        </div>
    );
};