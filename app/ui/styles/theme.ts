export const theme = {
    colors: {
        background: {
            primary: 'bg-gray-700',    // Main page background
            secondary: 'bg-gray-800',  // Card backgrounds
            tertiary: 'bg-gray-600',   // Hover states
        },
        border: {
            primary: 'border-gray-600',
            secondary: 'border-gray-500',
            accent: 'border-blue-600/30',
        },
        text: {
            primary: 'text-white',
            secondary: 'text-gray-300',
            muted: 'text-gray-400',
            accent: 'text-blue-400',
        },
        input: {
            background: 'bg-gray-700',
            border: 'border-gray-600',
            focus: 'focus:ring-blue-500 focus:border-blue-500',
        },
        button: {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white',
            secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600',
            danger: 'bg-red-900/20 hover:bg-red-900/40 text-red-300',
        }
    },
    components: {
        card: 'bg-gray-800 border border-gray-600 rounded-lg shadow-lg',
        input: 'px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800',
        textarea: 'px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 resize-none',
        select: 'px-3 py-2 pr-8 bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800',
        button: {
            primary: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200',
            secondary: 'inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200',
            danger: 'inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-300 bg-red-900/20 hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200'
        }
    }
};

export const getCardClasses = () => theme.components.card;

export const getInputClasses = (type: 'input' | 'textarea' | 'select' = 'input') => {
    switch (type) {
        case 'textarea':
            return theme.components.textarea;
        case 'select':
            return theme.components.select;
        default:
            return theme.components.input;
    }
};

export const getButtonClasses = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => theme.components.button[variant];