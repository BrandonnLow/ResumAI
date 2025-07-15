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

            setProfile({
                "name": "TAN PENG KIANG",
                "email": "sample@u.nus.edu",
                "phone": "8187 7303",
                "location": "",
                "summary": "",
                "education": [
                    {
                    "id": "da796a0c",
                    "field": "Computing in Information Systems",
                    "degree": "Bachelor",
                    "institution": "National University of Singapore",
                    "startDate": "2024-08-01",
                    "endDate": "2028-05-01"
                    }
                ],
                "workExperience": [],
                "projects": [
                    {
                    "id": "566e12a5",
                    "name": "Helper Bot for Mental Health Support",
                    "link": "https://github.com",
                    "description": [
                        "Hugging Face API Calling with Simple User Interface (UI)."
                    ],
                    "technologies": []
                    },
                    {
                    "id": "bdceafca",
                    "name": "Tech Stock Market Prediction",
                    "link": "https://github.com",
                    "description": [
                        "Temporal Fusion Transformer, Quantile Regression DQN and Classification Models for NLP."
                    ],
                    "technologies": []
                    },
                    {
                    "id": "c58e695b",
                    "name": "Art E-Commerce Website with Payment & Chat Functions",
                    "link": "https://sampleFakeUrl",
                    "description": [
                        "Supabase for relational database, with Stripe (payment) and GetStream (chat) API."
                    ],
                    "technologies": []
                    },
                    {
                    "id": "38111ee4",
                    "name": "Student Result Predictor",
                    "link": "https://sampleFakeUrl",
                    "description": [
                        "Utilized PyTorch, Flask & Kaggle."
                    ],
                    "technologies": []
                    }
                ],
                "skills": [
                    {
                    "id": "572c1d81",
                    "name": "Python"
                    },
                    {
                    "id": "085df40a",
                    "name": "Java"
                    },
                    {
                    "id": "12c5fcf5",
                    "name": "JavaScript"
                    },
                    {
                    "id": "c9907f48",
                    "name": "R"
                    },
                    {
                    "id": "a69b54a9",
                    "name": "CSS"
                    },
                    {
                    "id": "3db48878",
                    "name": "VBA"
                    },
                    {
                    "id": "e5b5876c",
                    "name": "Pandas"
                    },
                    {
                    "id": "57ce212f",
                    "name": "Scikit"
                    },
                    {
                    "id": "fcdaf41a",
                    "name": "PyTorch"
                    },
                    {
                    "id": "8d76c060",
                    "name": "MatPlotLib"
                    },
                    {
                    "id": "89e60220",
                    "name": "NextJS"
                    },
                    {
                    "id": "4fa67761",
                    "name": "React"
                    },
                    {
                    "id": "addc24d1",
                    "name": "Tailwind"
                    },
                    {
                    "id": "4418695c",
                    "name": "English"
                    },
                    {
                    "id": "7fc1330c",
                    "name": "Chinese"
                    }
                ],
                "extracurriculars": [
                    {
                    "id": "9d4194f6",
                    "name": "NUS College, House Captain",
                    "startDate": "2024-08-01",
                    "endDate": "",
                    "description": "Organized and coordinated house-events, bonding activities to enhance student engagement and foster sense of belonging among residents. Spear-headed recruitment process for the orientation program and Inter-House Games. Actively involved in logistical procedures not limited to budgeting, claim reimbursement matters."
                    },
                    {
                    "id": "8b0a75d6",
                    "name": "NUS Kayaking, Administration Executive",
                    "startDate": "2024-08-01",
                    "endDate": "",
                    "description": "Liaised with participants to confirm registration, provide event details and ensure timely payments of participation fees. Maintained accurate records of participant details, certifications and payment status while ensuring compliance with PDPA regulations. Acted as key point of contact between club and participants and external stakeholders."
                    }
                ],
                "additionalInfo": ""
            })
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