// 🚀 EXAM SCRAPER - API VERSION (Direct JSON API Access)
// =======================================================
// Copy and paste this entire script into your browser console
// Make sure you're on https://www.examprepper.co/exam/32/1 first

(async function ExamScraperAPI() {
    console.log('🚀 Starting API-based Exam Scraper...');
    console.log('📋 This will extract questions directly from the JSON API');
    console.log('⏳ Estimated time: 35-40 minutes (10 second delays to avoid rate limiting)');
    console.log('🐌 Slow but steady to respect server limits');
    console.log('');

    const CONFIG = {
        examId: 25,
        totalPages: 112,
        startPage: 1,
        delay: 5000, // 10 seconds between requests to avoid rate limiting
        batchSize: 25 // Save progress every 25 pages
    };

    let allQuestions = [];
    let currentPage = CONFIG.startPage;
    let successCount = 0;
    let failCount = 0;
    let isRunning = true;

    // Create progress display
    const progressDiv = document.createElement('div');
    progressDiv.id = 'scraper-progress-api';
    progressDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 13px;
        z-index: 999999;
        min-width: 380px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    document.body.appendChild(progressDiv);

    function updateProgress(message, details = '') {
        const timestamp = new Date().toLocaleTimeString();
        const percentage = Math.round((currentPage / CONFIG.totalPages) * 100);
        const questionsPerPage = allQuestions.length / Math.max(successCount, 1);
        const estimatedTotal = Math.round(questionsPerPage * CONFIG.totalPages);
        
        progressDiv.innerHTML = `
            <div style="color: #ffd700; font-weight: bold; font-size: 14px; margin-bottom: 10px;">🚀 API Exam Scraper</div>
            <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 2px; margin-bottom: 10px;">
                <div style="background: linear-gradient(90deg, #4CAF50, #45a049); height: 6px; border-radius: 6px; width: ${percentage}%; transition: width 0.3s;"></div>
            </div>
            <div style="margin: 8px 0;">📄 Page: ${currentPage}/${CONFIG.totalPages} (${percentage}%)</div>
            <div style="margin: 8px 0;">✅ Success: ${successCount} | ❌ Failed: ${failCount}</div>
            <div style="margin: 8px 0;">📊 Questions: ${allQuestions.length} (~${estimatedTotal} total)</div>
            <div style="margin: 8px 0; color: #90EE90; font-weight: bold;">${message}</div>
            <div style="margin: 8px 0; font-size: 11px; color: #E0E0E0;">${details}</div>
            <div style="margin: 8px 0; font-size: 10px; color: #B0B0B0;">${timestamp}</div>
            <div style="margin-top: 15px;">
                <button onclick="window.stopScraper()" style="margin-right: 10px; padding: 8px 15px; background: #ff4757; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Stop</button>
                <button onclick="window.downloadProgress()" style="padding: 8px 15px; background: #2ed573; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Download</button>
            </div>
        `;
    }

    // Stop function
    window.stopScraper = function() {
        isRunning = false;
        console.log('🛑 Scraper stopped by user');
        updateProgress('Stopped by user', 'Click Download to save current progress');
    };

    // Download function
    window.downloadProgress = function() {
        downloadResults();
        updateProgress('Downloaded!', `Saved ${allQuestions.length} questions`);
    };

    // Get current page cookies and headers for requests
    function getRequestHeaders() {
        return {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'max-age=0',
            'x-nextjs-data': '1'
        };
    }

    async function fetchPageData(pageNum) {
        // Use the actual Next.js API endpoint
        const url = `https://www.examprepper.co/_next/data/hR8Ei-Xh3B5xIQbsh3xdI/exam/${CONFIG.examId}/${pageNum}.json?id=${CONFIG.examId}&page=${pageNum}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: getRequestHeaders(),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Failed to fetch page ${pageNum}:`, error);
            throw error;
        }
    }

    function processQuestionData(questionData, pageNum) {
        try {
            const processedQuestion = {
                // Basic info
                question_id: questionData.id || `page_${pageNum}_unknown`,
                question_number: questionData.question_id || null,
                page: pageNum,
                
                // Question content
                question_text: questionData.question_text || '',
                choices: questionData.choices || {},
                
                // Answers
                correct_answer: questionData.answer || null,
                answer_ET: questionData.answer_ET || null, // ExamTopics answer
                answers_community: questionData.answers_community || [],
                
                // Additional data
                topic: questionData.topic || null,
                exam_id: questionData.exam_id || CONFIG.examId,
                is_multiple_choice: questionData.isMC || false,
                
                // URLs and references
                url: questionData.url || null,
                
                // Images
                question_images: questionData.question_images || [],
                answer_images: questionData.answer_images || [],
                
                // Timestamps
                timestamp: questionData.timestamp || null,
                unix_timestamp: questionData.unix_timestamp || null,
                
                // Discussion data
                discussion_count: questionData.discussion ? questionData.discussion.length : 0,
                discussion: questionData.discussion || [],
                
                // Answer description
                answer_description: questionData.answer_description || '',
                
                // Extraction metadata
                extracted_at: new Date().toISOString(),
                extraction_method: 'api_direct_v1'
            };

            return processedQuestion;
        } catch (error) {
            console.warn('Error processing question data:', error);
            return null;
        }
    }

    function downloadResults() {
        const data = {
            exam_id: CONFIG.examId,
            total_pages_attempted: currentPage - 1,
            successful_pages: successCount,
            failed_pages: failCount,
            total_questions: allQuestions.length,
            extraction_date: new Date().toISOString(),
            extraction_method: 'console_scraper_api_v1',
            questions: allQuestions,
            
            // Summary statistics
            statistics: {
                questions_per_page_avg: Math.round((allQuestions.length / Math.max(successCount, 1)) * 100) / 100,
                topics: [...new Set(allQuestions.map(q => q.topic).filter(Boolean))],
                question_types: {
                    multiple_choice: allQuestions.filter(q => q.is_multiple_choice).length,
                    other: allQuestions.filter(q => !q.is_multiple_choice).length
                },
                has_images: {
                    question_images: allQuestions.filter(q => q.question_images && q.question_images.length > 0).length,
                    answer_images: allQuestions.filter(q => q.answer_images && q.answer_images.length > 0).length
                },
                discussion_stats: {
                    with_discussion: allQuestions.filter(q => q.discussion_count > 0).length,
                    total_comments: allQuestions.reduce((sum, q) => sum + q.discussion_count, 0)
                }
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam_${CONFIG.examId}_complete_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('💾 Complete results downloaded!');
        console.log(`📊 Final stats: ${allQuestions.length} questions from ${successCount} pages`);
        
        // Show sample question structure
        if (allQuestions.length > 0) {
            console.log('📋 Sample question structure:');
            const sample = { ...allQuestions[0] };
            // Truncate long fields for display
            if (sample.discussion && sample.discussion.length > 2) {
                sample.discussion = sample.discussion.slice(0, 2).concat([{ truncated: `... ${sample.discussion.length - 2} more comments` }]);
            }
            console.log(JSON.stringify(sample, null, 2));
        }
    }

    async function scrapePage(pageNum) {
        try {
            updateProgress(`Fetching page ${pageNum}...`, 'Making API request');
            
            const data = await fetchPageData(pageNum);
            
            updateProgress(`Processing page ${pageNum}...`, 'Extracting question data');
            
            // Extract questions from the API response
            const questions = data.pageProps?.questions || [];
            
            if (questions.length > 0) {
                const processedQuestions = questions
                    .map(q => processQuestionData(q, pageNum))
                    .filter(q => q !== null);
                
                allQuestions.push(...processedQuestions);
                successCount++;
                
                const choicesInfo = processedQuestions.map(q => 
                    `Q${q.question_number || '?'}: ${Object.keys(q.choices).length} choices`
                ).join(', ');
                
                updateProgress(`✅ Page ${pageNum} complete`, `Found ${processedQuestions.length} questions (${choicesInfo})`);
                console.log(`✅ Page ${pageNum}: Found ${processedQuestions.length} questions with full data`);
            } else {
                failCount++;
                updateProgress(`⚠️ Page ${pageNum} - no questions`, 'API returned empty questions array');
                console.log(`⚠️ Page ${pageNum}: No questions in API response`);
            }

            // Save progress periodically
            if (pageNum % CONFIG.batchSize === 0) {
                updateProgress(`💾 Auto-saving progress...`, `Completed ${pageNum} pages`);
                console.log(`💾 Progress checkpoint at page ${pageNum}`);
            }

            return true;
        } catch (error) {
            failCount++;
            console.error(`❌ Error on page ${pageNum}:`, error);
            updateProgress(`❌ Error on page ${pageNum}`, error.message);
            return false;
        }
    }

    // Main scraping loop
    async function startScraping() {
        updateProgress('Initializing API scraper...', 'Starting direct JSON extraction');
        
        for (currentPage = CONFIG.startPage; currentPage <= CONFIG.totalPages && isRunning; currentPage++) {
            await scrapePage(currentPage);
            
            // Delay between requests
            if (currentPage < CONFIG.totalPages && isRunning) {
                const remainingPages = CONFIG.totalPages - currentPage;
                const estimatedMinutes = Math.round((remainingPages * CONFIG.delay) / 60000);
                updateProgress(`⏳ Waiting 10 seconds...`, `Next: page ${currentPage + 1} (~${estimatedMinutes}min remaining)`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.delay));
            }
        }

        if (isRunning) {
            updateProgress('🎉 API scraping complete!', `Extracted ${allQuestions.length} complete questions`);
            console.log('🎉 API scraping complete!');
            downloadResults();
        }

        // Keep progress display for manual download
        console.log('💡 Progress display will remain for manual download');
    }

    // Start the scraping process
    console.log('🎯 Starting API scraper in 3 seconds...');
    console.log('💡 This version uses 10-second delays to avoid rate limiting');
    console.log('📊 Will extract: questions, choices, answers, discussions, images, timestamps');
    console.log('⏰ Total time: ~35-40 minutes for all 204 pages');
    
    setTimeout(startScraping, 3000);

})();

// 📋 USAGE INSTRUCTIONS:
// ======================
// 1. Go to https://www.examprepper.co/exam/32/1 in your browser
// 2. Complete any security checkpoints manually
// 3. Open Developer Tools (F12) → Console tab
// 4. Copy and paste this entire script
// 5. Press Enter to run
// 6. Results will include: question_text, choices, correct_answer, discussions, images, etc.
// 7. Much faster than HTML scraping - uses direct JSON API!

console.log('📋 API Exam Scraper loaded! This version uses the direct JSON API for complete data.');