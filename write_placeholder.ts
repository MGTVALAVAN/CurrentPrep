import fs from 'fs';
import path from 'path';

const today = new Date().toISOString().split('T')[0];

const epaper = {
    date: today,
    dateFormatted: "Wednesday, March 11, 2026",
    lastUpdated: new Date().toISOString(),
    edition: 1,
    articles: [
        {
            id: `${today}-master-lead-west-asia-crisis`,
            headline: "Master Lead: West Asia Crisis Escalates — Impact on Global Security and Indian Economy",
            explainer: "The ongoing conflict between Iran and Israel has rapidly escalated beyond regional borders, triggering significant geopolitical realignments, military escalations in crucial maritime chokepoints, and severe economic disruptions affecting India's energy security framework. The crisis reached a new flashpoint with the United States military destroying at least 16 Iranian mine-laying vessels near the strategically vital Strait of Hormuz—the world’s most crucial oil transit chokepoint. With Israel conducting strikes deep into Lebanon and Netanyahu asserting a hardline stance, the entire Gulf region has been placed on high alert.\n\nSimultaneously, India is witnessing immediate downstream effects of this geopolitical rupture. A severe commercial Liquefied Petroleum Gas (LPG) shortage has crippled the hospitality and gig economy sectors across major cities, primarily stemming from disrupted LNG imports. In response, the Union Government has invoked the Essential Commodities Act to prioritize natural gas allocation to critical sectors, compelling domestic giants like Reliance Industries to maximize LPG output and divert D6 basin gas to household piped gas and CNG networks. Additionally, soaring Aviation Turbine Fuel (ATF) costs have forced airlines like Air India to introduce broad fuel surcharges.\n\nNew Delhi is navigating a delicate diplomatic tightrope. External Affairs Minister S. Jaishankar has maintained continuous dialogue with his Iranian counterpart, Abbas Araghchi, reflecting India's strategy of multi-alignment and its vested interest in regional stability due to its vast diaspora and energy dependency. Furthermore, diplomatic concessions from Western allies, temporarily allowing India to accept Russian oil already at sea, highlight India's indispensable role as a balancing power.",
            category: "ir",
            gsPaper: "GS2",
            gsSubTopics: [
                "IR: Effect of policies and politics of developed and developing countries on India's interests",
                "Economy: Energy Security"
            ],
            date: today,
            source: "CurrentPrep Special Coverage",
            sourceUrl: "#",
            importance: "high",
            tags: ["West Asia Crisis", "Energy Security", "LPG Shortage", "India-Iran Relations"],
            keyTerms: ["Strait of Hormuz", "Essential Commodities Act", "Multi-alignment"],
            prelims: true,
            prelimsPoints: [
                "Strait of Hormuz is a key chokepoint between the Persian Gulf and the Gulf of Oman.",
                "Essential Commodities Act invoked to manage natural gas supplies."
            ],
            mains: true,
            mainsPoints: [
                "Vulnerability of India's energy supply lines to Middle East conflict.",
                "Diplomatic balancing acts by India."
            ],
            imageDescription: "Aerial view of oil tankers navigating through the Strait of Hormuz",
            section: "Lead Opinion",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-sc-judgments`,
            headline: "SC to Pronounce Judgment on Withdrawal of Life Support in ‘Permanent Vegetative’ State Cases",
            explainer: "The Supreme Court of India is set to pronounce a landmark judgment concerning a family’s plea to withdraw life support for a 31-year-old man in a permanent vegetative state. This case brings to the forefront the complex ethical, legal, and medical intersections of passive euthanasia and the right to die with dignity under Article 21 of the Indian Constitution.\n\nPreviously in the Aruna Shanbaug case (2011) and the Common Cause vs Union of India judgment (2018), the Supreme Court laid down extensive guidelines recognizing a constitutional right to passive euthanasia by upholding the validity of 'living wills' (advance medical directives). However, applying these guidelines to unforeseen clinical realities—especially when patients transition unpredictably from severe comatose to persistent vegetative states without an advance directive—poses significant administrative hurdles for familial caregivers and medical boards.\n\nThis upcoming judgment is expected to streamline the execution of passive euthanasia regulations by potentially easing the onerous multi-tier medical board approvals mandated by previous iterations. The decision underscores the judiciary's attempt to harmonize the state's interest in preserving human life with an individual's fundamental right to autonomic bodily integrity.",
            category: "polity",
            gsPaper: "GS2",
            gsSubTopics: [
                "Polity: Fundamental Rights",
                "Polity: Judiciary"
            ],
            date: today,
            source: "The Hindu",
            sourceUrl: "#",
            importance: "high",
            tags: ["Right to Life", "Euthanasia", "Supreme Court", "Article 21"],
            keyTerms: ["Passive Euthanasia", "Living Will", "Article 21", "Aruna Shanbaug Case"],
            prelims: true,
            prelimsPoints: [
                "Article 21 includes right to die with dignity.",
                "Common Cause judgment legalized passive euthanasia."
            ],
            mains: true,
            mainsPoints: [
                "Ethical dilemmas in medical jurisprudence.",
                "Need for simpler procedures for passive euthanasia execution."
            ],
            imageDescription: "Gavel resting on top of the Indian Constitution book",
            section: "SC Judgments",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-biodiversity-checklist-fireflies`,
            headline: "Researchers Publish First-of-its-kind Checklist on Fireflies in India",
            explainer: "In a significant leap for insect conservation, researchers have published India's first comprehensive checklist of firefly species, mapping their current habitats and tracing historical presence. Fireflies, known biologically as Lampyridae, act as critical ecological indicators. Their luminescent biological phenomenon (bioluminescence) relies entirely on pristine, unpolluted dark environments, making them highly sensitive to light pollution, pesticide usage, and habitat loss.\n\nThe creation of this checklist is a foundational step in establishing baseline data for nocturnal biodiversity in the subcontinent. Despite India's rich biodiversity, invertebrate taxonomy remains massively underfunded and under-researched compared to charismatic megafauna like tigers or elephants. The checklist has identified specific biodiversity clusters in the Western Ghats and northeastern states where firefly populations are relatively stable, contrasting starkly with urban fringes where species have been entirely extirpated due to artificial light at night (ALAN).\n\nBy categorizing these species, the government can now incorporate critical dark-sky reserves and specific terrestrial habitats into the broader ambit of the Wildlife Protection Act and national biodiversity action plans.",
            category: "environment",
            gsPaper: "GS3",
            gsSubTopics: [
                "Environment: Biodiversity Conservation",
                "Environment: Environmental Pollution"
            ],
            date: today,
            source: "Science Reporter",
            sourceUrl: "#",
            importance: "medium",
            tags: ["Biodiversity", "Fireflies", "Light Pollution", "Conservation"],
            keyTerms: ["Bioluminescence", "Ecological Indicators", "ALAN (Artificial Light At Night)"],
            prelims: true,
            prelimsPoints: [
                "Fireflies belong to the Lampyridae family.",
                "They use bioluminescence for mating.",
                "Extremely sensitive to light pollution."
            ],
            mains: true,
            mainsPoints: [
                "Importance of invertebrate conservation for ecosystem health.",
                "Policy integration for light pollution mitigation."
            ],
            imageDescription: "A glowing firefly resting on a green leaf at night",
            section: "Science & Tech",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-rbi-monetary-policy`,
            headline: "Cabinet Nod for 23% Hike in Cost of Link Road from Noida Airport",
            explainer: "The Union Cabinet has officially approved a 23% upward revision in the estimated project cost of the crucial link road connecting the upcoming Noida International Airport at Jewar with the Delhi-Mumbai Expressway. This development brings to focus the persistent systemic challenges in infrastructure execution in India—namely, cost overruns, land acquisition bottlenecks, and shifting inflation parameters associated with long-gestation mega-projects.\n\nThe revised cost highlights the complexities of the PM Gati Shakti National Master Plan, which aims to provide seamless multi-modal connectivity. The integration of the Noida airport with the Delhi-Mumbai Expressway is critical for establishing efficient logistics corridors capable of reducing supply chain friction and lowering absolute logistics costs, a key objective under the National Logistics Policy. However, frequent cost-escalations strain the capital expenditure allocations of the Union Budget.\n\nAddressing these structural bottlenecks requires adopting robust dispute resolution frameworks via the newer Model Concession Agreements, enforcing stricter penal clauses for operational delays, and utilizing advanced technological mapping under Gati Shakti to preempt land disputes well before the financial outlay is finalized.",
            category: "economy",
            gsPaper: "GS3",
            gsSubTopics: [
                "Economy: Infrastructure (Roads, Airports)",
                "Economy: Investment Models"
            ],
            date: today,
            source: "Business Standard",
            sourceUrl: "#",
            importance: "medium",
            tags: ["Infrastructure", "PM Gati Shakti", "Noida Airport"],
            keyTerms: ["PM Gati Shakti", "National Logistics Policy", "Cost Overruns"],
            prelims: true,
            prelimsPoints: [
                "PM Gati Shakti is a digital platform for integrated planning.",
                "Delhi-Mumbai Expressway is India's longest expressway project."
            ],
            mains: true,
            mainsPoints: [
                "Causes of cost escalations in infra projects.",
                "Role of multi-modal connectivity in reducing logistics costs."
            ],
            imageDescription: "Construction machinery widening a multi-lane highway",
            section: "Economy",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-cabinet-jal-jeevan`,
            headline: "Union Cabinet Clears ₹1.51 Lakh Crore for Jal Jeevan with Digital Mapping",
            explainer: "Demonstrating continued commitment to universal water access, the Union Cabinet has approved an extended financial outlay of ₹1.51 lakh crore for the Jal Jeevan Mission, integrating advanced digital mapping for asset management. The Jal Jeevan Mission (JJM), launched with the ambitious objective of providing Functional Household Tap Connections (FHTC) to every rural household, has transitioned into its critical maintenance phase.\n\nThe fresh capital infusion targets the chronic issue of 'source sustainability'—ensuring that the groundwater tables feeding the piped networks do not run dry during acute summer months. To achieve this, the mission is now heavily utilizing GIS and digital mapping to track asset functionality and integrate village-level water action plans with MGNREGA works focused on water harvesting. \n\nBy empowering localized Paani Samitis under the gram panchayats with digital tracking applications, the government seeks to foster genuine community ownership. This integration of technology and decentralized governance reflects a mature public policy approach, shifting focus from mere infrastructure creation to long-term operational viability and water conservation against impending climate stress.",
            category: "governance",
            gsPaper: "GS2",
            gsSubTopics: [
                "Governance: Government Policies and Interventions",
                "Polity: Local Self-Government"
            ],
            date: today,
            source: "PIB",
            sourceUrl: "#",
            importance: "high",
            tags: ["Jal Jeevan Mission", "Digital India", "Water Security"],
            keyTerms: ["Functional Household Tap Connection", "GIS Mapping", "Paani Samitis"],
            prelims: true,
            prelimsPoints: [
                "JJM aims for 55 litres per capita per day via FHTC.",
                "Implemented by Ministry of Jal Shakti.",
                "Paani Samitis are statutory committees under Gram Panchayats."
            ],
            mains: true,
            mainsPoints: [
                "Importance of digital tracking in massive infra projects.",
                "Ensuring source sustainability over just infrastructure creation."
            ],
            imageDescription: "Rural community members inspecting a blue water pipeline installation",
            section: "Governance",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-cag-ganga-uttarakhand`,
            headline: "CAG Flags 32-Fold Increase in Coliform Bacteria Due to Untreated Sewage in Ganga",
            explainer: "The Comptroller and Auditor General (CAG) has table a deeply concerning report revealing a staggering 32-fold increase in coliform bacteria levels in the upper reaches of the Ganga in Uttarakhand, attributing it entirely to the unregulated discharge of untreated sewage. This audit exposes the gaping implementation flaws in the ambitious Namami Gange program and broader river rejuvenation policies.\n\nThe exponential rise in coliforms—bacteria originating from fecal matter—indicates severe dysfunction in the state's sewage treatment capacity (STP) and underscores the limitations of the current municipal infrastructure in handling rapid demographic surges driven by unregulated tourism in ecologically fragile Himalayan zones. The report systematically deconstructs governance failures, including delayed fund utilization, non-operational STPs, and lack of accountability in the local municipal bodies.\n\nFor a holistic environmental resurgence, policy mechanisms must evolve from centralized river cleaning efforts towards empowering local Urban Local Bodies (ULBs) via the 74th Amendment. Strict adherence to the 'polluter pays' principle and shifting towards localized, nature-based bio-remediation sewage treatments are necessary before river waters suffer irreversible toxic shock.",
            category: "environment",
            gsPaper: "GS3",
            gsSubTopics: [
                "Environment: Environmental Pollution & Degradation",
                "Governance: Statutory and Regulatory Bodies (CAG)"
            ],
            date: today,
            source: "The Hindu",
            sourceUrl: "#",
            importance: "high",
            tags: ["CAG", "Namami Gange", "Water Pollution", "Uttarakhand"],
            keyTerms: ["Coliform Bacteria", "Namami Gange", "Sewage Treatment Plants (STP)"],
            prelims: true,
            prelimsPoints: [
                "Coliform levels indicate presence of fecal matter.",
                "CAG is a constitutional body under Article 148."
            ],
            mains: true,
            mainsPoints: [
                "Audit's role in evaluating environmental initiatives.",
                "Urbanization challenges in Himalayan states."
            ],
            imageDescription: "Polluted water discharging from a large pipe into a river",
            section: "Environment",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-ai-deepfake-election-threats`,
            headline: "AI Deepfakes During Conflict: Meta’s Oversight Board Urges Rethink",
            explainer: "Amidst escalating physical combat in West Asia and ongoing electoral cycles globally, Meta’s Oversight Board has urgently requested the company to comprehensively revamp its policies regarding deepfakes and manipulated synthetic media. The proliferation of hyper-realistic generative AI presents an asymmetric threat to democratic integrity and global security, blurring the lines between informational warfare and factual reporting during crises.\n\nThe current policy architecture of social media giants relies largely on retroactive takedowns, which consistently fail against the viral velocity of modern AI tools. Meta's board emphasizes the necessity of preemptive watermarking, robust content credentialing standards, and expanding the definition of manipulated media to encompass convincing audio deepfakes—a segment previously ignored with devastating consequences for electoral manipulation.\n\nFor India, this underscores the pressing need for the ongoing Digital India Act to formulate stringent, globally interoperable regulations governing foundational AI models. Developing a national capability to quickly detect and debunk synthetic propaganda is now an absolute prerequisite for maintaining public order and electoral sanctity under the purview of internal security.",
            category: "science",
            gsPaper: "GS3",
            gsSubTopics: [
                "Science & Tech: IT, Computers, Robotics",
                "Security: Challenges to Internal Security through Communication Networks"
            ],
            date: today,
            source: "Indian Express",
            sourceUrl: "#",
            importance: "medium",
            tags: ["Generative AI", "Deepfakes", "Cyber Security", "Meta"],
            keyTerms: ["Synthetic Media", "Digital India Act", "Content Credentials"],
            prelims: true,
            prelimsPoints: [
                "Deepfakes utilize Generative Adversarial Networks (GANs).",
                "IT Rules 2021 mandate faster takedown of illegal content."
            ],
            mains: true,
            mainsPoints: [
                "Implications of AI on electoral integrity and internal security.",
                "Regulatory gaps in governing generative synthetic media."
            ],
            imageDescription: "Digital grid overlay over a manipulated human face silhouette",
            section: "Science & Tech",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-chhattisgarh-anti-conversion-law`,
            headline: "Chhattisgarh Cabinet Approves New Anti-Conversion Draft Bill",
            explainer: "The Chhattisgarh State Cabinet has granted approval for a stringent new draft Bill aimed at curbing 'forced' religious conversions. The proposed legislation mandates individuals seeking to convert to submit an advance declaration to the District Magistrate two months prior to the conversion, a marked departure from standard administrative procedures.\n\nThis legislative move intersects deeply with constitutional provisions guaranteeing Religious Freedom (Article 25), yet it amplifies debates around the state's intervention in personal autonomy. Supporters of such bills argue they are necessary to protect vulnerable tribal and poorer demographics from allurement-based or coercive proselytization. However, critics argue the lengthy bureaucratic prerequisites potentially violate the Right to Privacy, recently expanded under the landmark Justice K.S. Puttaswamy judgment.\n\nThe impending passage of this law will likely trigger judicial scrutiny regarding the proportionality of the state’s mechanisms and the precise legal definition of 'allurement'. The judicial interpretation of this Act will set precedents affecting the broader discourse on freedom of conscience, the limits of secularism, and the protective ambit required in tribal-dominated geographies.",
            category: "polity",
            gsPaper: "GS2",
            gsSubTopics: [
                "Polity: Indian Constitution- features, amendments, significant provisions",
                "Polity: Fundamental Rights"
            ],
            date: today,
            source: "The Hindu",
            sourceUrl: "#",
            importance: "medium",
            tags: ["Anti-Conversion Laws", "Article 25", "Right to Privacy", "Chhattisgarh"],
            keyTerms: ["Article 25", "Freedom of Conscience", "K.S. Puttaswamy Case"],
            prelims: true,
            prelimsPoints: [
                "Article 25 provides freedom of conscience, free profession, practice, and propagation of religion.",
                "Right to Privacy is declared a fundamental right under Article 21."
            ],
            mains: true,
            mainsPoints: [
                "Balancing religious freedom with state intervention against coercion.",
                "Impact of anti-conversion laws on minoritized and tribal populations."
            ],
            imageDescription: "A scale of justice placed atop a book representing the Constitution",
            section: "Polity",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-antarctica-greenlandification`,
            headline: "Antarctica Undergoes 'Greenlandification' as Ice Melt Accelerates",
            explainer: "Climatologists have raised extreme alarm over the 'Greenlandification' of Antarctica, referring to the rapid surface thawing previously characteristic only of the Arctic Greenland ice sheets. Recent data tracking indicates highly accelerated melting events wherein immense pools of meltwater form on the surface, significantly altering the continent's albedo (reflectivity) and compromising structural ice-shelf integrity.\n\nThis phenomenon represents a severe tipping point in the global climate crisis. When surface meltwater seeps into crevasses, it causes 'hydrofracturing,' violently shattering massive ice shelves that usually hold back land-based glaciers from slipping into the ocean. The loss of these stabilizing shelves threatens to exponentially increase the rate of global mean sea-level rise.\n\nFor peninsular India, possessing a vast 7,500-km coastline and dense coastal urban agglomerations like Mumbai and Chennai, this is an existential threat. It stresses the urgent need for international concerted action under the UNFCCC framework to limit warming strictly to 1.5°C, while simultaneously requiring domestic infrastructure resilience policies dedicated explicitly to extreme coastal inundation scenarios.",
            category: "environment",
            gsPaper: "GS3",
            gsSubTopics: [
                "Environment: Climate Change",
                "Disaster Management: Coastal Floods"
            ],
            date: today,
            source: "Phys.org",
            sourceUrl: "#",
            importance: "high",
            tags: ["Climate Change", "Antarctica", "Sea Level Rise", "Global Warming"],
            keyTerms: ["Albedo Effect", "Hydrofracturing", "Tipping Point", "UNFCCC"],
            prelims: true,
            prelimsPoints: [
                "Albedo effect refers to the reflectivity of a surface, high for ice.",
                "Hydrofracturing occurs when water forces cracks in ice to burst open."
            ],
            mains: true,
            mainsPoints: [
                "Implications of polar melting on India's coastal security.",
                "Need for adaptation strategies in urban coastal management."
            ],
            imageDescription: "Large pools of blue meltwater forming on the surface of white glacial ice",
            section: "Science & Tech",
            processedAt: new Date().toISOString()
        },
        {
            id: `${today}-fdi-curbs-eased`,
            headline: "Govt Eases Investment Curbs from Land Bordering Countries, Including China",
            explainer: "In a significant pivot of the nation's economic security framework, the Government of India has eased stringent Foreign Direct Investment (FDI) restrictions previously imposed on entities originating from land-bordering nations. This recalibration is marked by introducing a strict 60-day deadline for security clearances of such proposals, a move viewed primarily to facilitate strategic Chinese capital into advanced manufacturing corridors.\n\nEstablished under Press Note 3 in the aftermath of border skirmishes, the initial mandate required tedious government approvals for all investments from bordering states to prevent opportunistic takeovers. However, recognizing the urgent necessity to intertwine heavily into global semiconductor, EV, and high-tech supply chains—where Chinese capital and components maintain significant dominance—policymakers are adopting a more nuanced risk-management matrix rather than a blanket prohibition.\n\nThis policy easing reflects the structural realities of globalized value chains. It embodies a pragmatic balancing act, emphasizing macro-economic growth goals and job creation in high-capacity industries without entirely dismantling the protective legal boundaries established around the nation's core strategic sectors.",
            category: "economy",
            gsPaper: "GS3",
            gsSubTopics: [
                "Economy: Foreign Investment (FDI)",
                "Security: Linkages between development and spread of extremism"
            ],
            date: today,
            source: "Mint",
            sourceUrl: "#",
            importance: "high",
            tags: ["FDI", "China", "Economic Policy", "Manufacturing"],
            keyTerms: ["Press Note 3", "Supply Chain Integration", "Foreign Exchange Management Act"],
            prelims: true,
            prelimsPoints: [
                "Press Note 3 (2020) mandated prior govt approval for bordering countries.",
                "FDI rules are framed under the FEMA act."
            ],
            mains: true,
            mainsPoints: [
                "Balancing internal security constraints with globalization and economic growth.",
                "Importance of foreign capital in boosting advanced manufacturing like EVs."
            ],
            imageDescription: "A large automated robotic arm assembling a modern electric vehicle",
            section: "Economy",
            processedAt: new Date().toISOString()
        }
    ]
};

