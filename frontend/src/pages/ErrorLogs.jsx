import React, { useState, useEffect } from 'react';
import { CLUB_CONFIG } from '@/components/ClubConfig';
import { Button } from "@/components/ui/button";
import { Download, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { getErrorLogs, clearErrorLogs, exportErrorLogs } from '@/components/utils/ErrorHandler';
import { getLogs, clearLogs, exportLogs } from '@/components/utils/Logger';

const colors = CLUB_CONFIG.theme?.colors || {};

export default function ErrorLogs() {
  const [errorLogs, setErrorLogs] = useState([]);
  const [appLogs, setAppLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('errors');

  const loadLogs = () => {
    setErrorLogs(getErrorLogs());
    setAppLogs(getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearErrors = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      clearErrorLogs();
      loadLogs();
    }
  };

  const handleClearAppLogs = () => {
    if (confirm('Are you sure you want to clear all application logs?')) {
      clearLogs();
      loadLogs();
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            System Logs
          </h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            View and export application and error logs for debugging
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('errors')}
            variant={activeTab === 'errors' ? 'default' : 'outline'}
            style={activeTab === 'errors' ? {
              backgroundColor: colors.danger,
              color: '#fff'
            } : {}}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Errors ({errorLogs.length})
          </Button>
          <Button
            onClick={() => setActiveTab('app')}
            variant={activeTab === 'app' ? 'default' : 'outline'}
            style={activeTab === 'app' ? {
              backgroundColor: colors.accent,
              color: '#000'
            } : {}}
          >
            Application Logs ({appLogs.length})
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={activeTab === 'errors' ? exportErrorLogs : exportLogs}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button 
            onClick={activeTab === 'errors' ? handleClearErrors : handleClearAppLogs}
            variant="outline"
            style={{ color: colors.danger }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        {/* Error Logs */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            {errorLogs.length === 0 ? (
              <div 
                className="p-8 rounded-xl text-center"
                style={{ 
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`
                }}
              >
                <p style={{ color: colors.textSecondary }}>No error logs found</p>
              </div>
            ) : (
              errorLogs.map((log, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl"
                  style={{ 
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.dangerLight}`
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: colors.dangerLight,
                            color: colors.danger
                          }}
                        >
                          {log.context?.category || 'UNKNOWN'}
                        </span>
                        <span className="text-xs" style={{ color: colors.textMuted }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                  
                  {log.context && (
                    <div 
                      className="mt-3 p-3 rounded text-xs overflow-x-auto"
                      style={{ 
                        backgroundColor: colors.background,
                        color: colors.textSecondary
                      }}
                    >
                      <pre>{JSON.stringify(log.context, null, 2)}</pre>
                    </div>
                  )}

                  {log.stack && (
                    <details className="mt-2">
                      <summary 
                        className="text-xs cursor-pointer"
                        style={{ color: colors.textSecondary }}
                      >
                        Stack Trace
                      </summary>
                      <pre 
                        className="mt-2 p-3 rounded text-xs overflow-x-auto"
                        style={{ 
                          backgroundColor: colors.background,
                          color: colors.textSecondary
                        }}
                      >
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* App Logs */}
        {activeTab === 'app' && (
          <div className="space-y-4">
            {appLogs.length === 0 ? (
              <div 
                className="p-8 rounded-xl text-center"
                style={{ 
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`
                }}
              >
                <p style={{ color: colors.textSecondary }}>No application logs found</p>
              </div>
            ) : (
              appLogs.map((log, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-xl"
                  style={{ 
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{ 
                        backgroundColor: 
                          log.level === 'ERROR' ? colors.dangerLight :
                          log.level === 'WARN' ? colors.warningLight :
                          log.level === 'INFO' ? colors.accentLight :
                          colors.surfaceHover,
                        color: 
                          log.level === 'ERROR' ? colors.danger :
                          log.level === 'WARN' ? colors.warning :
                          log.level === 'INFO' ? colors.accent :
                          colors.textSecondary
                      }}
                    >
                      {log.level}
                    </span>
                    <span 
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: colors.surfaceHover,
                        color: colors.textSecondary
                      }}
                    >
                      {log.category}
                    </span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm" style={{ color: colors.textPrimary }}>
                    {log.message}
                  </p>

                  {log.data && Object.keys(log.data).length > 0 && (
                    <details className="mt-2">
                      <summary 
                        className="text-xs cursor-pointer"
                        style={{ color: colors.textSecondary }}
                      >
                        Details
                      </summary>
                      <pre 
                        className="mt-2 p-3 rounded text-xs overflow-x-auto"
                        style={{ 
                          backgroundColor: colors.background,
                          color: colors.textSecondary
                        }}
                      >
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}