import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import { periodOptions } from './utils';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = "Loading..."
}) => (
    <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-white">{message}</div>
            <div className="text-sm text-gray-400 mt-2">Please wait while we fetch your data</div>
        </div>
    </div>
);

interface ErrorDisplayProps {
    error: string;
    onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => (
    <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md text-center border border-gray-700">
            <div className="text-red-400 text-2xl font-bold mb-4">SYSTEM ERROR</div>
            <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={onRetry} variant="destructive" className="bg-red-900 hover:bg-red-800 text-white border border-red-700/50">
                Try Again
            </Button>
        </div>
    </div>
);

interface SuccessMessageProps {
    message: string;
    onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => (
    <div className="mb-6 bg-green-900/50 border border-green-700 rounded-lg p-4 text-green-300 flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="text-green-300 hover:text-white text-xl leading-none">×</button>
    </div>
);

interface PeriodSelectorProps {
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    loading?: boolean;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
    selectedPeriod,
    onPeriodChange,
    loading = false
}) => (
    <div className="mb-6 bg-gray-900/80 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-white font-medium">Sales Period:</span>
            <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                disabled={loading}
                className="w-64 bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 disabled:opacity-50"
            >
                {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    className?: string;
    badge?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    className = "",
    badge
}) => (
    <Card className={`shadow-xl border-0 text-white ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 opacity-80" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-sm mt-1 opacity-80">{description}</p>
            {badge && <div className="mt-3">{badge}</div>}
        </CardContent>
    </Card>
);

interface QuickStatProps {
    value: number;
    label: string;
    color: string;
}

export const QuickStat: React.FC<QuickStatProps> = ({ value, label, color }) => (
    <Card className="bg-gray-900/80 backdrop-blur-sm shadow-2xl border border-gray-700/50">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-semibold text-${color}-400`}>{label.toUpperCase()}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }> | React.ReactNode;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionText,
    onAction
}) => (
    <div className="text-center py-16 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-700/50">
        {/* This is the problematic part - fix the icon rendering */}
        {React.isValidElement(icon) ? (
            // If it's already a React element (JSX), render it directly
            <div className="mb-4 flex justify-center">{icon}</div>
        ) : typeof icon === 'function' ? (
            // If it's a component function, render it as JSX
            React.createElement(icon as React.ComponentType<{ className?: string }>, {
                className: "h-16 w-16 text-gray-600 mx-auto mb-4"
            })
        ) : (
            // For any other case, try to render as-is
            <div className="mb-4 flex justify-center">{icon}</div>
        )}
        <div className="text-xl font-semibold text-gray-400 mb-2">{title}</div>
        <div className="text-gray-500 mb-4">{description}</div>
        {actionText && onAction && (
            <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {actionText}
            </Button>
        )}
    </div>
);

interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    debugMode: boolean;
    onToggleDebug: () => void;
    onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title,
    subtitle,
    debugMode,
    onToggleDebug,
    onRefresh
}) => (
    <div className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                {title}
            </h1>
            <p className="text-gray-400 text-lg">{subtitle}</p>
        </div>
        <div className="flex gap-4">
            <Button
                onClick={onToggleDebug}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
                {debugMode ? 'Hide Debug' : 'Show Debug'}
            </Button>
            <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
            </Button>
        </div>
    </div>
);

interface DebugInfoProps {
    customerBreakdown: {
        totalUsers: number;
        adminUsers: number;
        customerUsers: number;
    };
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ customerBreakdown }) => (
    <div className="mb-6 bg-gray-900/80 border border-gray-700 rounded-lg p-4">
        <div className="text-green-400 font-semibold mb-2">Debug Information:</div>
        <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
                <span className="text-gray-400">Total Users: </span>
                <span className="text-white">{customerBreakdown.totalUsers}</span>
            </div>
            <div>
                <span className="text-gray-400">Admin Users: </span>
                <span className="text-white">{customerBreakdown.adminUsers}</span>
            </div>
            <div>
                <span className="text-gray-400">Customer Users: </span>
                <span className="text-white">{customerBreakdown.customerUsers}</span>
            </div>
        </div>
    </div>
);