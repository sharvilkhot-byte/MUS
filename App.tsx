
import React, { useState, useCallback, useEffect } from 'react';
import { URLInputForm } from './components/URLInputForm';
import { ReportDisplay } from './components/ReportDisplay';
// FIX: Import Screenshot type from types.ts to ensure consistency.
import { AnalysisReport, Screenshot } from './types';
import { analyzeWebsiteStream } from './services/geminiService';
import { Logo } from './components/Logo';
import { ProgressBar } from './components/ProgressBar';
import { LottieAnimation } from './components/LottieAnimation';

const loadingMicrocopy = [
  "Analyzing UX with 250+ parameters…",
  "Pixel checks in progress...",
  "Reading your interface…",
  "Decoding design decisions…",
];

const qrCodeAnimationData = {"v":"5.12.1","fr":29.9700012207031,"ip":0,"op":97.000003950891,"w":128,"h":128,"nm":"Qr_code_lottie","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"Layer 2 Outlines","parent":2,"sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[49,49,0],"ix":2,"l":2},"a":{"a":0,"k":[44.5,3.5,0],"ix":1,"l":2},"s":{"a":0,"k":[100,100,100],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":1,"k":[{"i":{"x":0.13,"y":1},"o":{"x":0.87,"y":0},"t":10,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[3.5,3.5],[85.5,3.5]],"c":false}]},{"i":{"x":0.13,"y":1},"o":{"x":0.87,"y":0},"t":25,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[14.75,3.5],[74.25,3.5]],"c":false}]},{"i":{"x":0.13,"y":1},"o":{"x":0.87,"y":0},"t":42,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[14.75,-26.25],[74.25,-26.25]],"c":false}]},{"i":{"x":0.13,"y":1},"o":{"x":0.87,"y":0},"t":62,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[14.75,32.25],[74.25,32.25]],"c":false}]},{"i":{"x":0.13,"y":1},"o":{"x":0.87,"y":0},"t":82,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[14.75,3.5],[74.25,3.5]],"c":false}]},{"t":92.0000037472368,"s":[{"i":[[0,0],[0,0]],"o":[[0,0],[0,0]],"v":[[3.5,3.5],[85.5,3.5]],"c":false}]}],"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0,0,0,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":7,"ix":5},"lc":2,"lj":1,"ml":4,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[0,0],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":300.00001221925,"st":0,"ct":1,"bm":0},{"ddd":0,"ind":2,"ty":4,"nm":"Layer 1 Outlines","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[63.5,64.5,0],"ix":2,"l":2},"a":{"a":0,"k":[48.5,48.5,0],"ix":1,"l":2},"s":{"a":1,"k":[{"i":{"x":[0.13,0.13,0.13],"y":[1,1,1]},"o":{"x":[0.87,0.87,0.87],"y":[0,0,0]},"t":10,"s":[100,100,100]},{"i":{"x":[0.13,0.13,0.13],"y":[1,1,1]},"o":{"x":[0.87,0.87,0.87],"y":[0,0,0]},"t":25,"s":[116,116,100]},{"i":{"x":[0.13,0.13,0.13],"y":[1,1,1]},"o":{"x":[0.87,0.87,0.87],"y":[0,0,0]},"t":42,"s":[110,110,100]},{"i":{"x":[0.13,0.13,0.13],"y":[1,1,1]},"o":{"x":[0.87,0.87,0.87],"y":[0,0,0]},"t":62,"s":[131,131,100]},{"i":{"x":[0.13,0.13,0.13],"y":[1,1,1]},"o":{"x":[0.87,0.87,0.87],"y":[0,0,0]},"t":82,"s":[110,110,100]},{"t":92.0000037472368,"s":[100,100,100]}],"ix":6,"l":2}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[-2.636,2.636],[-8.485,0],[0,0]],"o":[[0,0],[0,-8.485],[2.636,-2.636],[0,0],[0,0]],"v":[[-41.5,-20.75],[-41.5,-23.5],[-38.864,-38.864],[-23.5,-41.5],[-20.75,-41.5]],"c":false},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ind":1,"ty":"sh","ix":2,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[2.636,2.636],[0,8.485],[0,0]],"o":[[0,0],[-8.485,0],[-2.636,-2.636],[0,0],[0,0]],"v":[[-20.75,41.5],[-23.5,41.5],[-38.864,38.864],[-41.5,23.5],[-41.5,20.75]],"c":false},"ix":2},"nm":"Path 2","mn":"ADBE Vector Shape - Group","hd":false},{"ind":2,"ty":"sh","ix":3,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[2.636,2.636],[8.485,0],[0,0]],"o":[[0,0],[0,-8.485],[-2.636,-2.636],[0,0],[0,0]],"v":[[41.5,-20.75],[41.5,-23.5],[38.864,-38.864],[23.5,-41.5],[20.75,-41.5]],"c":false},"ix":2},"nm":"Path 3","mn":"ADBE Vector Shape - Group","hd":false},{"ind":3,"ty":"sh","ix":4,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[2.636,-2.636],[8.485,0],[0,0]],"o":[[0,0],[0,8.485],[-2.636,2.636],[0,0],[0,0]],"v":[[41.5,20.75],[41.5,23.5],[38.864,38.864],[23.5,41.5],[20.75,41.5]],"c":false},"ix":2},"nm":"Path 4","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"mm","mm":1,"nm":"Merge Paths 1","mn":"ADBE Vector Filter - Merge","hd":false},{"ty":"st","c":{"a":0,"k":[0,0,0,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":7,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[48.5,48.5],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"Group 1","np":6,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":300.00001221925,"st":0,"ct":1,"bm":0}],"markers":[],"props":{}}

