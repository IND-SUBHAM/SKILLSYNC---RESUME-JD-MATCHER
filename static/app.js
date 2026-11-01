// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Dynamic API Base URL resolution:
    // If frontend is served directly by Flask (port 5000), API_BASE is empty string (relative paths).
    // If frontend is served by VS Code Live Server (port 5500), Vite (5173), or file:// protocol,
    // API_BASE points directly to http://127.0.0.1:5000.
    const API_BASE = (window.location.protocol === 'file:' || (window.location.port !== '5000' && window.location.port !== ''))
        ? 'http://127.0.0.1:5000'
        : '';

    // State management
    let state = {
        resumeFile: null,
        jdFile: null,
        jdMode: 'file' // 'file' or 'text'
    };

    // DOM Elements
    const elements = {
        // Dropzones & Inputs
        resumeDropZone: document.getElementById('resume-drop-zone'),
        resumeFileInput: document.getElementById('resume-file-input'),
        resumeFileDetails: document.getElementById('resume-file-details'),
        resumeDisplayName: document.getElementById('resume-display-name'),
        resumeDisplaySize: document.getElementById('resume-display-size'),
        removeResumeBtn: document.getElementById('remove-resume-btn'),

        jdDropZone: document.getElementById('jd-drop-zone'),
        jdFileInput: document.getElementById('jd-file-input'),
        jdFileDetails: document.getElementById('jd-file-details'),
        jdDisplayName: document.getElementById('jd-display-name'),
        jdDisplaySize: document.getElementById('jd-display-size'),
        removeJdBtn: document.getElementById('remove-jd-btn'),
        jdTextInput: document.getElementById('jd-text-input'),
        jdTextZone: document.getElementById('jd-text-zone'),

        // Tabs
        tabJdFile: document.getElementById('tab-jd-file'),
        tabJdText: document.getElementById('tab-jd-text'),

        // Actions
        analyzeBtn: document.getElementById('analyze-btn'),
        resetBtn: document.getElementById('reset-btn'),
        printReportBtn: document.getElementById('print-report-btn'),
        
        // Sections
        inputSection: document.getElementById('input-section'),
        loadingOverlay: document.getElementById('loading-overlay'),
        loadingStatus: document.getElementById('loading-status'),
        loadingDetail: document.getElementById('loading-detail'),
        errorCard: document.getElementById('error-card'),
        errorMessage: document.getElementById('error-message'),
        closeErrorBtn: document.getElementById('close-error-btn'),
        resultsContainer: document.getElementById('results-container'),

        // Results Details
        progressCircle: document.getElementById('progress-circle'),
        scoreText: document.getElementById('score-text'),
        scoreRating: document.getElementById('score-rating'),
        scoreDesc: document.getElementById('score-desc'),
        
        candidateName: document.getElementById('candidate-name'),
        candidateRoleBadge: document.getElementById('candidate-role-badge'),
        candidateEmail: document.getElementById('candidate-email'),
        candidatePhone: document.getElementById('candidate-phone'),
        candidateLocation: document.getElementById('candidate-location'),
        candidateLinkedin: document.getElementById('candidate-linkedin'),
        candidateGithub: document.getElementById('candidate-github'),
        profileAvatar: document.getElementById('profile-avatar'),

        matchingSkillsTags: document.getElementById('matching-skills-tags'),
        missingSkillsTags: document.getElementById('missing-skills-tags'),
        jdSkillsTags: document.getElementById('jd-skills-tags'),
        recommendationText: document.getElementById('recommendation-text'),

        resumeExpList: document.getElementById('resume-exp-list'),
        jdExpList: document.getElementById('jd-exp-list'),
        internshipStatus: document.getElementById('internship-status'),
        currentRoleVal: document.getElementById('current-role-val'),
        
        educationDetailsList: document.getElementById('education-details-list'),

        // Work History & Match History
        workHistoryBadge: document.getElementById('work-history-badge'),
        workHistoryTimeline: document.getElementById('work-history-timeline'),
        historyToggleBtn: document.getElementById('history-toggle-btn'),
        historyCountBadge: document.getElementById('history-count-badge'),
        resultsHistoryBtn: document.getElementById('results-history-btn'),
        resultsHistoryCount: document.getElementById('results-history-count'),
        historyDrawer: document.getElementById('history-drawer'),
        drawerBackdrop: document.getElementById('drawer-backdrop'),
        closeDrawerBtn: document.getElementById('close-drawer-btn'),
        historySearchInput: document.getElementById('history-search-input'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        historyItemsContainer: document.getElementById('history-items-container')
    };

    // Match history storage list
    let matchHistory = [];

    // Initialize Toast system
    const toast = createToastElement();

    // SVG Progress Circle Initialization
    const radius = elements.progressCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.progressCircle.style.strokeDashoffset = circumference;

    // Event Bindings
    setupDragAndDrop();
    setupJdTabs();
    setupFileInputs();
    setupActionButtons();
    initHistory();

    // --- Core Functions ---

    function createToastElement() {
        const t = document.createElement('div');
        t.className = 'clipboard-toast';
        document.body.appendChild(t);
        return t;
    }

    function showToast(message, isSuccess = true) {
        toast.textContent = message;
        if (isSuccess) {
            toast.style.background = 'rgba(16, 185, 129, 0.95)';
        } else {
            toast.style.background = 'rgba(239, 68, 68, 0.95)';
        }
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    function showLoading(status, detail) {
        elements.loadingStatus.textContent = status;
        elements.loadingDetail.textContent = detail;
        elements.loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorCard.classList.remove('hidden');
        elements.errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideError() {
        elements.errorCard.classList.add('hidden');
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Drag & Drop Setup
    function setupDragAndDrop() {
        // Prevent defaults globally for drop zones
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            elements.resumeDropZone.addEventListener(eventName, preventDefaults, false);
            elements.jdDropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Add visual dragover effects
        ['dragenter', 'dragover'].forEach(eventName => {
            elements.resumeDropZone.addEventListener(eventName, () => {
                elements.resumeDropZone.classList.add('dragover');
            }, false);
            elements.jdDropZone.addEventListener(eventName, () => {
                elements.jdDropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            elements.resumeDropZone.addEventListener(eventName, () => {
                elements.resumeDropZone.classList.remove('dragover');
            }, false);
            elements.jdDropZone.addEventListener(eventName, () => {
                elements.jdDropZone.classList.remove('dragover');
            }, false);
        });

        // Drop handlers
        elements.resumeDropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleResumeFile(files[0]);
            }
        });

        elements.jdDropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleJdFile(files[0]);
            }
        });
    }

    // JD input modes switcher
    function setupJdTabs() {
        elements.tabJdFile.addEventListener('click', () => {
            elements.tabJdFile.classList.add('active');
            elements.tabJdText.classList.remove('active');
            elements.jdDropZone.classList.remove('hidden');
            elements.jdTextZone.classList.add('hidden');
            state.jdMode = 'file';
            
            // Re-sync visibility for file details
            if (state.jdFile) {
                elements.jdFileDetails.style.display = 'flex';
                elements.jdDropZone.classList.add('hidden');
            }
            hideError();
        });

        elements.tabJdText.addEventListener('click', () => {
            elements.tabJdText.classList.add('active');
            elements.tabJdFile.classList.remove('active');
            elements.jdDropZone.classList.add('hidden');
            elements.jdTextZone.classList.remove('hidden');
            elements.jdFileDetails.style.display = 'none';
            state.jdMode = 'text';
            hideError();
        });
    }

    // Browsed file input listeners
    function setupFileInputs() {
        elements.resumeFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleResumeFile(e.target.files[0]);
            }
        });

        elements.jdFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleJdFile(e.target.files[0]);
            }
        });

        // File removal buttons
        elements.removeResumeBtn.addEventListener('click', () => {
            state.resumeFile = null;
            elements.resumeFileInput.value = '';
            elements.resumeFileDetails.style.display = 'none';
            elements.resumeDropZone.classList.remove('hidden');
            showToast("Resume removed");
        });

        elements.removeJdBtn.addEventListener('click', () => {
            state.jdFile = null;
            elements.jdFileInput.value = '';
            elements.jdFileDetails.style.display = 'none';
            elements.jdDropZone.classList.remove('hidden');
            showToast("Job Description removed");
        });
    }

    // File validation and detail display
    function handleResumeFile(file) {
        if (!validateFile(file)) return;
        state.resumeFile = file;
        elements.resumeDisplayName.textContent = file.name;
        elements.resumeDisplaySize.textContent = formatBytes(file.size);
        
        // Show correct icon based on type
        const isDocx = file.name.endsWith('.docx');
        const iconType = document.getElementById('resume-icon-type');
        iconType.className = isDocx ? 'fa-solid fa-file-word file-icon' : 'fa-solid fa-file-pdf file-icon';
        iconType.style.color = isDocx ? '#2b579a' : '#f40f0f';

        elements.resumeDropZone.classList.add('hidden');
        elements.resumeFileDetails.style.display = 'flex';
        hideError();
    }

    function handleJdFile(file) {
        if (!validateFile(file)) return;
        state.jdFile = file;
        elements.jdDisplayName.textContent = file.name;
        elements.jdDisplaySize.textContent = formatBytes(file.size);
        
        const isDocx = file.name.endsWith('.docx');
        const iconType = document.getElementById('jd-icon-type');
        iconType.className = isDocx ? 'fa-solid fa-file-word file-icon' : 'fa-solid fa-file-pdf file-icon';
        iconType.style.color = isDocx ? '#2b579a' : '#f40f0f';

        // Clear raw text
        elements.jdTextInput.value = '';

        elements.jdDropZone.classList.add('hidden');
        elements.jdFileDetails.style.display = 'flex';
        hideError();
    }

    function validateFile(file) {
        const allowedExtensions = /(\.pdf|\.docx)$/i;
        if (!allowedExtensions.exec(file.name)) {
            showError("Unsupported file format. Please upload a PDF or DOCX file.");
            showToast("Unsupported file format.", false);
            return false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showError("File is too large. Maximum supported file size is 5MB.");
            showToast("File size limit exceeded.", false);
            return false;
        }
        return true;
    }

    // Trigger Matching logic
    function setupActionButtons() {
        elements.analyzeBtn.addEventListener('click', performMatch);
        elements.resetBtn.addEventListener('click', resetMatcher);
        elements.printReportBtn.addEventListener('click', () => {
            window.print();
        });
        elements.closeErrorBtn.addEventListener('click', hideError);

        // Copy contact details triggers
        elements.candidateEmail.addEventListener('click', () => {
            copyTextToClipboard(elements.candidateEmail.textContent, "Email address copied!");
        });
        elements.candidatePhone.addEventListener('click', () => {
            copyTextToClipboard(elements.candidatePhone.textContent, "Phone number copied!");
        });

        // History Drawer Triggers
        if (elements.historyToggleBtn) {
            elements.historyToggleBtn.addEventListener('click', openHistoryDrawer);
        }
        if (elements.resultsHistoryBtn) {
            elements.resultsHistoryBtn.addEventListener('click', openHistoryDrawer);
        }
        if (elements.closeDrawerBtn) {
            elements.closeDrawerBtn.addEventListener('click', closeHistoryDrawer);
        }
        if (elements.drawerBackdrop) {
            elements.drawerBackdrop.addEventListener('click', closeHistoryDrawer);
        }
        if (elements.clearHistoryBtn) {
            elements.clearHistoryBtn.addEventListener('click', clearAllHistory);
        }
        if (elements.historySearchInput) {
            elements.historySearchInput.addEventListener('input', (e) => {
                renderHistoryList(e.target.value.trim().toLowerCase());
            });
        }

        // Close history drawer on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.historyDrawer.classList.contains('open')) {
                closeHistoryDrawer();
            }
        });
    }

    async function performMatch() {
        hideError();

        // 1. Gather variables
        const formData = new FormData();
        let hasResume = false;
        let hasJd = false;

        // Resume resolution
        if (state.resumeFile) {
            formData.append('resume_file', state.resumeFile);
            hasResume = true;
        }

        // JD resolution
        if (state.jdMode === 'file') {
            if (state.jdFile) {
                formData.append('jd_file', state.jdFile);
                hasJd = true;
            }
        } else { // text mode
            const rawJdText = elements.jdTextInput.value.trim();
            if (rawJdText) {
                formData.append('jd_text', rawJdText);
                hasJd = true;
            }
        }

        // Validation check
        if (!hasResume) {
            showError("Resume missing. Please upload a resume file (PDF or DOCX).");
            showToast("Resume is required", false);
            return;
        }
        if (!hasJd) {
            showError("Job Description missing. Please upload a JD file or paste the JD text.");
            showToast("Job Description is required", false);
            return;
        }

        // 2. Fire Request
        showLoading("Uploading & Processing...", "Saving files to local folders and executing CLI app.py");

        try {
            const response = await fetch(`${API_BASE}/api/match`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!result.success) {
                hideLoading();
                showError(result.error || "Failed to process matching. Please review the inputs.");
                return;
            }

            // Successfully parsed and matched
            hideLoading();
            renderDashboard(result);
            showToast("Analysis complete! CLI execution captured.", true);
            checkBackendConnection();

            // Add to persistent Match History
            const resumeLabel = state.resumeFile ? state.resumeFile.name : 'Uploaded Resume';
            const jdLabel = state.jdMode === 'file' 
                ? (state.jdFile ? state.jdFile.name : 'Job Description')
                : 'Pasted Job Description';
            addMatchToHistory(result, resumeLabel, jdLabel);
            
            // Scroll to results
            setTimeout(() => {
                elements.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (err) {
            console.error("Match error: ", err);
            hideLoading();
            showError(`Cannot connect to the SkillSync backend (${API_BASE || 'http://127.0.0.1:5000'}). Please ensure server.py is running!`);
            showToast("Backend connection failed", false);
            checkBackendConnection();
        }
    }

    // Render results in HTML layout
    function renderDashboard(data) {
        elements.resultsContainer.classList.remove('hidden');
        elements.inputSection.classList.add('hidden');

        // Helper: Deduplicate skills arrays and prune redundant DSA sub-skills
        const cleanSkillList = (list) => {
            if (!list || !Array.isArray(list)) return [];
            let items = [...list];
            if (items.includes("data structures and algorithms")) {
                items = items.filter(s => s !== "algorithms" && s !== "data structures");
            } else if (items.includes("algorithms") && items.includes("data structures")) {
                items = items.filter(s => s !== "algorithms" && s !== "data structures");
                items.push("data structures and algorithms");
            }
            return Array.from(new Set(items));
        };
        data.resume_skills = cleanSkillList(data.resume_skills);
        data.jd_skills = cleanSkillList(data.jd_skills);
        data.missing_skills = cleanSkillList(data.missing_skills);

        // 1. Render Score Ring
        const scoreVal = parseFloat(data.match_score);
        animateScoreRing(scoreVal);

        // 2. Personal Details
        const personal = data.personal_details;
        elements.candidateName.textContent = personal.name !== "Not Found" ? personal.name : "Candidate Profile";
        
        // Initial Avatar letter
        const firstLetter = personal.name !== "Not Found" ? personal.name.charAt(0).toUpperCase() : 'U';
        elements.profileAvatar.textContent = firstLetter;

        elements.candidateEmail.textContent = personal.email;
        elements.candidatePhone.textContent = personal.phone;
        elements.candidateLocation.textContent = personal.location;
        
        // Social Badge Links visibility toggle
        if (personal.linkedin !== "Not Found") {
            let fullUrl = personal.linkedin;
            if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;
            elements.candidateLinkedin.href = fullUrl;
            elements.candidateLinkedin.classList.remove('hidden');
        } else {
            elements.candidateLinkedin.classList.add('hidden');
        }

        if (personal.github !== "Not Found") {
            let fullUrl = personal.github;
            if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;
            elements.candidateGithub.href = fullUrl;
            elements.candidateGithub.classList.remove('hidden');
        } else {
            elements.candidateGithub.classList.add('hidden');
        }

        // Current Role badge
        const currentRole = data.experience.current_role;
        elements.candidateRoleBadge.textContent = currentRole !== "Not Found" ? currentRole : "Parsed Resume Profile";
        elements.currentRoleVal.textContent = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

        // Internship search
        const isInternship = data.experience.internship;
        elements.internshipStatus.innerHTML = isInternship
            ? '<i class="fa-solid fa-circle-check text-success"></i> Search Found'
            : '<i class="fa-solid fa-circle-xmark text-muted"></i> Not Mentioned';

        // 3. Render Skills tags
        renderTags(data.resume_skills.filter(s => !data.missing_skills.includes(s)), elements.matchingSkillsTags, 'match', 'No matching skills found');
        renderTags(data.missing_skills, elements.missingSkillsTags, 'gap', 'No missing skills detected');
        renderTags(data.jd_skills, elements.jdSkillsTags, 'jd-only', 'No required skills parsed from Job Description');

        // Dynamic Match & Candidate Summary
        elements.recommendationText.innerHTML = generateMatchSummary(data);

        // 4. Render Experience Grid
        renderExperienceBlocks(data.experience.resume, elements.resumeExpList);
        renderExperienceBlocks(data.experience.jd, elements.jdExpList);

        // 5. Render Education timeline
        renderEducationTimeline(data.education);

        // 6. Render Work & Employment History timeline
        renderWorkHistory(data.work_history);

    }

    // Helper: Dynamic Candidate Match & Fit Summary Generator
    function generateMatchSummary(data) {
        const score = typeof data.match_score === 'number' ? data.match_score : parseFloat(data.match_score) || 0;
        const candidateName = (data.personal_details?.name && data.personal_details.name !== 'Not Found')
            ? escapeHtml(data.personal_details.name)
            : 'Candidate';

        // Matching skills and missing skills
        const matchingSkills = (data.resume_skills || []).filter(s => !(data.missing_skills || []).includes(s));
        const missingSkills = data.missing_skills || [];
        
        // Formulate verdict banner
        let verdictClass = 'verdict-moderate';
        let verdictIcon = 'fa-triangle-exclamation';
        let verdictTitle = 'Moderate Alignment';
        let verdictMessage = `${candidateName} possesses core relevant competencies but has a few key skill gaps compared to the target role.`;

        if (score >= 70) {
            verdictClass = 'verdict-high';
            verdictIcon = 'fa-circle-check';
            verdictTitle = 'Strong Match';
            verdictMessage = `${candidateName} exhibits strong overall compatibility (${score.toFixed(1)}%) with high alignment across essential qualifications.`;
        } else if (score < 45) {
            verdictClass = 'verdict-low';
            verdictIcon = 'fa-circle-xmark';
            verdictTitle = 'Low Match';
            verdictMessage = `${candidateName} has limited initial alignment (${score.toFixed(1)}%) with noticeable technical and qualification gaps.`;
        }

        // Strengths description
        let strengthsText = '';
        if (matchingSkills.length > 0) {
            const topMatches = matchingSkills.slice(0, 5).map(s => `<strong>${escapeHtml(s)}</strong>`).join(', ');
            const extraCount = matchingSkills.length > 5 ? ` (+${matchingSkills.length - 5} more)` : '';
            strengthsText = `Demonstrates verified proficiencies in ${topMatches}${extraCount}.`;
        } else {
            strengthsText = 'General profile alignment detected, though specific direct technical keyword matches were limited.';
        }

        if (data.experience?.internship) {
            strengthsText += ' Practical internship background verified.';
        }
        if (data.education?.degree && data.education.degree !== 'Not Found') {
            const branchText = (data.education.branch && data.education.branch !== 'Not Found') ? ` in ${escapeHtml(data.education.branch)}` : '';
            strengthsText += ` Qualified with a <strong>${escapeHtml(data.education.degree)}</strong>${branchText}.`;
        }

        // Gaps description
        let gapsText = '';
        if (missingSkills.length > 0) {
            const topGaps = missingSkills.slice(0, 4).map(s => `<strong>${escapeHtml(s)}</strong>`).join(', ');
            const extraGapCount = missingSkills.length > 4 ? ` (+${missingSkills.length - 4} more)` : '';
            gapsText = `Missing key requirements parsed from the Job Description: ${topGaps}${extraGapCount}.`;
        } else {
            gapsText = 'No critical skill gaps identified against the requirements parsed from the Job Description.';
        }

        // Action / Recommendation
        let actionText = '';
        if (missingSkills.length > 0) {
            const primeSkills = missingSkills.slice(0, 3).map(s => `<strong>${escapeHtml(s)}</strong>`).join(', ');
            actionText = `Prioritize focus areas or certifications in: ${primeSkills}. Highlighting practical implementations in these topics will significantly strengthen overall profile suitability.`;
        } else {
            actionText = 'Excellent skill set match! The candidate demonstrates familiarity with all extracted role prerequisites. Recommended to proceed with direct technical interview.';
        }

        return `
            <div class="summary-content-wrapper">
                <div class="summary-verdict-banner ${verdictClass}">
                    <span class="verdict-icon"><i class="fa-solid ${verdictIcon}"></i></span>
                    <div class="verdict-text">
                        <strong>${verdictTitle} (${score.toFixed(1)}%):</strong> ${verdictMessage}
                    </div>
                </div>
                
                <div class="summary-points-grid">
                    <div class="summary-point strengths">
                        <span class="point-label"><i class="fa-solid fa-circle-check text-success"></i> Key Strengths:</span>
                        <span class="point-desc">${strengthsText}</span>
                    </div>
                    <div class="summary-point gaps">
                        <span class="point-label"><i class="fa-solid fa-triangle-exclamation text-warning"></i> Skill Gaps:</span>
                        <span class="point-desc">${gapsText}</span>
                    </div>
                    <div class="summary-point action">
                        <span class="point-label"><i class="fa-solid fa-lightbulb text-info"></i> Recommendation:</span>
                        <span class="point-desc">${actionText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper: Animate progress circular rings
    function animateScoreRing(percent) {
        let count = 0;
        const duration = 1200; // ms
        const steps = 60;
        const stepTime = duration / steps;
        const stepVal = percent / steps;

        // Animate stroke dashoffset
        const offset = circumference - (percent / 100 * circumference);
        elements.progressCircle.style.strokeDashoffset = offset;

        // Color gauge based on match percentage thresholds
        let strokeColor = '#06b6d4'; // default cyan
        let rating = "Weak Match";

        if (percent >= 70) {
            strokeColor = '#10b981'; // Green
            rating = "Excellent Fit";
        } else if (percent >= 40) {
            strokeColor = '#f59e0b'; // Amber
            rating = "Moderate Fit";
        } else if (percent > 0) {
            strokeColor = '#8b5cf6'; // Violet/Purple
            rating = "Weak Fit";
        } else {
            strokeColor = '#ef4444'; // Red
            rating = "No Match";
        }

        document.getElementById('score-gradient').children[0].setAttribute('stop-color', strokeColor);
        elements.scoreRating.textContent = rating;
        elements.scoreRating.style.color = strokeColor;

        // Number count-up loop
        const interval = setInterval(() => {
            count++;
            const currentPercent = (stepVal * count).toFixed(2);
            elements.scoreText.textContent = `${currentPercent}%`;

            if (count >= steps) {
                clearInterval(interval);
                elements.scoreText.textContent = `${percent.toFixed(2)}%`;
            }
        }, stepTime);
    }

    // Helper: tag renderer
    function renderTags(tags, container, tagClass, placeholder) {
        container.innerHTML = '';
        if (!tags || tags.length === 0) {
            const span = document.createElement('span');
            span.className = 'placeholder-text';
            span.textContent = placeholder;
            container.appendChild(span);
            return;
        }

        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = `tag ${tagClass}`;
            span.textContent = tag;
            container.appendChild(span);
        });
    }

    // Helper: experience array details
    function renderExperienceBlocks(expList, container) {
        container.innerHTML = '';
        if (!expList || expList.length === 0) {
            const div = document.createElement('div');
            div.className = 'exp-value-item';
            div.textContent = "Not Mentioned";
            container.appendChild(div);
            return;
        }

        expList.forEach(exp => {
            const div = document.createElement('div');
            div.className = 'exp-value-item';
            div.textContent = exp;
            container.appendChild(div);
        });
    }

    // Helper: education rendering
    function renderEducationTimeline(edu) {
        const list = elements.educationDetailsList;
        list.innerHTML = '';

        let hasDetails = false;

        // Degrees & Branches
        if (edu.degree && edu.degree.length > 0) {
            hasDetails = true;
            
            edu.degree.forEach((deg, idx) => {
                const item = document.createElement('div');
                item.className = 'edu-item';
                
                const bullet = document.createElement('div');
                bullet.className = 'edu-bullet';
                item.appendChild(bullet);

                const content = document.createElement('div');
                content.className = 'edu-content';

                const title = document.createElement('span');
                title.className = 'edu-title';
                title.textContent = deg;
                content.appendChild(title);

                const branch = document.createElement('span');
                branch.className = 'edu-branch';
                branch.textContent = edu.branch[idx] || edu.branch[0] || "Specialization Not Specified";
                content.appendChild(branch);

                // Add scores if parsed
                const scoreGrid = document.createElement('div');
                scoreGrid.className = 'edu-score-grid';

                if (edu.cgpa && edu.cgpa.length > 0 && edu.cgpa[idx]) {
                    const badge = document.createElement('span');
                    badge.className = 'edu-score-badge';
                    badge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> CGPA: ${edu.cgpa[idx]}`;
                    scoreGrid.appendChild(badge);
                }

                if (edu.percentage && edu.percentage.length > 0 && edu.percentage[idx]) {
                    const badge = document.createElement('span');
                    badge.className = 'edu-score-badge';
                    badge.innerHTML = `<i class="fa-solid fa-percent"></i> Score: ${edu.percentage[idx]}`;
                    scoreGrid.appendChild(badge);
                }

                if (scoreGrid.children.length > 0) {
                    content.appendChild(scoreGrid);
                }

                item.appendChild(content);
                list.appendChild(item);
            });
        }

        // Secondary School Levels
        if (edu.school_levels && edu.school_levels.length > 0) {
            hasDetails = true;
            
            edu.school_levels.forEach(level => {
                const item = document.createElement('div');
                item.className = 'edu-item';
                
                const bullet = document.createElement('div');
                bullet.className = 'edu-bullet';
                bullet.style.background = 'var(--color-primary)';
                bullet.style.boxShadow = '0 0 6px var(--color-primary)';
                item.appendChild(bullet);

                const content = document.createElement('div');
                content.className = 'edu-content';

                const title = document.createElement('span');
                title.className = 'edu-title';
                title.textContent = `${level} Standard schooling`;
                content.appendChild(title);

                item.appendChild(content);
                list.appendChild(item);
            });
        }

        if (!hasDetails) {
            list.innerHTML = '<span class="placeholder-text">No educational history parsed from resume.</span>';
        }
    }

    // Reset UI to input states
    function resetMatcher() {
        elements.resultsContainer.classList.add('hidden');
        elements.inputSection.classList.remove('hidden');
        hideError();
        
        // Reset files
        state.resumeFile = null;
        state.jdFile = null;
        elements.resumeFileInput.value = '';
        elements.jdFileInput.value = '';
        elements.jdTextInput.value = '';
        
        elements.resumeFileDetails.style.display = 'none';
        elements.jdFileDetails.style.display = 'none';
        elements.resumeDropZone.classList.remove('hidden');
        elements.jdDropZone.classList.remove('hidden');

        // Reset progress circle
        elements.progressCircle.style.strokeDashoffset = circumference;
        elements.scoreText.textContent = "0.0%";

        // Reset Work History
        if (elements.workHistoryTimeline) {
            elements.workHistoryTimeline.innerHTML = '';
        }
        if (elements.workHistoryBadge) {
            elements.workHistoryBadge.textContent = '0 Records';
        }

        // Reset Summary
        if (elements.recommendationText) {
            elements.recommendationText.innerHTML = '<p>Upload a resume and job description to generate an in-depth profile match summary, key strengths, and tailored gap analysis.</p>';
        }

        showToast("UI reset. Ready for next analysis.");
    }

    // Helper: HTML escaping
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Helper: copy to clipboard
    function copyTextToClipboard(text, message) {
        if (text === "Not Found" || !text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast(message, true);
        }).catch(err => {
            console.error('Clipboard copy failed: ', err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast(message, true);
            } catch (err2) {
                console.error('Fallback clipboard copy failed: ', err2);
            }
            document.body.removeChild(textArea);
        });
    }

    // ==========================================
    // Work / Employment History Renderer
    // ==========================================
    function renderWorkHistory(workHistory) {
        const container = elements.workHistoryTimeline;
        const badge = elements.workHistoryBadge;
        if (!container || !badge) return;

        container.innerHTML = '';

        if (!workHistory || !Array.isArray(workHistory) || workHistory.length === 0) {
            badge.textContent = 'Fresher Profile';
            badge.style.background = 'rgba(6, 182, 212, 0.12)';
            badge.style.color = '#22d3ee';
            badge.style.borderColor = 'rgba(6, 182, 212, 0.25)';

            container.innerHTML = `
                <div class="fresher-banner">
                    <i class="fa-solid fa-graduation-cap fresher-icon"></i>
                    <div>
                        <h4 class="fresher-title">Fresher / Trainee Profile</h4>
                        <p class="fresher-subtitle">No formal commercial work history detected on resume. Academic projects, training, and coursework are factored into candidate suitability.</p>
                    </div>
                </div>
            `;
            return;
        }

        const count = workHistory.length;
        badge.textContent = `${count} ${count === 1 ? 'Record' : 'Records'}`;
        badge.style.background = 'rgba(168, 85, 247, 0.12)';
        badge.style.color = '#c084fc';
        badge.style.borderColor = 'rgba(168, 85, 247, 0.25)';

        workHistory.forEach(item => {
            const duration = item.duration || '';
            const isPresent = duration.toLowerCase().includes('present') || duration.toLowerCase().includes('current');

            const itemEl = document.createElement('div');
            itemEl.className = 'timeline-item';

            const node = document.createElement('div');
            node.className = `timeline-node ${isPresent ? 'active-now' : ''}`;
            itemEl.appendChild(node);

            const contentBox = document.createElement('div');
            contentBox.className = 'timeline-content-box';

            const roleRow = document.createElement('div');
            roleRow.className = 'timeline-role-row';

            const roleSpan = document.createElement('span');
            roleSpan.className = 'timeline-role';
            roleSpan.textContent = item.role || 'Software Developer';
            roleRow.appendChild(roleSpan);

            if (duration) {
                const durationSpan = document.createElement('span');
                durationSpan.className = 'timeline-duration';
                durationSpan.innerHTML = isPresent
                    ? `<i class="fa-solid fa-circle" style="font-size: 0.5rem; margin-right: 4px; color: #10b981;"></i> ${escapeHtml(duration)}`
                    : escapeHtml(duration);
                roleRow.appendChild(durationSpan);
            }
            contentBox.appendChild(roleRow);

            if (item.company) {
                const companyRow = document.createElement('div');
                companyRow.className = 'timeline-company-row';
                companyRow.innerHTML = `<i class="fa-solid fa-building"></i> <span>${escapeHtml(item.company)}</span>`;
                contentBox.appendChild(companyRow);
            }

            if (item.description) {
                const descP = document.createElement('p');
                descP.className = 'timeline-desc';
                descP.textContent = item.description;
                contentBox.appendChild(descP);
            }

            itemEl.appendChild(contentBox);
            container.appendChild(itemEl);
        });
    }

    // ==========================================
    // Match / Evaluation History Management
    // ==========================================
    let clearConfirmTimeout = null;

    async function initHistory() {
        const isExplicitlyCleared = localStorage.getItem('astra_history_cleared') === 'true';

        // 1. Try loading from localStorage first for immediate display
        const local = localStorage.getItem('astra_match_history');
        if (local) {
            try {
                matchHistory = JSON.parse(local);
                updateHistoryCountBadges();
            } catch (e) {
                matchHistory = [];
            }
        }

        // If user explicitly cleared their history and has 0 items, do not re-seed
        if (isExplicitlyCleared && matchHistory.length === 0) {
            updateHistoryCountBadges();
            return;
        }

        // 2. Fetch from backend server API with fallback to static match_history.json
        try {
            let fetchedList = [];
            const res = await fetch(`${API_BASE}/api/history`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.history)) {
                    fetchedList = data.history;
                }
            } else if (!isExplicitlyCleared) {
                // Fallback to static match_history.json if server API is pending restart
                const staticRes = await fetch(`${API_BASE}/match_history.json`);
                if (staticRes.ok) {
                    fetchedList = await staticRes.json();
                }
            }

            if (Array.isArray(fetchedList) && fetchedList.length > 0) {
                const map = new Map();
                fetchedList.forEach(item => map.set(item.id, item));
                matchHistory.forEach(item => {
                    if (!map.has(item.id)) map.set(item.id, item);
                });
                matchHistory = Array.from(map.values());
                saveLocalHistory();
                updateHistoryCountBadges();
            }
        } catch (e) {
            // Network error, local storage handles it smoothly
        }

        renderHistoryList('');
    }

    function saveLocalHistory() {
        try {
            localStorage.setItem('astra_match_history', JSON.stringify(matchHistory));
        } catch (e) {
            console.warn('localStorage save failed: ', e);
        }
    }

    function updateHistoryCountBadges() {
        const count = matchHistory.length;
        if (elements.historyCountBadge) {
            elements.historyCountBadge.textContent = count;
        }
        if (elements.resultsHistoryCount) {
            elements.resultsHistoryCount.textContent = count;
        }
    }

    function openHistoryDrawer() {
        if (!elements.historyDrawer || !elements.drawerBackdrop) return;
        elements.drawerBackdrop.classList.remove('hidden');
        elements.historyDrawer.classList.add('open');
        if (elements.historySearchInput) {
            elements.historySearchInput.value = '';
        }
        renderHistoryList('');
    }

    function closeHistoryDrawer() {
        if (!elements.historyDrawer || !elements.drawerBackdrop) return;
        elements.historyDrawer.classList.remove('open');
        elements.drawerBackdrop.classList.add('hidden');
    }

    function addMatchToHistory(result, resumeName, jdName) {
        localStorage.removeItem('astra_history_cleared');

        const candidateName = result.personal_details?.name && result.personal_details.name !== 'Not Found'
            ? result.personal_details.name
            : (resumeName || 'Candidate Profile');
        const role = result.experience?.current_role && result.experience.current_role !== 'Not Found'
            ? result.experience.current_role
            : 'Candidate';

        const historyItem = {
            id: result.history_id || 'h_' + Date.now().toString(36),
            timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            iso_time: new Date().toISOString(),
            candidate_name: candidateName,
            role: role,
            score: result.match_score,
            resume_file: resumeName || 'Resume file',
            jd_title: jdName || 'Job Description',
            analysis: result
        };

        const existingIdx = matchHistory.findIndex(h => h.id === historyItem.id);
        if (existingIdx >= 0) {
            matchHistory[existingIdx] = historyItem;
        } else {
            matchHistory.unshift(historyItem);
        }
        if (matchHistory.length > 100) matchHistory.pop();

        saveLocalHistory();
        updateHistoryCountBadges();
    }

    function renderHistoryList(filterQuery = '') {
        const container = elements.historyItemsContainer;
        if (!container) return;

        container.innerHTML = '';

        const filtered = matchHistory.filter(item => {
            if (!filterQuery) return true;
            const term = filterQuery.toLowerCase();
            return (item.candidate_name || '').toLowerCase().includes(term) ||
                   (item.role || '').toLowerCase().includes(term) ||
                   (item.jd_title || '').toLowerCase().includes(term) ||
                   String(item.score || '').includes(term);
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="history-empty-state">
                    <i class="fa-solid fa-clock-rotate-left history-empty-icon"></i>
                    <h4 class="history-empty-title">${matchHistory.length === 0 ? 'No Evaluations Yet' : 'No Matching Records'}</h4>
                    <p class="history-empty-desc">${matchHistory.length === 0 ? 'Upload a resume and job description to see your evaluation history here.' : 'Try searching with a different candidate name, job title, or score.'}</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const scoreVal = parseFloat(item.score) || 0;
            let scoreClass = 'score-low';
            let badgeClass = 'score-badge-low';
            if (scoreVal >= 70) {
                scoreClass = 'score-high';
                badgeClass = 'score-badge-high';
            } else if (scoreVal >= 40) {
                scoreClass = 'score-mid';
                badgeClass = 'score-badge-mid';
            }

            const initial = (item.candidate_name || 'U').charAt(0).toUpperCase();

            const card = document.createElement('div');
            card.className = `history-card-item ${scoreClass}`;
            card.title = "Click anywhere on this card to load full analysis";

            card.innerHTML = `
                <div class="history-card-header">
                    <div class="history-cand-info">
                        <div class="history-avatar">${escapeHtml(initial)}</div>
                        <div class="history-title-group">
                            <h4 class="history-name" title="${escapeHtml(item.candidate_name)}">${escapeHtml(item.candidate_name)}</h4>
                            <p class="history-subinfo" title="${escapeHtml(item.role)} • ${escapeHtml(item.jd_title)}">
                                ${escapeHtml(item.role)} • ${escapeHtml(item.jd_title)}
                            </p>
                        </div>
                    </div>
                    <span class="history-score-badge ${badgeClass}">${scoreVal.toFixed(1)}%</span>
                </div>
                <div class="history-meta-row">
                    <span class="history-meta-files" title="${escapeHtml(item.resume_file)}">
                        <i class="fa-solid fa-file-pdf"></i> ${escapeHtml(item.resume_file)}
                    </span>
                    <span>${escapeHtml(item.timestamp)}</span>
                </div>
                <div class="history-actions-row">
                    <span class="history-click-hint"><i class="fa-regular fa-hand-pointer"></i> Click card to view</span>
                    <div class="history-buttons-group">
                        <button class="btn-history-load" data-id="${escapeHtml(item.id)}" type="button" title="Load this evaluation into dashboard">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Load Result
                        </button>
                        <button class="btn-history-del" data-id="${escapeHtml(item.id)}" title="Delete record" type="button">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </div>
            `;

            // Clicking anywhere on the card loads the analysis
            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-history-del')) return;
                loadHistoryItem(item);
            });

            // Bind Load Button
            const loadBtn = card.querySelector('.btn-history-load');
            if (loadBtn) {
                loadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadHistoryItem(item);
                });
            }

            // Bind Delete Button
            const delBtn = card.querySelector('.btn-history-del');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteHistoryItem(item.id);
                });
            }

            container.appendChild(card);
        });
    }

    function loadHistoryItem(item) {
        if (!item || !item.analysis) {
            showToast("No analysis payload stored for this entry.", false);
            return;
        }
        renderDashboard(item.analysis);
        closeHistoryDrawer();
        showToast(`Loaded evaluation for ${item.candidate_name}`, true);
        setTimeout(() => {
            elements.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    async function deleteHistoryItem(id) {
        matchHistory = matchHistory.filter(h => h.id !== id);
        saveLocalHistory();
        if (matchHistory.length === 0) {
            localStorage.setItem('astra_history_cleared', 'true');
        }
        updateHistoryCountBadges();
        const query = elements.historySearchInput ? elements.historySearchInput.value.trim().toLowerCase() : '';
        renderHistoryList(query);

        try {
            await fetch(`${API_BASE}/api/history/${id}`, { method: 'DELETE' });
        } catch (e) {
            // Ignore API network errors; local update already applied
        }
        showToast("Record removed from history.", true);
    }

    async function clearAllHistory() {
        if (!matchHistory || matchHistory.length === 0) {
            showToast("History is already empty.");
            return;
        }

        // Two-click instant inline confirmation (no browser-blocking window.confirm)
        if (!elements.clearHistoryBtn.classList.contains('confirm-state')) {
            elements.clearHistoryBtn.classList.add('confirm-state');
            elements.clearHistoryBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Confirm Clear?';
            showToast("Click 'Confirm Clear?' again to clear all records.", false);

            if (clearConfirmTimeout) clearTimeout(clearConfirmTimeout);
            clearConfirmTimeout = setTimeout(() => {
                if (elements.clearHistoryBtn) {
                    elements.clearHistoryBtn.classList.remove('confirm-state');
                    elements.clearHistoryBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Clear All';
                }
            }, 4000);
            return;
        }

        // Confirmed! Clear everything immediately
        if (clearConfirmTimeout) clearTimeout(clearConfirmTimeout);
        elements.clearHistoryBtn.classList.remove('confirm-state');
        elements.clearHistoryBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Clear All';

        matchHistory = [];
        localStorage.setItem('astra_match_history', JSON.stringify([]));
        localStorage.setItem('astra_history_cleared', 'true');
        updateHistoryCountBadges();
        renderHistoryList('');

        try {
            await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
        } catch (e) {
            // Ignore API network errors; client state is cleared
        }

        showToast("All match history cleared successfully.", true);
    }

    // Backend Connection Health Monitor
    async function checkBackendConnection() {
        const badge = document.getElementById('backend-status-badge');
        const dot = document.getElementById('backend-status-dot');
        const label = document.getElementById('backend-status-label');
        if (!badge || !dot || !label) return;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                dot.className = 'status-dot connected';
                label.textContent = 'Backend: Connected';
                badge.className = 'backend-status-badge online';
                badge.title = `Connected to SkillSync backend (${API_BASE || window.location.origin})`;
                return true;
            } else {
                throw new Error('Server returned status: ' + res.status);
            }
        } catch (e) {
            dot.className = 'status-dot disconnected';
            label.textContent = 'Backend: Offline';
            badge.className = 'backend-status-badge offline';
            badge.title = 'Cannot reach backend server on http://127.0.0.1:5000. Run python server.py to start it!';
            return false;
        }
    }

    // Initialize backend connection check and periodic polling
    checkBackendConnection();
    setInterval(checkBackendConnection, 8000);
});
