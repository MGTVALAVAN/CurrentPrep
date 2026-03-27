/**
 * Rule-Driven Fact-Checker for ePaper Content
 *
 * ALL rules are loaded from src/data/fact-reference.json → factCheckRules[].
 * To add new checks, just add a rule to that JSON array — zero code changes needed.
 *
 * Rule schema:
 *   id           : unique string identifier
 *   severity     : "critical" | "warning"
 *   scope        : "articles" | "quickBytes" | "consistency"
 *   detectPattern: regex pattern string to find the error
 *   detectFlags  : regex flags (e.g. "i", "gi")
 *   requireAlso  : (optional) text must ALSO match this pattern
 *   requireAlso2 : (optional) second additional required pattern
 *   excludeIf    : (optional) skip if text matches this pattern (avoids false positives)
 *   issue        : human-readable description of the problem
 *   correction   : what the correct text should say
 *   autoFix      : (optional) { field, searchPattern, searchFlags, replacement }
 *     field          : which article field to fix ("explainer", "trivia", "text")
 *     searchPattern  : regex pattern to find in that field
 *     searchFlags    : regex flags for search
 *     replacement    : replacement string
 *
 * For scope "consistency":
 *   consistencyField   : which article field to scan (e.g. "headline")
 *   consistencyExtract : regex to extract a numeric value
 *
 * Usage: npx tsx scripts/fact-check-epaper.ts [date]
 *
 * Exit codes:
 *   0 = all checks passed (or only warnings)
 *   1 = critical factual errors found (unfixed)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// ── Types ───────────────────────────────────────────────────────────────

interface FactCheckRule {
    id: string;
    severity: 'critical' | 'warning';
    scope: 'articles' | 'quickBytes' | 'consistency';
    detectPattern: string;
    detectFlags?: string;
    requireAlso?: string;
    requireAlso2?: string;
    excludeIf?: string;
    issue: string;
    correction?: string;
    autoFix?: {
        field: string;
        searchPattern: string;
        searchFlags?: string;
        replacement: string;
    };
    // For consistency checks
    consistencyField?: string;
    consistencyExtract?: string;
}

interface FactIssue {
    severity: 'critical' | 'warning';
    ruleId: string;
    location: string;
    issue: string;
    correction?: string;
    autoFixed: boolean;
}

// ── Load data ───────────────────────────────────────────────────────────

const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];
const DATA_FILE = path.join(process.cwd(), 'src/data/epaper', `epaper-${dateArg}.json`);
const FACT_REF_FILE = path.join(process.cwd(), 'src/data/fact-reference.json');

let data: any;
let factRef: any;

try {
    data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
} catch (e: any) {
    console.error(`❌ Cannot read ePaper file: ${DATA_FILE}`);
    process.exit(1);
}

try {
    factRef = JSON.parse(readFileSync(FACT_REF_FILE, 'utf-8'));
} catch (e: any) {
    console.error(`❌ Cannot read fact reference file: ${FACT_REF_FILE}`);
    process.exit(1);
}

const rules: FactCheckRule[] = factRef.factCheckRules || [];
if (rules.length === 0) {
    console.log('⚠️ No factCheckRules found in fact-reference.json. Nothing to check.');
    process.exit(0);
}

const issues: FactIssue[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────

function getAllText(article: any): string {
    return [
        article.headline || '',
        article.explainer || '',
        article.trivia || '',
        article.didYouKnow || '',
        ...(article.prelimsPoints || []),
        ...(article.mainsPoints || []),
    ].join(' ');
}

function matchesPattern(text: string, pattern: string, flags?: string): boolean {
    try {
        return new RegExp(pattern, flags || '').test(text);
    } catch {
        return false;
    }
}

function addIssue(severity: FactIssue['severity'], ruleId: string, location: string, issue: string, correction?: string, autoFixed = false) {
    issues.push({ severity, ruleId, location, issue, correction, autoFixed });
}

// ── Process rules ───────────────────────────────────────────────────────

console.log(`\n📋 Fact-Checker: Loading ${rules.length} rules from fact-reference.json...\n`);

for (const rule of rules) {
    console.log(`  🔍 Rule [${rule.id}] (${rule.severity})...`);

    if (rule.scope === 'articles') {
        for (let i = 0; i < data.articles.length; i++) {
            const a = data.articles[i];
            const text = getAllText(a);
            const loc = `Article ${i}: ${a.headline?.substring(0, 60)}`;

            // Primary pattern must match
            if (!matchesPattern(text, rule.detectPattern, rule.detectFlags)) continue;

            // requireAlso must also match (if specified)
            if (rule.requireAlso && !matchesPattern(text, rule.requireAlso, 'i')) continue;
            if (rule.requireAlso2 && !matchesPattern(text, rule.requireAlso2, 'i')) continue;

            // excludeIf: skip if this pattern matches (avoids false positives)
            if (rule.excludeIf && matchesPattern(text, rule.excludeIf, rule.detectFlags)) continue;

            // Matched! Try auto-fix if available
            let fixed = false;
            if (rule.autoFix) {
                const field = rule.autoFix.field as string;
                if (a[field] && typeof a[field] === 'string') {
                    const before = a[field];
                    try {
                        const searchRe = new RegExp(rule.autoFix.searchPattern, rule.autoFix.searchFlags || 'g');
                        a[field] = a[field].replace(searchRe, rule.autoFix.replacement);
                        if (a[field] !== before) {
                            addIssue(rule.severity, rule.id, loc, `Auto-fixed: ${rule.issue}`, rule.correction, true);
                            fixed = true;
                        }
                    } catch { /* regex error — skip auto-fix */ }
                }
            }

            if (!fixed) {
                addIssue(rule.severity, rule.id, loc, rule.issue, rule.correction);
            }
        }
    } else if (rule.scope === 'quickBytes') {
        const qbs = data.quickBytes || [];
        for (let i = 0; i < qbs.length; i++) {
            const qb = qbs[i];
            const text = qb.text || qb.fact || '';
            const loc = `Quick Bytes[${i}]`;

            if (!matchesPattern(text, rule.detectPattern, rule.detectFlags)) continue;
            if (rule.requireAlso && !matchesPattern(text, rule.requireAlso, 'i')) continue;
            if (rule.excludeIf && matchesPattern(text, rule.excludeIf, rule.detectFlags)) continue;

            let fixed = false;
            if (rule.autoFix) {
                const field = rule.autoFix.field as string;
                if (qb[field] && typeof qb[field] === 'string') {
                    const before = qb[field];
                    try {
                        const searchRe = new RegExp(rule.autoFix.searchPattern, rule.autoFix.searchFlags || 'g');
                        qb[field] = qb[field].replace(searchRe, rule.autoFix.replacement);
                        if (qb[field] !== before) {
                            addIssue(rule.severity, rule.id, loc, `Auto-fixed: ${rule.issue}`, rule.correction, true);
                            fixed = true;
                        }
                    } catch { /* regex error */ }
                }
            }

            if (!fixed) {
                addIssue(rule.severity, rule.id, loc, rule.issue, rule.correction);
            }
        }
    } else if (rule.scope === 'consistency') {
        // Extract values from multiple articles and check for inconsistencies
        const field = rule.consistencyField || 'headline';
        const extractPattern = rule.consistencyExtract;
        if (!extractPattern) continue;

        const extracted: { articleIdx: number; value: string; headline: string }[] = [];
        for (let i = 0; i < data.articles.length; i++) {
            const a = data.articles[i];
            const fieldText = a[field] || '';

            if (!matchesPattern(fieldText, rule.detectPattern, rule.detectFlags)) continue;

            // Also check explainer
            const textsToScan = [fieldText, a.explainer || ''];
            for (const t of textsToScan) {
                try {
                    const extractRe = new RegExp(extractPattern, 'i');
                    const match = t.match(extractRe);
                    if (match && match[1]) {
                        extracted.push({ articleIdx: i, value: match[1], headline: a.headline });
                    }
                } catch { /* skip */ }
            }
        }

        if (extracted.length > 1) {
            const uniqueVals = [...new Set(extracted.map(e => e.value))];
            if (uniqueVals.length > 1) {
                addIssue(rule.severity, rule.id, 'Multiple articles',
                    `${rule.issue}: ${uniqueVals.join(' vs ')} found across ${extracted.length} references`,
                    rule.correction);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════════════

const criticals = issues.filter(i => i.severity === 'critical' && !i.autoFixed);
const warnings = issues.filter(i => i.severity === 'warning' && !i.autoFixed);
const autoFixed = issues.filter(i => i.autoFixed);

console.log('\n' + '═'.repeat(60));
console.log('  FACT-CHECK RESULTS');
console.log('═'.repeat(60));

if (autoFixed.length > 0) {
    console.log(`\n  🔧 Auto-Fixed: ${autoFixed.length}`);
    autoFixed.forEach(i => console.log(`     ✅ [${i.ruleId}] ${i.location} — ${i.issue}`));
}

if (criticals.length > 0) {
    console.log(`\n  ❌ Critical Errors: ${criticals.length}`);
    criticals.forEach(i => {
        console.log(`     ❌ [${i.ruleId}] ${i.location}`);
        console.log(`        Issue: ${i.issue}`);
        if (i.correction) console.log(`        Should be: "${i.correction}"`);
    });
}

if (warnings.length > 0) {
    console.log(`\n  ⚠️  Warnings: ${warnings.length}`);
    warnings.forEach(i => {
        console.log(`     ⚠️  [${i.ruleId}] ${i.location}`);
        console.log(`        ${i.issue}`);
    });
}

if (criticals.length === 0 && warnings.length === 0 && autoFixed.length === 0) {
    console.log('\n  ✅ All fact checks passed! No issues found.');
}

console.log('\n' + '═'.repeat(60));

// ── Save auto-fixed data ────────────────────────────────────────────────

if (autoFixed.length > 0) {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✅ Auto-fixed ${autoFixed.length} issues and saved to ${DATA_FILE}`);
}

// ── Exit code ───────────────────────────────────────────────────────────

if (criticals.length > 0) {
    console.log(`\n❌ FACT-CHECK FAILED — ${criticals.length} critical error(s) need manual review.`);
    process.exit(1);
} else {
    console.log(`\n✅ FACT-CHECK PASSED${warnings.length > 0 ? ` with ${warnings.length} warning(s)` : ''}.`);
    process.exit(0);
}