// FIX: Removed local Screenshot interface to use the one from types.ts, fixing a type conflict.

const App: React.FC = () => {
  const [urls, setUrls] = useState<string[]>(['']);
  const [submittedUrl, setSubmittedUrl] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initiating multi-faceted audit...');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotMimeType, setScreenshotMimeType] = useState<string>('image/png');
  const [auditId, setAuditId] = useState<string | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [currentMicrocopy, setCurrentMicrocopy] = useState(loadingMicrocopy[0]);
  const [progress, setProgress] = useState<number>(0);
  const [whiteLabelLogo, setWhiteLabelLogo] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (newUrls: string[]) => {
    const cleanedUrls = newUrls.map(u => u.trim()).filter(u => u);
    
    if (cleanedUrls.length === 0) {
      setError("Please enter at least one valid URL.");
      return;
    }
    
    // Normalize and validate all URLs
    const normalizedUrls: string[] = [];
    let primaryHostname: string | null = null;

    for (const singleUrl of cleanedUrls) {
        let normalized = singleUrl;
        if (!/^https?:\/\//i.test(normalized)) {
            normalized = 'https://' + normalized;
        }

        try {
            const urlObject = new URL(normalized);
            if (!primaryHostname) {
                primaryHostname = urlObject.hostname.replace(/^www\./, '');
            } else {
                const currentHostname = urlObject.hostname.replace(/^www\./, '');
                if (currentHostname !== primaryHostname) {
                    setError(`All URLs must be from the same domain. Expected domain: "${primaryHostname}", but found "${currentHostname}".`);
                    return;
                }
            }
            normalizedUrls.push(normalized);
        } catch (_) {
            setError(`Invalid URL format: "${singleUrl}". Please enter full and valid URLs.`);
            return;
        }
    }

    setSubmittedUrl(normalizedUrls[0]);
    setIsLoading(true);
    setError(null);
    setReport(null);
    setScreenshots([]);
    setScreenshotMimeType('image/png');
    setAuditId(null);
    setPerformanceError(null);
    setLoadingMessage('Initiating multi-faceted audit...');
    setProgress(0);

    analyzeWebsiteStream({
      urls: normalizedUrls,
    }, {
      onScrapeComplete: (newScreenshots, mimeType) => {
        setScreenshots(newScreenshots);
        setScreenshotMimeType(mimeType);
      },
      onPerformanceError: (errorMessage) => {
        setPerformanceError(errorMessage);
      },
      onStatus: (message) => {
        setLoadingMessage(message);
        setProgress(prev => {
            let newProgress = prev;
            if (message.toLowerCase().includes('initiating')) newProgress = 5;
            if (message.includes('Capture task')) {
                const match = message.match(/(\d+)\/(\d+)/);
                if (match) {
                    const current = parseInt(match[1]);
                    const total = parseInt(match[2]);
                    newProgress = 5 + Math.round((current / total) * 25);
                }
            }
            if (message.includes('✓ Capture complete')) newProgress = 30;
            if (message.includes('Analyzing homepage performance')) newProgress = 35;
            if (message.includes('✓ Website content aggregated')) newProgress = 40;

            const analysisMessages: { [key: string]: number } = {
                'Running Strategy Audit': 40,
                '✓ Strategy Audit analysis complete': 51,
                'Running UX Audit': 51,
                '✓ UX Audit analysis complete': 62,
                'Running Product Audit': 62,
                '✓ Product Audit analysis complete': 73,
                'Running Visual Audit': 73,
                '✓ Visual Audit analysis complete': 84,
                'Analyzing issues for strategic impact': 85,
                '✓ All analyses complete': 95,
            };

            for (const key in analysisMessages) {
                if (message.includes(key)) {
                    newProgress = analysisMessages[key];
                }
            }

            return Math.max(prev, newProgress);
        });
      },
      onData: (chunk) => {
        setReport(prevReport => ({ ...prevReport, [chunk.key]: chunk.data }));
      },
      onComplete: ({ auditId, screenshotUrl }) => {
        setAuditId(auditId);
        setProgress(100);
        console.log("Primary screenshot saved at:", screenshotUrl);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsLoading(false);
        setProgress(0);
      },
      onClose: () => {
        setIsLoading(false);
        setLoadingMessage('Analysis complete.');
      }
    });
  }, []);
  
  const handleRunNewAudit = useCallback(() => {
    setReport(null);
    setUrls(['']);
    setError(null);
    setSubmittedUrl('');
    setScreenshots([]);
    setAuditId(null);
    setPerformanceError(null);
    setProgress(0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && report && auditId) {
      console.log("--- FINAL AUDIT REPORT DATA FOR DEBUGGING ---", JSON.parse(JSON.stringify(report)));
    }
  }, [isLoading, report, auditId]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentMicrocopy(prev => {
          const currentIndex = loadingMicrocopy.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMicrocopy.length;
          return loadingMicrocopy[nextIndex];
        });
      }, 2500); 

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const renderError = () => {
    if (!error) return null;

    let title = "Analysis Failed";
    let message: React.ReactNode = (
        <div className="text-left text-red-700 mt-2 text-sm space-y-2">
            <p>The analysis failed due to an unexpected technical issue. The full error from the backend is provided below for debugging:</p>
            <pre className="whitespace-pre-wrap bg-red-50 p-2 rounded text-xs font-mono break-all">{error}</pre>
        </div>
    );
    
    if (error.includes('Failed to fetch')) {
        title = "Network Connection Error";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The application could not connect to the backend analysis service. This can happen for a few reasons:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Function Timeout:</strong> The analysis for one of the AI experts took too long and the connection was closed by the server. This is the most common cause for complex websites.</li>
                    <li><strong>Network Issues:</strong> Your internet connection may have been interrupted, or a firewall/proxy is blocking the connection.</li>
                    <li><strong>Service Outage:</strong> The backend service may be temporarily unavailable.</li>
                </ul>
                <p className="font-semibold">Recommendation: Please try running the audit again. If the problem persists, it's likely a timeout issue with the website being analyzed.</p>
                 <p>The backend has been updated to be more efficient, but very complex sites can still hit the timeout limit.</p>
            </div>
        );
    } else if (error.includes('Scraping stream ended unexpectedly')) {
        title = "Analysis Timed Out or Crashed";
        message = (
             <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The initial website scraping process was interrupted. This usually happens when the target website is very complex or slow, causing the backend process to time out.</p>
                <p><strong>Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Scraping Timeout:</strong> The backend now allows up to 3 minutes for a website to load. Very complex or slow-loading single-page applications can still exceed this extended limit.</li>
                    <li><strong>Function Execution Limit:</strong> Supabase functions have a maximum execution time (e.g., 60 seconds on free plans). If the entire audit takes longer than this, the function is terminated abruptly.</li>
                    <li><strong>Unexpected Crash:</strong> A rare, unhandled error may have occurred in the backend browser automation.</li>
                </ul>
                <p><strong>Recommendation:</strong></p>
                <p>Please try running the audit again. If the problem persists, the website may be too complex for the current timeout limits of the automated system.</p>
            </div>
        );
    } else if (error.includes('Bucket not found')) {
        title = "Supabase Storage Misconfiguration";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The analysis completed, but the final report could not be saved. The error indicates that the Supabase Storage bucket named <strong>"screenshots"</strong> is missing.</p>
                <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard.</li>
                    <li>In the left-hand menu, navigate to the <strong>Storage</strong> section.</li>
                    <li>Click the <strong>"Create a new bucket"</strong> button.</li>
                    <li>Enter <code>screenshots</code> as the <strong>Bucket name</strong>.</li>
                    <li>Make sure the bucket is set to <strong>Public</strong>, or create a policy that allows public read access after creation. This is required to display the image in the report.</li>
                </ol>
                <p>After creating the bucket, please run the audit again.</p>
            </div>
        );
    } else if (error.includes('PUPPETEER_BROWSER_ENDPOINT')) {
        title = "Backend Configuration Error";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>It seems the <strong>PUPPETEER_BROWSER_ENDPOINT</strong> is not set up correctly in your Supabase function secrets.</p>
                <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard: <strong>Edge Functions</strong> &gt; <strong>audit</strong>.</li>
                    <li>Under the <strong>Settings</strong> tab, find the <strong>Secrets</strong> section.</li>
                    <li>Ensure the secret named <code>PUPPETEER_BROWSER_ENDPOINT</code> exists.</li>
                    <li>The value must be a full WebSocket URL from a service like Browserless.io, not just an API key.</li>
                    {/* FIX: Corrected a typo in the `<code>` tag which was causing JSX parsing errors. */}
                    <li className="break-all">Example format: <code>wss://chrome.browserless.io?token=YOUR_API_KEY</code></li>
                </ol>
                <p>After updating the secret, please try running the audit again.</p>
            </div>
        );
    } else if (error.includes('legacy endpoint') || error.includes('production-sfo.browserless.io')) {
        title = "Browser Service Endpoint Outdated";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The Browserless.io URL you are using (<code>chrome.browserless.io</code>) is a legacy endpoint and is no longer supported.</p>
                <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Supabase function secrets for the <strong>audit</strong> function.</li>
                    <li>Update the value of the <code>PUPPETEER_BROWSER_ENDPOINT</code> secret.</li>
                    <li>Replace the old hostname with the new one provided by Browserless.io.</li>
                    <li className="break-all">
                        <strong>Correct Format:</strong>
                        <div className="ml-4 my-1 p-2 bg-red-50 rounded text-xs"><code>wss://production-sfo.browserless.io?token=YOUR_API_KEY</code></div>
                    </li>
                </ol>
                <p>Please check your Browserless.io account dashboard for the precise URL for your account, as the region (`sfo`) may differ.</p>
            </div>
        );
    } else if (error.includes('Browser Service Error 401')) {
        title = "Invalid Browser Service API Key";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The request to the browser service was rejected with a <strong>401 Unauthorized</strong> error. This means the API key provided in your secret is incorrect.</p>
                <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>
                        Go to your <a href="https://www.browserless.io/account" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Browserless.io account dashboard</a> and copy your correct API key.
                    </li>
                    <li>
                        Navigate to your Supabase function secrets for the <strong>audit</strong> function.
                    </li>
                    <li>
                        Update the value of the <code>PUPPETEER_BROWSER_ENDPOINT</code> secret, ensuring the <code>token</code> parameter is correct.
                        <div className="break-all ml-4 my-1 p-2 bg-red-50 rounded text-xs">
                            Example: <code>wss://production-sfo.browserless.io?token=YOUR_CORRECT_API_KEY</code>
                        </div>
                    </li>
                </ol>
                <p>After updating the key, please try the audit again.</p>
            </div>
        );
    } else if (error.includes('Browser Service Error 403')) {
        title = "Connection Refused by Browser Service";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The request to the browser service was rejected (Error 403 Forbidden). This usually means there's an issue with your Browserless.io account or API key.</p>
                <p><strong>Please check the following:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>
                        <strong>Correct API Key:</strong> Go to your Supabase function secrets and ensure the API token in your <code>PUPPETEER_BROWSER_ENDPOINT</code> URL is correct and hasn't expired.
                        <div className="break-all ml-4 my-1 p-2 bg-red-50 rounded text-xs">Example: <code>wss://production-sfo.browserless.io?token=YOUR_VALID_API_KEY</code></div>
                    </li>
                    <li>
                        <strong>Browserless.io Account Status:</strong> Log in to your <a href="https://www.browserless.io/account" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Browserless.io account</a> to verify that it is active and has available credits/sessions.
                    </li>
                </ol>
                <p>After verifying your key and account status, please try the audit again.</p>
            </div>
        );
    } else if (error.includes('Unexpected server response: 429') || error.includes('Too Many Requests')) {
        title = "Browser Service Rate Limit Exceeded";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The request to the browser automation service was rejected with a <strong>429 Too Many Requests</strong> error. This means you have exceeded the usage limits of your Browserless.io plan.</p>
                <p><strong>Common Causes:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>
                        <strong>Free Plan Limits:</strong> Free plans have strict limits on the number of sessions you can run. You may have used up your quota.
                    </li>
                    <li>
                        <strong>Concurrent Sessions:</strong> Paid plans also have limits on how many audits you can run at the same time. If you have multiple audits running, you may have hit your concurrency limit.
                    </li>
                </ol>
                <p><strong>How to fix:</strong></p>
                <p>
                    Log in to your <a href="https://www.browserless.io/account" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Browserless.io account dashboard</a> to check your current usage and plan limits. You may need to wait for your quota to reset or upgrade to a higher plan.
                </p>
            </div>
        );
    } else if (error.includes('API_KEY')) {
        title = "Backend Configuration Error";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The <strong>API_KEY</strong> for the Gemini API is missing in your Supabase function secrets.</p>
                 <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard: <strong>Edge Functions</strong> &gt; <strong>audit</strong>.</li>
                    <li>Under the <strong>Settings</strong> tab, find the <strong>Secrets</strong> section.</li>
                    <li>Ensure the secret named <code>API_KEY</code> exists.</li>
                    <li>The value must be your Google AI Studio API key.</li>
                </ol>
                <p>After adding the secret, please try running the audit again.</p>
            </div>
        );
    } else if (error.includes('API key not valid')) {
        title = "Invalid Gemini API Key";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The request was rejected by the Google Gemini API. This typically means the <strong>API_KEY</strong> secret is incorrect or the required API is not enabled in your Google Cloud project.</p>
                <p><strong>How to fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Supabase project dashboard: <strong>Edge Functions</strong> &gt; <strong>audit</strong>.</li>
                    <li>Under the <strong>Settings</strong> tab, find the <strong>Secrets</strong> section.</li>
                    <li>Ensure the secret named <code>API_KEY</code> has the correct value from Google AI Studio.</li>
                    <li>Verify that the "Generative Language API" (sometimes called "Vertex AI API") is enabled in your Google Cloud Console for the project associated with this key.</li>
                </ol>
                <p>After updating the secret, please try running the audit again.</p>
            </div>
        );
    } else if (error.includes('model is overloaded') || error.includes('UNAVAILABLE') || error.includes('429') || error.includes('quota') || error.includes('RESOURCE_EXHAUSTED') || error.includes('503')) {
        title = "AI Service Temporarily Overloaded";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The Google Gemini AI service is currently experiencing very high traffic and rejected the request (Error 503 or 429).</p>
                <p><strong>This is an external issue with Google's servers, not a bug in the audit tool.</strong></p>
                <p><strong>Recommendation:</strong></p>
                <p>Please wait 1-2 minutes and try again. The system has been updated to retry more aggressively, but sometimes the congestion lasts longer than the timeout limit.</p>
            </div>
        );
    } else if (error.includes('Scraping Timeout')) {
        title = "Website Timed Out";
        message = (
             <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The audit failed because the target website took longer than the 3-minute limit to load and respond during the scraping phase.</p>
                <p><strong>Common Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                    <li>The website is currently down or experiencing very high traffic.</li>
                    <li>The website is a very large or complex single-page application that takes a long time to fully render.</li>
                    <li>The browser automation service (Browserless.io) may be under heavy load.</li>
                </ul>
                <p><strong>Recommendation:</strong></p>
                <p>Please try again in a few minutes. If the problem persists, the website may not be compatible with automated scraping.</p>
            </div>
        );
    } else if (error.includes('schema produces a constraint that has too many states')) {
        title = "Backend AI Schema Error";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>The AI model rejected the request because the data structure for the audit report is too complex.</p>
                <p>This is a backend issue related to the JSON schema definition in the Supabase function which defines the structure of the report.</p>
                <p className="font-semibold">The backend code has been updated to simplify the schema. Please try running the audit again.</p>
            </div>
        );
    } else if (error.includes('Invalid URL format') || error.includes('All URLs must be from the same domain')) {
        title = "Invalid URL Input";
        message = (
            <div className="text-left text-red-700 mt-2 text-sm space-y-2">
                <p>{error}</p>
            </div>
        );
    }


    return (
      <div className="mt-12 max-w-2xl mx-auto p-4 bg-red-100 border border-red-400 rounded-lg">
          <h3 className="font-bold text-red-800 text-center">{title}</h3>
          {message}
      </div>
    );
  };

  const showReport = !isLoading && report;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center justify-start pt-16 sm:pt-24">
        <Logo className="mx-auto mb-12" />
        <header className="w-full text-center px-4 mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
            Let's Put Your Website Through a UX Checkup
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-600">
            AI-powered UX assessment to spot friction, gaps, and quick wins.
            <span className="block mt-2 font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>Clear insights. Practical fixes. No fluff.</span>
          </p>
        </header>

        <div className="my-8 sm:my-12">
            <LottieAnimation animationData={qrCodeAnimationData} className="w-32 h-32 mx-auto" />
        </div>

        <div className="w-full px-4 text-center">
          <div className="mb-6">
            <ProgressBar progress={progress} />
          </div>
          <p className="mt-4 text-base sm:text-lg text-slate-600 animate-pulse">
            {currentMicrocopy}
          </p>
          <p className="mt-2 text-base sm:text-lg text-slate-600">
            Hang tight. Good things take a little time
          </p>
        </div>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-2 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <main>
            {error && renderError()}
            {!error && (
              <div>
                <ReportDisplay 
                  report={report} 
                  url={submittedUrl} 
                  screenshots={screenshots}
                  screenshotMimeType={screenshotMimeType}
                  performanceError={performanceError}
                  auditId={auditId}
                  onRunNewAudit={handleRunNewAudit}
                  whiteLabelLogo={whiteLabelLogo}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Initial Form View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col items-center justify-start pt-16 sm:pt-24">
        <Logo className="mb-12" />
        <header className="mb-16 sm:mb-32 text-center w-full px-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">
                Let's Put Your Website Through a UX Checkup
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-slate-600">
                AI-powered UX assessment to spot friction, gaps, and quick wins.
                <span className="block mt-2 font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>Clear insights. Practical fixes. No fluff.</span>
            </p>
        </header>
        
        <main className="w-full max-w-4xl px-4">
            <URLInputForm
                urls={urls}
                onUrlsChange={setUrls}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                whiteLabelLogo={whiteLabelLogo}
                onWhiteLabelLogoChange={setWhiteLabelLogo}
            />
            {error && renderError()}
        </main>
    </div>
  );
};

export default App;
