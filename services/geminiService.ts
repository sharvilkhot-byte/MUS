
import { StreamChunk, DataChunk, CompleteChunk, AnalysisReport, ExpertKey, Screenshot } from '../types';

// --- Supabase Client Details ---
// These values have been configured with your Supabase project details.
const supabaseUrl = 'https://sobtfbplbpvfqeubjxex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvYnRmYnBsYnB2ZnFldWJqeGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDgzMDYsImV4cCI6MjA3NDcyNDMwNn0.ewfxDwlapmRpfyvYD3ALb-WyL12ty1eP8nzKyrc66ho';
// -----------------------------

interface StreamCallbacks {
  onScrapeComplete: (screenshots: Screenshot[], screenshotMimeType: string) => void;
  onPerformanceError?: (message: string) => void;
  onStatus: (message: string) => void;
  onData: (chunk: DataChunk['payload']) => void;
  onComplete: (payload: CompleteChunk['payload']) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

interface AnalyzeParams {
  urls: string[];
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
  { urls }: AnalyzeParams,
  callbacks: StreamCallbacks
): Promise<void> => {
  const { onScrapeComplete, onStatus, onData, onComplete, onError, onClose, onPerformanceError } = callbacks;
  const primaryUrl = urls[0];
  const finalReport: AnalysisReport = {};

  try {
    // --- Phase 1: Scrape Website (new sequential-per-page logic) ---
    onStatus('Initiating website capture...');
    const captureTasks = urls.flatMap((url, index) => [
      { url, isMobile: false, isFirstPage: index === 0 },
      { url, isMobile: true, isFirstPage: false },
    ]);

    const allScreenshots: Screenshot[] = [];
    let aggregatedLiveText = '';
    let animationData: any[] | null = null;
    let accessibilityData: Record<string, any> | null = null;
    let successfulCaptures = 0;

    for (let i = 0; i < captureTasks.length; i++) {
        const task = captureTasks[i];
        const device = task.isMobile ? 'mobile' : 'desktop';
        const pageName = new URL(task.url).pathname;
        onStatus(`Capture task ${i + 1}/${captureTasks.length}: ${pageName} (${device})`);

        try {
            const response = await fetch(functionUrl, {
              method: 'POST',
              headers: commonHeaders,
              body: JSON.stringify({ ...task, mode: 'scrape-single-page' }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Capture failed for ${task.url} (${device}): ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            const { screenshot, liveText, animationData: ad, accessibilityData: accD } = result;

            allScreenshots.push(screenshot);
            // Only aggregate text from desktop captures to avoid duplication
            if (!screenshot.isMobile && liveText) {
                aggregatedLiveText += `\n\n--- START CONTENT FROM ${screenshot.path} ---\n${liveText}\n--- END CONTENT FROM ${screenshot.path} ---\n\n`;
            }
            if (ad) animationData = ad;
            if (accD) accessibilityData = accD;
            successfulCaptures++;

        } catch (error) {
            console.warn(error.message);
            onStatus(`⚠️ Task ${i + 1}/${captureTasks.length} failed. Skipping.`);
        }
    }
    
    if (successfulCaptures === 0) {
      throw new Error("Scraping failed for all provided URLs. Cannot proceed with audit.");
    }
    
    onStatus(`✓ Capture complete. ${successfulCaptures}/${captureTasks.length} tasks succeeded.`);

    // Performance check is only done on the main URL
    onStatus('Analyzing homepage performance...');
    const performanceScrapePromise = fetch(functionUrl, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({ url: primaryUrl, mode: 'scrape-performance' }),
    }).then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        return { performanceData: null, error: `Performance analysis failed: ${response.status} ${errorText}` };
      }
      return response.json();
    });

    const performanceResult = await performanceScrapePromise;

    const scrapedData = {
      screenshots: allScreenshots,
      screenshotMimeType: 'image/jpeg',
      liveText: aggregatedLiveText,
      performanceData: performanceResult.performanceData,
      performanceAnalysisError: performanceResult.error,
      animationData,
      accessibilityData,
    };
    
    const { screenshots, liveText, performanceData, screenshotMimeType, performanceAnalysisError } = scrapedData;
    
    onScrapeComplete(screenshots, screenshotMimeType);
    if (performanceAnalysisError && onPerformanceError) {
        onPerformanceError(performanceAnalysisError);
    }


    if (!liveText || liveText.trim().length < 50) {
        throw new Error("Scraping succeeded, but could not extract sufficient text content from the page. The page might be empty or a single-page application that requires more interaction to load fully.");
    }
    onStatus('✓ Website content aggregated. Beginning AI analysis...');
    
    const primaryScreenshot = screenshots.find(s => s.path === new URL(primaryUrl).pathname && !s.isMobile);
    const primaryMobileScreenshot = screenshots.find(s => s.path === new URL(primaryUrl).pathname && s.isMobile);

    // --- Phase 2: Analyze Data (Parallel Experts) ---
    const analysisExperts: ExpertKey[] = [
        'Strategy Audit expert',
        'UX Audit expert',
        'Product Audit expert',
        'Visual Audit expert',
    ];

    const analysisPromises = analysisExperts.map(expertKey => {
        const expertShortName = expertKey.split(' ')[0].toLowerCase();
        const mode = `analyze-${expertShortName}`;
        const analysisBody = { 
            url: primaryUrl, 
            screenshotBase64: primaryScreenshot?.data, 
            mobileScreenshotBase64: primaryMobileScreenshot?.data, 
            liveText, 
            performanceData, 
            screenshotMimeType, 
            performanceAnalysisError, 
            animationData, 
            accessibilityData,
            mode,
        };
        return processSingleAnalysisStream(analysisBody, expertKey, callbacks, finalReport);
    });

    await Promise.all(analysisPromises);


    // --- Phase 2.5: Contextual Ranking of Issues ---
    onStatus('Analyzing issues for strategic impact...');
    try {
        const contextualRankResponse = await fetch(functionUrl, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({ report: finalReport, mode: 'contextual-rank' }),
        });

        if (!contextualRankResponse.ok) {
            const errorText = await contextualRankResponse.text();
            console.warn(`Contextual ranking failed: ${errorText}. Falling back to default sorting.`);
        } else {
            const contextualIssues = await contextualRankResponse.json();
            onData({ key: 'Top5ContextualIssues', data: contextualIssues });
        }
    } catch (e) {
        console.warn(`Contextual ranking request failed: ${e.message}. Falling back to default sorting.`);
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
        const errorText = await finalizeResponse.text();
        throw new Error(`Failed to finalize report: ${finalizeResponse.status} ${errorText}`);
    }

    const finalData: CompleteChunk['payload'] = await finalizeResponse.json();
    onComplete(finalData);

  } catch (e) {
    console.error('Audit process failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during the audit.';
    onError(errorMessage);
  } finally {
    onClose();
  }
};
