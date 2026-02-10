/**
 * Job site URL patterns for auto-detection
 * Ported from V1 service-worker.js
 */
export const JOB_SITE_PATTERNS = [
    // LinkedIn Jobs - multiple URL formats
    { pattern: /linkedin\.com\/jobs\/view\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/collections\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\/search\//i, site: 'LinkedIn' },
    { pattern: /linkedin\.com\/jobs\?/i, site: 'LinkedIn' },  // Jobs with query params
    { pattern: /linkedin\.com\/jobs\/$/i, site: 'LinkedIn' }, // Base jobs URL
    { pattern: /linkedin\.com\/jobs$/i, site: 'LinkedIn' },   // Base jobs URL no trailing slash
    { pattern: /linkedin\.com\/my-items\/saved-jobs/i, site: 'LinkedIn' },
    { pattern: /currentJobId=/i, site: 'LinkedIn' },  // Job modal open (key indicator!)


    // Indeed
    { pattern: /indeed\.com\/viewjob/i, site: 'Indeed' },
    { pattern: /indeed\.com\/jobs\?/i, site: 'Indeed' },

    // Greenhouse (hosted job boards)
    { pattern: /boards\.greenhouse\.io\/.*\/jobs\//i, site: 'Greenhouse' },
    { pattern: /job-boards\.greenhouse\.io/i, site: 'Greenhouse' },

    // Lever
    { pattern: /jobs\.lever\.co\//i, site: 'Lever' },

    // Workday
    { pattern: /myworkdayjobs\.com\/.*\/job\//i, site: 'Workday' },
    { pattern: /wd\d+\.myworkdaysite\.com/i, site: 'Workday' },

    // Glassdoor
    { pattern: /glassdoor\.com\/job-listing\//i, site: 'Glassdoor' },

    // ZipRecruiter
    { pattern: /ziprecruiter\.com\/c\/.*\/job\//i, site: 'ZipRecruiter' },
    { pattern: /ziprecruiter\.com\/jobs\//i, site: 'ZipRecruiter' },

    // Monster
    { pattern: /monster\.com\/job-openings\//i, site: 'Monster' },

    // AngelList / Wellfound
    { pattern: /wellfound\.com\/jobs/i, site: 'Wellfound' },
    { pattern: /angel\.co\/company\/.*\/jobs/i, site: 'AngelList' },

    // Dice (tech jobs)
    { pattern: /dice\.com\/job-detail\//i, site: 'Dice' },

    // SimplyHired
    { pattern: /simplyhired\.com\/job\//i, site: 'SimplyHired' },

    // CareerBuilder
    { pattern: /careerbuilder\.com\/job\//i, site: 'CareerBuilder' },

    // Built In
    { pattern: /builtin\.com\/job\//i, site: 'BuiltIn' },

    // Company career pages (generic patterns)
    { pattern: /careers\.[^\/]+\.com\/.*job/i, site: 'Career Page' },
    { pattern: /jobs\.[^\/]+\.com\//i, site: 'Jobs Page' },
    { pattern: /\/careers\/.*positions?\//i, site: 'Career Page' },
    { pattern: /\/jobs\/\d+/i, site: 'Job Page' },
];

/**
* Check if a URL matches any job site pattern
*/
export function detectJobSite(url: string): string | null {
    console.log('[JobSwyft] Testing URL:', url);
    for (const { pattern, site } of JOB_SITE_PATTERNS) {
        if (pattern.test(url)) {
            console.log('[JobSwyft] ✓ Matched pattern:', pattern.toString(), '→', site);
            return site;
        }
    }
    return null;
}
