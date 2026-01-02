import React, { useState } from 'react';
import { WhiteLabelModal } from './WhiteLabelModal';
import { AuditInput } from '../types';

interface URLInputFormProps {
  onAnalyze: (inputs: AuditInput[]) => void;
  isLoading: boolean;
  whiteLabelLogo: string | null;
  onWhiteLabelLogoChange: (logo: string | null) => void;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({
  onAnalyze,
  isLoading,
  whiteLabelLogo,
  onWhiteLabelLogoChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirmed list of audits to run
  const [queue, setQueue] = useState<AuditInput[]>([]);

  // Current Input State
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [isScreenshotExpanded, setIsScreenshotExpanded] = useState(false);

  const MAX_INPUTS = 5;

  // --- Queue Management ---

  const addToQueue = () => {
    // Validate: Needs URL OR Files
    const hasUrl = currentUrl && currentUrl.trim().length > 0;
    const hasFiles = currentFiles.length > 0;

    if (!hasUrl && !hasFiles) return;

    const newInput: AuditInput = {
      id: crypto.randomUUID(),
      type: hasUrl ? 'url' : 'upload',
      url: currentUrl,
      files: currentFiles,
      file: currentFiles[0] // Fallback
    };

    setQueue(prev => [...prev, newInput]);

    // Clear Input
    setCurrentUrl('');
    setCurrentFiles([]);
    setIsScreenshotExpanded(false);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  // --- Handlers ---

  const handleFileChange = (newFiles: FileList | null) => {
    if (newFiles && newFiles.length > 0) {
      setCurrentFiles(prev => [...prev, ...Array.from(newFiles)]);
    }
  };

  const removeCurrentFile = (index: number) => {
    setCurrentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Combine Queue + Current Input (if valid)
    const validInputs: AuditInput[] = [...queue];

    const hasUrl = currentUrl && currentUrl.trim().length > 0;
    const hasFiles = currentFiles.length > 0;

    if (hasUrl || hasFiles) {
      if (queue.length < MAX_INPUTS) {
        validInputs.push({
          id: 'current',
          type: hasUrl ? 'url' : 'upload',
          url: currentUrl,
          files: currentFiles,
          file: currentFiles[0]
        });
      }
    }

    if (validInputs.length > 0) {
      onAnalyze(validInputs);
    }
  };

  const handleSaveLogo = (logoData: string) => {
    onWhiteLabelLogoChange(logoData || null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 space-y-6">

          {/* 1. Queue List (Added Items) */}
          {queue.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audits to Run ({queue.length})</h3>
              <div className="grid gap-2">
                {queue.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {item.url || 'Manual Upload'}
                        </p>
                        {item.files && item.files.length > 0 && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm4.03 3.03a.75.75 0 00-1.06-1.06l-2.25 2.25a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06l-.97-.97h6.19a.75.75 0 00.53-.22l.97-.97a.75.75 0 00-1.06-1.06l-.44.44H5.97l.97-.97zM17.22 8.28a.75.75 0 00-1.06-1.06l-2.25 2.25a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06l-.97-.97h-2.19a.75.75 0 00-.53-.22l-.97-.97a.75.75 0 001.06-1.06l2.25-2.25z" clipRule="evenodd" />
                            </svg>
                            {item.files.length} Screenshot{item.files.length !== 1 ? 's' : ''} attached
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Single Input Form */}
          {queue.length < MAX_INPUTS && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 relative group">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.916 17.916 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {/* URL Field */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {queue.length > 0 ? 'Add Another Website URL' : 'Website URL'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={currentUrl}
                        onChange={(e) => setCurrentUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-500 text-sm shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={addToQueue}
                        disabled={(!currentUrl && currentFiles.length === 0) || queue.length >= MAX_INPUTS}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Screenshot Toggle & Area */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsScreenshotExpanded(!isScreenshotExpanded)}
                      className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      {isScreenshotExpanded ? 'Hide Screenshot Upload' : 'Need to add screenshots?'}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${isScreenshotExpanded ? 'rotate-180' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {isScreenshotExpanded && (
                      <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileChange(e.target.files)}
                          className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors"
                        />
                        {/* Current File List */}
                        {currentFiles.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {currentFiles.map((file, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-indigo-700 bg-white/50 p-1 rounded border border-indigo-100">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                                <button type="button" onClick={() => removeCurrentFile(i)} className="text-slate-400 hover:text-red-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-indigo-500 mt-1">* Adds to current item</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-slate-100">
            {/* White Label */}
            <div>
              {whiteLabelLogo ? (
                <div className="relative group cursor-pointer inline-block" onClick={() => setIsModalOpen(true)}>
                  <div className="h-9 px-3 bg-slate-100 rounded-lg flex items-center border border-indigo-100 hover:border-indigo-300 transition-colors">
                    <img src={whiteLabelLogo} alt="Custom Logo" className="h-6 w-auto object-contain max-w-[100px]" />
                    <div className="ml-2 pl-2 border-l border-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-500"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  White Label
                </button>
              )}
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              disabled={isLoading || (queue.length === 0 && !currentUrl && currentFiles.length === 0)}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md shadow-indigo-100"
            >
              {isLoading ? 'Analyzing...' : queue.length > 0 ? `Run Audit (${queue.length + ((currentUrl || currentFiles.length > 0) ? 1 : 0)})` : 'Run Audit'}
            </button>
          </div>

        </form>
      </div>

      <WhiteLabelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLogo}
        initialLogo={whiteLabelLogo}
      />
    </>
  );
};