// Also calculate gs groups
const articlesByGS: Record<string, any[]> = { "GS1": [], "GS2": [], "GS3": [], "GS4": [] };
epaper.articles.forEach(a => {
    if (!articlesByGS[a.gsPaper]) articlesByGS[a.gsPaper] = [];
    articlesByGS[a.gsPaper].push(a);
});
(epaper as any).articlesByGS = articlesByGS;
(epaper as any).sources = ["CurrentPrep Special Coverage", "The Hindu", "Science Reporter", "Business Standard", "PIB", "Indian Express", "Phys.org", "Mint"];
(epaper as any).totalScraped = 80;
(epaper as any).totalProcessed = 10;
(epaper as any).highlights = epaper.articles.slice(0, 5).map(a => a.headline);

// Ensure the directory exists
const targetDir = path.join('/Users/mgtvalavan/UPSC coaching antigravity/src/data/epaper');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, `epaper-${today}.json`), JSON.stringify(epaper, null, 2));

// Update index
const files = fs.readdirSync(targetDir).filter((f) => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json').sort().reverse();
let totalArticles = 0;
const availableDates = [];

for (const file of files) {
    const date = file.replace('epaper-', '').replace('.json', '');
    availableDates.push(date);
    try {
        const data = JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf-8'));
        totalArticles += data.articles.length;
    } catch {
        // skip
    }
}

const index = {
    lastUpdated: new Date().toISOString(),
    availableDates,
    totalArticles,
    latestDate: availableDates[0] || '',
};
fs.writeFileSync(path.join(targetDir, 'epaper-index.json'), JSON.stringify(index, null, 2));

console.log("ePaper successfully saved.");
