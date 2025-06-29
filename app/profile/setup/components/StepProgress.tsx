'use client'

import React from 'react';

interface Step {
    label: string;
}

interface StepProgressProps {
    steps: Step[];
    activeStep: number;
    onStepClick: (step: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
    steps,
    activeStep,
    onStepClick
}) => {
    return (
        <div className="mb-8">
            <nav aria-label="Progress">
                <ol className="flex items-center">
                    {steps.map((step, stepIdx) => (
                        <li key={step.label} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                            {activeStep > stepIdx ? (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-blue-600" />
                                    </div>
                                    <button
                                        onClick={() => onStepClick(stepIdx)}
                                        className="relative w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700"
                                    >
                                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="sr-only">{step.label}</span>
                                    </button>
                                </>
                            ) : activeStep === stepIdx ? (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-gray-600" />
                                    </div>
                                    <button
                                        onClick={() => { }}
                                        className="relative w-8 h-8 flex items-center justify-center bg-gray-800 border-2 border-blue-600 rounded-full"
                                        aria-current="step"
                                    >
                                        <span className="h-2.5 w-2.5 bg-blue-600 rounded-full" aria-hidden="true" />
                                        <span className="sr-only">{step.label}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-gray-600" />
                                    </div>
                                    <button
                                        onClick={() => onStepClick(stepIdx)}
                                        className="group relative w-8 h-8 flex items-center justify-center bg-gray-800 border-2 border-gray-600 rounded-full hover:border-gray-500"
                                    >
                                        <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-600" aria-hidden="true" />
                                        <span className="sr-only">{step.label}</span>
                                    </button>
                                </>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
};