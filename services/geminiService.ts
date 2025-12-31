import { StreamChunk, AnalysisReport, ExpertKey, Screenshot, AuditInput } from '../types';

// --- Supabase Client Details ---
// These values have been configured with your Supabase project details.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// -----------------------------

interface StreamCallbacks {
  onScrapeComplete: (screenshots: Screenshot[], screenshotMimeType: string) => void;
  onPerformanceError?: (message: string) => void;
  onStatus: (message: string) => void;
  onData: (chunk: any) => void;
  onComplete: (payload: any) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

interface AnalyzeParams {
  inputs: AuditInput[];
}

const commonHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'apikey': supabaseAnonKey,
};
const functionUrl = `${supabaseUrl}/functions/v1/audit`;


const processSingleAnalysisStream = async (
  body: any,
  key: ExpertKey,
  { onStatus, onData, onError }: StreamCallbacks,
  finalReport: AnalysisReport
) => {
  const expertName = key.split(' ')[0];
  try {
    onStatus(`Running ${expertName} Audit`);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis request failed for ${expertName}: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error(`Response body is null for ${expertName} analysis.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const parsedChunk: StreamChunk = JSON.parse(line);
          if (parsedChunk.type === 'data') {
            onData(parsedChunk.payload);
            finalReport[parsedChunk.payload.key] = parsedChunk.payload.data;
          } else if (parsedChunk.type === 'error') {
            throw new Error(parsedChunk.message);
          }
        } catch (e) {
          console.error(`Failed to parse stream chunk for ${expertName}:`, line, e);
        }
      }
    }
    onStatus(`✓ ${expertName} Audit analysis complete`);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    onError(`An error occurred during the ${expertName} Audit: ${errorMessage}`);
    throw e;
  }
};

export const analyzeWebsiteStream = async (
  { inputs }: AnalyzeParams,
  callbacks: StreamCallbacks
): Promise<void> => {
  const { onScrapeComplete, onStatus, onData, onComplete, onError, onClose, onPerformanceError } = callbacks;
  const finalReport: AnalysisReport = {};

  try {
    const allScreenshots: Screenshot[] = [];
    let aggregatedLiveText = '';
    let performanceData = null;
    let performanceAnalysisError = null;
    let animationData: any[] = [];
    let accessibilityData: any = null;

    // --- Phase 1: Data Acquisition (Mixed URL/Upload) ---
    onStatus('Processing mixed inputs (URLs & Uploads)...');

    let successfulAcquisitions = 0;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const isPrimary = i === 0;

      if (input.type === 'url' && input.url) {
        // --- URL SCRAPING ---
        onStatus(`Scraping URL ${i + 1}/${inputs.length}: ${input.url}`);

        // We only need 1 screenshot per URL in mixed mode to save time, or we can do mobile too.
        // Let's stick to Desktop only per URL for mixed mode simplicity? 
        // Or keep original logic: URLs get desktop+mobile?
        // To keep simple: Desktop Screenshot for all. Mobile only for first URL if it's a URL.
        const tasks = [{ url: input.url, isMobile: false }];
        if (isPrimary) tasks.push({ url: input.url, isMobile: true });

        for (const task of tasks) {
          try {
            const response = await fetch(functionUrl, {
              method: 'POST',
              headers: commonHeaders,
              body: JSON.stringify({ ...task, mode: 'scrape-single-page' }),
            });

            if (!response.ok) throw new Error("Scrape failed");

            const result = await response.json();

            allScreenshots.push(result.screenshot);
            if (!result.screenshot.isMobile) {
              aggregatedLiveText += `\n\n--- CONTENT FROM ${input.url} ---\n${result.liveText || '(No text found)'}\n\n`;
              if (isPrimary) {
                animationData = result.animationData;
                accessibilityData = result.accessibilityData;
              }
            }
            successfulAcquisitions++;
          } catch (e) {
            console.error(e);
            onStatus(`⚠️ Failed to scrape ${input.url}. Skipping.`);
          }
        }

        // Performance check only for Primary URL
        if (isPrimary) {
          fetch(functionUrl, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({ url: input.url, mode: 'scrape-performance' }),
          }).then(r => r.json()).then(res => {
            performanceData = res.performanceData;
            performanceAnalysisError = res.error;
          }).catch(e => {
            performanceAnalysisError = e.message;
          });
        }

      } else if (input.type === 'upload' && input.fileData) {
        // --- UPLOAD PROCESSING ---
        onStatus(`Processing upload ${i + 1}/${inputs.length}...`);

        allScreenshots.push({
          path: `upload-${i}.png`,
          data: input.fileData,
          isMobile: false
        });

        aggregatedLiveText += `\n\n--- CONTEXT FOR UPLOAD ${i + 1} ---\n(User Snapshot)\n\n`;
        successfulAcquisitions++;
      }
    }

    if (successfulAcquisitions === 0) {
      throw new Error("Failed to acquire data from any source.");
    }

    const primaryUrl = inputs[0].type === 'url' ? inputs[0].url! : 'Manual Upload';

    // Notify UI
    onScrapeComplete(allScreenshots, 'image/png');
    onStatus('✓ Data acquired. Beginning AI analysis...');


    // --- Phase 2: Analyze Data ---
    const primaryScreenshot = allScreenshots[0]; // Logic: Use first available
    const primaryMobileScreenshot = allScreenshots.find(s => s.isMobile);
    
    // Collect all desktop screenshots for combined analysis
    const allDesktopScreenshots = allScreenshots.filter(s => !s.isMobile);
    const allDesktopScreenshotsBase64 = allDesktopScreenshots.map(s => s.data).filter(Boolean);

    const analysisExperts: ExpertKey[] = [
      'Strategy Audit expert',
      'UX Audit expert',
      'Product Audit expert',
      'Visual Audit expert',
    ];

    for (const expertKey of analysisExperts) {
      const expertShortName = expertKey.split(' ')[0].toLowerCase();
      const mode = `analyze-${expertShortName}`;

      const analysisBody = {
        url: primaryUrl,
        screenshotBase64: primaryScreenshot?.data, // Kept for backward compatibility
        allScreenshotsBase64: allDesktopScreenshotsBase64, // NEW: All desktop screenshots for combined analysis
        mobileScreenshotBase64: primaryMobileScreenshot?.data,
        liveText: aggregatedLiveText,
        performanceData,
        screenshotMimeType: 'image/png', // Normalize to png/jpeg mix if needed, usually backend handles base64
        performanceAnalysisError,
        animationData,
        accessibilityData,
        mode,
      };

      try {
        if (expertKey !== analysisExperts[0]) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        await processSingleAnalysisStream(analysisBody, expertKey, callbacks, finalReport);
      } catch (error) {
        console.error(`Analysis failed for ${expertKey}:`, error);
        onStatus(`⚠️ ${expertKey.split(' ')[0]} analysis skipped due to error.`);
      }
    }

    // --- Phase 2.5: Contextual Ranking of Issues ---
    onStatus('Analyzing issues for strategic impact...');
    try {
      const contextualRankResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ report: finalReport, mode: 'contextual-rank' }),
      });

      if (!contextualRankResponse.ok) {
        // Warning logic
      } else {
        const contextualIssues = await contextualRankResponse.json();
        onData({ key: 'Top5ContextualIssues', data: contextualIssues });
      }
    } catch (e) {
      console.warn(e);
    }

    onStatus('✓ All analyses complete. Finalizing report...');

    // --- Phase 3: Finalize Report ---
    const finalizeResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        report: finalReport,
        screenshots: allScreenshots,
        url: primaryUrl,
        mode: 'finalize'
      }),
    });

    if (!finalizeResponse.ok) {
      throw new Error("Finalize failed");
    }

    const finalData = await finalizeResponse.json();
    onComplete(finalData);

  } catch (e) {
    console.error('Audit process failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    onError(errorMessage);
  } finally {
    onClose();
  }
};
