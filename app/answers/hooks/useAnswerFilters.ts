'use client'

import { useState, useEffect } from 'react';
import { Answer, Job, QuestionCategory } from '../../types';

export const useAnswerFilters = (answers: Answer[]) => {
    const [filteredAnswers, setFilteredAnswers] = useState<Answer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
    const [selectedJob, setSelectedJob] = useState<string>('All');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Filter answers based on search term, category, job, tags, and favorites
    useEffect(() => {
        let filtered = answers;

        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(answer =>
                answer.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                answer.answerText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (answer.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(answer => answer.category === selectedCategory);
        }

        // Filter by job
        if (selectedJob !== 'All') {
            filtered = filtered.filter(answer =>
                selectedJob === '' ? !answer.jobId : answer.jobId === selectedJob
            );
        }

        // Filter by tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(answer =>
                selectedTags.every(tag => (answer.tags || []).includes(tag))
            );
        }

        // Filter by favorites
        if (showFavoritesOnly) {
            filtered = filtered.filter(answer => answer.isFavorite);
        }

        setFilteredAnswers(filtered);
    }, [answers, searchTerm, selectedCategory, selectedJob, selectedTags, showFavoritesOnly]);

    // Toggle tag filter
    const toggleTagFilter = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    // Quick filter handlers with proper state sync
    const handleQuickFavorites = () => {
        setShowFavoritesOnly(!showFavoritesOnly);
    };

    const handleQuickCategoryFilter = (category: QuestionCategory) => {
        setSelectedCategory(selectedCategory === category ? 'All' : category);
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setSelectedJob('All');
        setSelectedTags([]);
        setShowFavoritesOnly(false);
    };

    // Get all unique tags from answers
    const getAllTags = () => {
        const allTags = new Set<string>();
        answers.forEach(answer => {
            if (answer.tags && Array.isArray(answer.tags)) {
                answer.tags.forEach(tag => allTags.add(tag));
            }
        });
        return Array.from(allTags).sort();
    };

    return {
        filteredAnswers,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedJob,
        setSelectedJob,
        selectedTags,
        showFavoritesOnly,
        toggleTagFilter,
        handleQuickFavorites,
        handleQuickCategoryFilter,
        clearAllFilters,
        getAllTags
    };
};