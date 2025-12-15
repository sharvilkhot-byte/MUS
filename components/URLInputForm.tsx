
import React, { useState } from 'react';
import { WhiteLabelModal } from './WhiteLabelModal';

interface URLInputFormProps {
  urls: string[];
  onAnalyze: (urls: string[]) => void;
  onUrlsChange: (urls: string[]) => void;
  isLoading: boolean;
  whiteLabelLogo: string | null;
  onWhiteLabelLogoChange: (logo: string | null) => void;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({ 
    urls,
    onAnalyze, 
    onUrlsChange,
    isLoading,
    whiteLabelLogo,
    onWhiteLabelLogoChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.some(u => u) && !isLoading) {
      onAnalyze(urls);
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onUrlsChange(newUrls);
  };
  
  const addUrlInput = () => {
      if (urls.length < 5) {
          onUrlsChange([...urls, '']);
      }
  };

  const removeUrlInput = (index: number) => {
      if (urls.length > 1) {
          const newUrls = urls.filter((_, i) => i !== index);
          onUrlsChange(newUrls);
      }
  };

  const handleSaveLogo = (logoData: string) => {
      onWhiteLabelLogoChange(logoData || null);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl shadow-lg border border-slate-200 space-y-4">
      <div className="space-y-3">
        {urls.map((url, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <div className="flex-shrink-0 pl-2 hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.916 17.916 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              placeholder={index === 0 ? "https://your-homepage.com (Primary)" : "https://your-site.com/about"}
              required={index === 0}
              className="w-full flex-1 p-3 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
              aria-label={`Website URL ${index + 1}`}
            />
            {index > 0 && (
              <button 
                type="button" 
                onClick={() => removeUrlInput(index)}
                className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                aria-label={`Remove URL ${index + 1}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-end gap-4 pt-4 px-2">
          {/* Left Side: Add URL button and helper text */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start">
                  {urls.length < 5 && (
                      <button
                          type="button"
                          onClick={addUrlInput}
                          disabled={isLoading || urls.length >= 5}
                          className="px-4 py-2 text-sm bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                          Add URL
                      </button>
                  )}
                  
                  {whiteLabelLogo ? (
                      <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
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
                          className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          White Label
                      </button>
                  )}
              </div>
              <p className="mt-2 text-xs text-slate-500 text-center sm:text-left">
                  Enter up to 5 URLs. Add a custom logo to brand your report.
              </p>
          </div>
          
          {/* Right Side: Run Audit button */}
          <div className="w-full sm:w-auto">
              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-indigo-200"
              >
                  {isLoading ? 'Analyzing...' : 'Run Audit'}
              </button>
          </div>
      </div>
    </form>
    
    <WhiteLabelModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLogo}
        initialLogo={whiteLabelLogo}
    />
    </>
  );
};
