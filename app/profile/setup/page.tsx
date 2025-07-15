'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '../../ui/components/PrivateRoute';
import PageWrapper from '../../ui/components/PageWrapper';
import { LoadingPage } from '../../ui/components/Loading';
import { useProfileSetup } from './hooks/useProfileSetup';
import { StepProgress } from './components/StepProgress';
import { BasicInfoStep } from './components/BasicInfoStep';
import { AdditionalInfoStep } from './components/AdditionalInfoStep';
import { ReviewStep } from './components/ReviewStep';

import EducationForm from '../../ui/components/profile/forms/EducationForm';
import WorkExperienceForm from '../../ui/components/profile/forms/WorkExperienceForm';
import ProjectForm from '../../ui/components/profile/forms/ProjectForm';
import SkillForm from '../../ui/components/profile/forms/SkillForm';
import ExtracurricularForm from '../../ui/components/profile/forms/ExtracurricularForm';

export default function ProfileSetup() {
    const router = useRouter();
    const {
        // State
        activeStep,
        loading,
        processingResume,
        isEditMode,
        debugInfo,
        profile,

        // Navigation
        handleNext,
        handleBack,
        setStep,

        // Form handlers
        handleInputChange,
        handleResumeUpload,
        handleBeautifyProfile,
        handleSubmitProfile,

        // Education handlers
        addEducation,
        updateEducation,
        removeEducation,

        // Work experience handlers
        addWorkExperience,
        updateWorkExperience,
        removeWorkExperience,

        // Project handlers
        addProject,
        updateProject,
        removeProject,

        // Skill handlers
        addSkill,
        updateSkill,
        removeSkill,

        // Extracurricular handlers
        addExtracurricular,
        updateExtracurricular,
        removeExtracurricular
    } = useProfileSetup();

    const steps = [
        {
            label: 'Upload Resume or Enter Basic Info',
            content: (
                <BasicInfoStep
                    profile={profile}
                    processingResume={processingResume}
                    debugInfo={debugInfo}
                    onInputChange={handleInputChange}
                    onResumeUpload={handleResumeUpload}
                />
            )
        },
        {
            label: 'Education',
            content: (
                <EducationForm
                    education={profile.education || []}
                    onAdd={addEducation}
                    onUpdate={updateEducation}
                    onRemove={removeEducation}
                />
            )
        },
        {
            label: 'Work Experience',
            content: (
                <WorkExperienceForm
                    experiences={profile.workExperience || []}
                    onAdd={addWorkExperience}
                    onUpdate={updateWorkExperience}
                    onRemove={removeWorkExperience}
                />
            )
        },
        {
            label: 'Projects',
            content: (
                <ProjectForm
                    projects={profile.projects || []}
                    onAdd={addProject}
                    onUpdate={updateProject}
                    onRemove={removeProject}
                />
            )
        },
        {
            label: 'Skills',
            content: (
                <SkillForm
                    skills={profile.skills || []}
                    onAdd={addSkill}
                    onUpdate={updateSkill}
                    onRemove={removeSkill}
                />
            )
        },
        {
            label: 'Extracurriculars',
            content: (
                <ExtracurricularForm
                    extracurriculars={profile.extracurriculars || []}
                    onAdd={addExtracurricular}
                    onUpdate={updateExtracurricular}
                    onRemove={removeExtracurricular}
                />
            )
        },
        {
            label: 'Additional Information',
            content: (
                <AdditionalInfoStep
                    profile={profile}
                    loading={loading}
                    onInputChange={handleInputChange}
                    onBeautifyProfile={handleBeautifyProfile}
                />
            )
        },
        {
            label: 'Review & Submit',
            content: (
                <ReviewStep
                    profile={profile}
                    isEditMode={isEditMode}
                />
            )
        }
    ];

    const handleSubmitAndNavigate = async () => {
        const success = await handleSubmitProfile();
        if (success) {
            router.push('/dashboard');
        }
    };

    if (loading && !profile.name) {
        return (
            <PrivateRoute>
                <LoadingPage text="Loading ..." />
            </PrivateRoute>
        );
    }

    return (
        <PrivateRoute>
            <PageWrapper background="dark" className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
                            {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
                        </h1>
                        <p className="mt-3 text-xl text-gray-300">
                            {isEditMode
                                ? 'Update your information to get better tailored interview questions.'
                                : 'Help us understand your background to provide tailored interview questions.'}
                        </p>
                    </div>

                    <StepProgress
                        steps={steps}
                        activeStep={activeStep}
                        onStepClick={setStep}
                    />

                    {/* Step content */}
                    <div className="bg-gray-800 border border-gray-600 shadow rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-6">{steps[activeStep].label}</h2>
                        {steps[activeStep].content}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={activeStep === 0}
                            className={`${activeStep === 0 ? 'invisible' : ''
                                } inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            Back
                        </button>

                        {activeStep === steps.length - 1 ? (
                            <button
                                type="button"
                                onClick={handleSubmitAndNavigate}
                                disabled={loading}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform transition-all hover:scale-105"
                            >
                                {loading ? 'Submitting...' : isEditMode ? 'Update Profile' : '🎉 Complete Setup'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </PageWrapper>
        </PrivateRoute>
    );
}