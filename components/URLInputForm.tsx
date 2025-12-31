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
  const [inputs, setInputs] = useState<AuditInput[]>([
    { id: '1', type: 'url', url: '' }
  ]);

  // Track which URL inputs have screenshot upload expanded
  const [expandedScreenshots, setExpandedScreenshots] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Collect all inputs with URL and/or screenshot
    const validInputs: AuditInput[] = [];

    inputs.forEach(input => {
      if (input.type === 'url' && input.url && input.url.trim().length > 0) {
        // Has URL
        if (input.file) {
          // Has both URL and screenshot - send both
          validInputs.push({ id: input.id, type: 'url', url: input.url });
          validInputs.push({ id: `${input.id}-upload`, type: 'upload', file: input.file });
        } else {
          // Only URL
          validInputs.push(input);
        }
      } else if (input.file) {
        // Only screenshot (no URL)
        validInputs.push({ id: input.id, type: 'upload', file: input.file });
      }
    });

    if (validInputs.length > 0) {
      onAnalyze(validInputs);
    }
  };

  const handleUrlChange = (id: string, value: string) => {
    setInputs(prev => prev.map(item =>
      item.id === id ? { ...item, url: value } : item
    ));
  };

  const handleFileChange = (id: string, file: File | null) => {
    if (file) {
      setInputs(prev => prev.map(item =>
        item.id === id ? { ...item, file } : item
      ));
    } else {
      // Remove file
      setInputs(prev => prev.map(item =>
        item.id === id ? { ...item, file: undefined } : item
      ));
    }
  };

  const toggleScreenshotUpload = (id: string) => {
    setExpandedScreenshots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        // Clear file when collapsing
        setInputs(prevInputs => prevInputs.map(item =>
          item.id === id ? { ...item, file: undefined } : item
        ));
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addUrlInput = () => {
    if (inputs.length < 5) {
      setInputs(prev => [...prev, { id: crypto.randomUUID(), type: 'url', url: '' }]);
    }
  };

  const removeInput = (id: string) => {
    if (inputs.length > 1) {
      setInputs(prev => prev.filter(item => item.id !== id));
      setExpandedScreenshots(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSaveLogo = (logoData: string) => {
    onWhiteLabelLogoChange(logoData || null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          <div className="space-y-4">
            {inputs.map((input, index) => (
              <div key={input.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 relative group">

                {/* Remove Button */}
                {inputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInput(input.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* URL Input */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.916 17.916 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={input.url}
                      onChange={(e) => handleUrlChange(input.id, e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-2 bg-white border border-slate-200 rounded focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Microcopy and Screenshot Toggle */}
                <div className="ml-[52px] space-y-2">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-indigo-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <span className="italic">Can't scrape? Also add screenshot of website</span>
                  </p>

                  {/* Toggle Screenshot Button */}
                  <button
                    type="button"
                    onClick={() => toggleScreenshotUpload(input.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    {expandedScreenshots.has(input.id) ? 'Hide Screenshot Upload' : 'Add Screenshot (Optional)'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform ${expandedScreenshots.has(input.id) ? 'rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Collapsible Screenshot Upload */}
                  {expandedScreenshots.has(input.id) && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2 transition-all duration-300 ease-in-out transform origin-top">
                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-indigo-900 mb-1">
                            Upload Full Page Screenshot
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(input.id, e.target.files?.[0] || null)}
                            className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors"
                          />
                          {input.file && (
                            <p className="mt-1 text-xs text-indigo-700 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                              {input.file.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="pt-2 border-t border-indigo-200 space-y-1 text-xs text-indigo-800">
                        <p className="flex items-start gap-1.5">
                          <span className="text-indigo-600 font-semibold">•</span>
                          <span>Both URL and screenshot will be audited together</span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="text-indigo-600 font-semibold">•</span>
                          <span>Helps when website can't be scraped automatically</span>
                        </p>
                        <p className="flex items-start gap-1.5">
                          <span className="text-indigo-600 font-semibold">•</span>
                          <span>Upload full-page screenshots for best results</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-6">

            {/* Primary Actions Row (Add URL, White Label, Run Audit) */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {inputs.length < 5 && (
                  <button
                    type="button"
                    onClick={addUrlInput}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    Add URL
                  </button>
                )}

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

              <button
                type="submit"
                disabled={isLoading || inputs.length === 0}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-md shadow-indigo-100"
              >
                {isLoading ? 'Analyzing...' : 'Run Audit'}
              </button>
            </div>

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
