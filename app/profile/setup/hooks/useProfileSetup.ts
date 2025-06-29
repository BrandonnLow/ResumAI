'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../../ui/Context/AuthContext';
import { parsePdfText } from '../../../utils/pdfParser';
import { extractResumeInfo, beautifyProfile } from '../../../Services/openai/functions';
import { createUserProfile, getUserProfile, updateUserProfile } from '../../../Services/firebase/firestore';
import { UserProfile, Education, WorkExperience, Project, Skill, Extracurricular } from '../../../types';
import toast from 'react-hot-toast';

export const useProfileSetup = () => {
    const { currentUser, refreshProfileStatus } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingResume, setProcessingResume] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalManualInputs, setOriginalManualInputs] = useState<Set<string>>(new Set());
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Profile state
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        uid: currentUser?.uid || '',
        name: '',
        email: currentUser?.email || '',
        phone: '',
        location: '',
        summary: '',
        education: [],
        workExperience: [],
        projects: [],
        skills: [],
        extracurriculars: [],
        additionalInfo: ''
    });

    // Fetch existing profile data when component mounts
    useEffect(() => {
        const fetchExistingProfile = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const existingProfile = await getUserProfile(currentUser.uid);

                if (existingProfile) {
                    setProfile(existingProfile);
                    setIsEditMode(true);
                    // Initialize all fields as manually entered since they're coming from saved profile
                    const manualFields = new Set<string>();
                    Object.keys(existingProfile).forEach(key => {
                        if (key !== 'uid' && key !== 'createdAt' && key !== 'updatedAt') {
                            manualFields.add(key);
                        }
                    });
                    setOriginalManualInputs(manualFields);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load your profile. Starting with a blank form.');
            } finally {
                setLoading(false);
            }
        };

        fetchExistingProfile();
    }, [currentUser]);

    // Track which fields have been manually edited
    const trackManualInput = (fieldName: string) => {
        setOriginalManualInputs(prev => {
            const updated = new Set(prev);
            updated.add(fieldName);
            return updated;
        });
    };

    // Resume upload handling
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        try {
            setProcessingResume(true);
            toast.loading('Processing your resume...');

            // Parse PDF to text
            const resumeText = await parsePdfText(file);
            console.log("Extracted resume text (first 200 chars):", resumeText.substring(0, 200));

            // Extract resume information using OpenAI
            const extractedInfo = await extractResumeInfo(resumeText);
            console.log("Extracted resume info:", extractedInfo);

            // Update profile state with extracted information, using improved logic
            setProfile(prev => {
                const updated = { ...prev };

                // For each field in extractedInfo, update if current value is empty
                Object.entries(extractedInfo).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) {
                            const currentArray = updated[key as keyof UserProfile] as any[] || [];
                            if (currentArray.length === 0 && value.length > 0) {
                                updated[key as keyof UserProfile] = value as any;
                            }
                        } else {
                            const currentValue = updated[key as keyof UserProfile];
                            if ((!currentValue || currentValue === '') && value) {
                                updated[key as keyof UserProfile] = value as any;
                            }
                        }
                    }
                });

                setDebugInfo({
                    extractedInfo,
                    resumeTextPreview: resumeText.substring(0, 500) + "...",
                });

                return updated;
            });

            toast.dismiss();
            toast.success('Resume processed successfully! Empty fields have been filled with resume data.');
        } catch (error) {
            console.error('Error processing resume:', error);
            toast.dismiss();
            toast.error('Failed to process resume. Please try again or enter details manually.');
        } finally {
            setProcessingResume(false);
        }
    };

    // Beautify profile
    const handleBeautifyProfile = async () => {
        try {
            setLoading(true);
            toast.loading('Enhancing your profile with AI...');

            // Store original values for comparison
            const originalSummary = profile.summary;

            const enhancedProfile = await beautifyProfile(profile as UserProfile);

            // Track which fields were enhanced
            const changedFields: string[] = [];
            Object.keys(enhancedProfile).forEach(key => {
                if (JSON.stringify(enhancedProfile[key as keyof UserProfile]) !==
                    JSON.stringify(profile[key as keyof UserProfile])) {
                    changedFields.push(key);
                }
            });

            setProfile(prev => ({
                ...prev,
                ...enhancedProfile
            }));

            toast.dismiss();

            if (changedFields.length > 0) {
                toast.success(`Profile enhanced! Improvements made to your ${changedFields.join(', ')}. These changes will be saved when you complete setup.`,
                    { duration: 5000 });

                // Apply visual highlights to changed fields
                setTimeout(() => {
                    changedFields.forEach(field => {
                        const elements = document.querySelectorAll(`[name="${field}"], #${field}`);
                        elements.forEach(element => {
                            if (element instanceof HTMLElement) {
                                element.style.borderColor = '#3b82f6';
                                element.style.backgroundColor = '#1e3a8a';
                                setTimeout(() => {
                                    element.style.backgroundColor = '';
                                    element.style.transition = 'background-color 1s ease-out';
                                }, 100);
                            }
                        });
                    });
                }, 500);
            } else {
                toast.success('Profile is already well-crafted! No significant improvements needed.');
            }
        } catch (error) {
            console.error('Error beautifying profile:', error);
            toast.dismiss();
            toast.error('Failed to enhance profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        trackManualInput(name);

        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Education handlers
    const addEducation = (education: Education) => {
        trackManualInput('education');
        setProfile(prev => ({
            ...prev,
            education: [...(prev.education || []), education]
        }));
    };

    const updateEducation = (index: number, education: Education) => {
        trackManualInput('education');
        setProfile(prev => {
            const updatedEducation = [...(prev.education || [])];
            updatedEducation[index] = education;
            return {
                ...prev,
                education: updatedEducation
            };
        });
    };

    const removeEducation = (index: number) => {
        trackManualInput('education');
        setProfile(prev => {
            const updatedEducation = [...(prev.education || [])];
            updatedEducation.splice(index, 1);
            return {
                ...prev,
                education: updatedEducation
            };
        });
    };

    const addWorkExperience = (experience: WorkExperience) => {
        trackManualInput('workExperience');
        setProfile(prev => ({
            ...prev,
            workExperience: [...(prev.workExperience || []), experience]
        }));
    };

    const updateWorkExperience = (index: number, experience: WorkExperience) => {
        trackManualInput('workExperience');
        setProfile(prev => {
            const updatedExperience = [...(prev.workExperience || [])];
            updatedExperience[index] = experience;
            return {
                ...prev,
                workExperience: updatedExperience
            };
        });
    };

    const removeWorkExperience = (index: number) => {
        trackManualInput('workExperience');
        setProfile(prev => {
            const updatedExperience = [...(prev.workExperience || [])];
            updatedExperience.splice(index, 1);
            return {
                ...prev,
                workExperience: updatedExperience
            };
        });
    };

    const addProject = (project: Project) => {
        trackManualInput('projects');
        setProfile(prev => ({
            ...prev,
            projects: [...(prev.projects || []), project]
        }));
    };

    const updateProject = (index: number, project: Project) => {
        trackManualInput('projects');
        setProfile(prev => {
            const updatedProjects = [...(prev.projects || [])];
            updatedProjects[index] = project;
            return {
                ...prev,
                projects: updatedProjects
            };
        });
    };

    const removeProject = (index: number) => {
        trackManualInput('projects');
        setProfile(prev => {
            const updatedProjects = [...(prev.projects || [])];
            updatedProjects.splice(index, 1);
            return {
                ...prev,
                projects: updatedProjects
            };
        });
    };

    const addSkill = (skill: Skill) => {
        trackManualInput('skills');
        setProfile(prev => ({
            ...prev,
            skills: [...(prev.skills || []), skill]
        }));
    };

    const updateSkill = (index: number, skill: Skill) => {
        trackManualInput('skills');
        setProfile(prev => {
            const updatedSkills = [...(prev.skills || [])];
            updatedSkills[index] = skill;
            return {
                ...prev,
                skills: updatedSkills
            };
        });
    };

    const removeSkill = (index: number) => {
        trackManualInput('skills');
        setProfile(prev => {
            const updatedSkills = [...(prev.skills || [])];
            updatedSkills.splice(index, 1);
            return {
                ...prev,
                skills: updatedSkills
            };
        });
    };

    const addExtracurricular = (extracurricular: Extracurricular) => {
        trackManualInput('extracurriculars');
        setProfile(prev => ({
            ...prev,
            extracurriculars: [...(prev.extracurriculars || []), extracurricular]
        }));
    };

    const updateExtracurricular = (index: number, extracurricular: Extracurricular) => {
        trackManualInput('extracurriculars');
        setProfile(prev => {
            const updatedExtracurriculars = [...(prev.extracurriculars || [])];
            updatedExtracurriculars[index] = extracurricular;
            return {
                ...prev,
                extracurriculars: updatedExtracurriculars
            };
        });
    };

    const removeExtracurricular = (index: number) => {
        trackManualInput('extracurriculars');
        setProfile(prev => {
            const updatedExtracurriculars = [...(prev.extracurriculars || [])];
            updatedExtracurriculars.splice(index, 1);
            return {
                ...prev,
                extracurriculars: updatedExtracurriculars
            };
        });
    };

    // Submit profile
    const handleSubmitProfile = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!profile.name || !profile.email) {
                toast.error('Please fill in your name and email');
                return;
            }

            if (isEditMode) {
                // Update existing profile
                await updateUserProfile(profile as UserProfile);
                toast.success('Profile updated successfully!');
            } else {
                // Create new profile
                await createUserProfile(profile as UserProfile);
                toast.success('Profile created successfully! Welcome to resumAI!');
            }

            // Refresh the profile status in auth context
            await refreshProfileStatus();

            return true; // Success
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} profile. Please try again.`);
            return false; // Failure
        } finally {
            setLoading(false);
        }
    };

    // Step navigation
    const handleNext = () => {
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const setStep = (step: number) => {
        setActiveStep(step);
    };

    return {
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
    };
};