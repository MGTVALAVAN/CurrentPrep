// ============================================================
// UPSC Prelims GS Paper I — Subject & Sub-Topic Definitions
// ============================================================

import { Subject, GenerationBatch } from '../types/index.js';

export interface SubTopicDef {
  id: string;
  label: string;
  description: string;
  question_count_per_mock: number;  // How many Qs from this sub-topic in a subject mock
}

export interface SubjectDef {
  id: Subject;
  label: string;
  description: string;
  full_length_share: number;         // How many Qs in a 100-Q full-length mock
  sub_topics: SubTopicDef[];
}

// ============================================================
// Complete Subject Taxonomy
// ============================================================

export const SUBJECTS: SubjectDef[] = [
  {
    id: 'history',
    label: 'History',
    description: 'Indian History from Ancient to Post-Independence',
    full_length_share: 17,
    sub_topics: [
      {
        id: 'hist-ancient',
        label: 'Ancient India',
        description: 'Indus Valley Civilization, Vedic Age, Maurya, Gupta, Sangam period',
        question_count_per_mock: 20,
      },
      {
        id: 'hist-medieval',
        label: 'Medieval India',
        description: 'Delhi Sultanate, Mughal Empire, Vijayanagara, Bhakti & Sufi movements',
        question_count_per_mock: 20,
      },
      {
        id: 'hist-modern',
        label: 'Modern India',
        description: 'British colonialism, social reform movements, economic impact',
        question_count_per_mock: 25,
      },
      {
        id: 'hist-freedom',
        label: 'Freedom Struggle',
        description: '1857 Revolt, Congress sessions, Gandhi, Subhas Bose, movements',
        question_count_per_mock: 25,
      },
      {
        id: 'hist-post-ind',
        label: 'Post-Independence',
        description: 'Integration of states, Nehruvian era, major events, wars',
        question_count_per_mock: 10,
      },
    ],
  },
  {
    id: 'geography',
    label: 'Geography',
    description: 'Physical, Indian & World Geography',
    full_length_share: 17,
    sub_topics: [
      {
        id: 'geo-physical',
        label: 'Physical Geography',
        description: 'Geomorphology, climatology, oceanography, biogeography',
        question_count_per_mock: 25,
      },
      {
        id: 'geo-india',
        label: 'Indian Geography',
        description: 'Rivers, soils, natural vegetation, regions, resources, minerals',
        question_count_per_mock: 35,
      },
      {
        id: 'geo-world',
        label: 'World Geography',
        description: 'Continents, major features, distribution of resources',
        question_count_per_mock: 20,
      },
      {
        id: 'geo-economic',
        label: 'Economic Geography',
        description: 'Agriculture, industries, trade patterns, urbanization',
        question_count_per_mock: 20,
      },
    ],
  },
  {
    id: 'polity',
    label: 'Polity & Governance',
    description: 'Indian Constitution, governance, administration, and federal structure',
    full_length_share: 16,
    sub_topics: [
      {
        id: 'pol-constitution',
        label: 'Constitution',
        description: 'Fundamental Rights, DPSP, Fundamental Duties, amendments, Preamble, schedules, emergency provisions, citizenship',
        question_count_per_mock: 20,
      },
      {
        id: 'pol-parliament',
        label: 'Parliament, Executive & Judiciary',
        description: 'Parliament sessions, bills, budget process, President, PM, Council of Ministers, Supreme Court, High Courts, PIL, judicial review, tribunals',
        question_count_per_mock: 20,
      },
      {
        id: 'pol-federal',
        label: 'Federalism & Local Bodies',
        description: 'Centre-State relations, Panchayati Raj (73rd/74th amendments), municipalities, cooperative federalism, inter-state disputes',
        question_count_per_mock: 17,
      },
      {
        id: 'pol-statutory',
        label: 'Statutory & Constitutional Bodies',
        description: 'CAG, Election Commission, UPSC, Finance Commission, NHRC, NCSC, NCST, NCW, CIC, Lokpal',
        question_count_per_mock: 15,
      },
      {
        id: 'pol-admin',
        label: 'Governance & Administration',
        description: 'E-governance, RTI Act, Citizen Charter, social audit, transparency & accountability, administrative reforms (ARC), self-help groups, role of civil society & NGOs, pressure groups, good governance initiatives',
        question_count_per_mock: 14,
      },
      {
        id: 'pol-evolution',
        label: 'Historical Evolution & Salient Features of Constitution',
        description: 'Regulating Act 1773, Pitt\'s India Act 1784, Charter Acts (1813, 1833, 1853), Government of India Acts (1858, 1909 Morley-Minto, 1919 Montagu-Chelmsford, 1935), Indian Independence Act 1947, Constituent Assembly formation & debates, sources of Indian Constitution (British, US, Irish, Canadian, Australian, Weimar, South African, Japanese, Soviet), salient features: written constitution, blend of rigidity & flexibility, federal with unitary bias, parliamentary sovereignty, single citizenship, independent judiciary, universal adult franchise, secularism, socialist, democratic republic, integrated & independent judiciary, single integrated judicial system',
        question_count_per_mock: 14,
      },
    ],
  },
  {
    id: 'economics',
    label: 'Economics',
    description: 'Indian Economy, fiscal & monetary policy, government schemes',
    full_length_share: 15,
    sub_topics: [
      {
        id: 'eco-macro',
        label: 'Macroeconomics',
        description: 'GDP, national income, inflation, employment, growth models, poverty measurement, Gini coefficient',
        question_count_per_mock: 18,
      },
      {
        id: 'eco-budget',
        label: 'Budget & Public Finance',
        description: 'Union Budget, taxation (GST, direct/indirect), fiscal policy, FRBM, fiscal deficit, revenue deficit',
        question_count_per_mock: 18,
      },
      {
        id: 'eco-sectors',
        label: 'Sectors of Economy',
        description: 'Agriculture (MSP, APMC, e-NAM), industry, services, MSMEs, land reforms, food security',
        question_count_per_mock: 22,
      },
      {
        id: 'eco-external',
        label: 'External Sector & Trade',
        description: 'BOP, WTO, FDI, FPI, exchange rate, trade agreements, RCEP, bilateral trade',
        question_count_per_mock: 12,
      },
      {
        id: 'eco-banking',
        label: 'Banking & Monetary Policy',
        description: 'RBI, repo rate, SLR/CRR, financial inclusion, NBFCs, fintech, digital rupee, UPI',
        question_count_per_mock: 15,
      },
      {
        id: 'eco-schemes',
        label: 'Government Schemes & Programmes',
        description: 'PM Kisan, MGNREGA, Ayushman Bharat (PMJAY), PM Awas Yojana, Startup India, PLI schemes, PM Vishwakarma, Jan Dhan Yojana, DBT, MUDRA, Skill India, Jal Jeevan Mission, Make in India, Samagra Shiksha, PM Garib Kalyan',
        question_count_per_mock: 15,
      },
    ],
  },
  {
    id: 'environment',
    label: 'Environment & Ecology',
    description: 'Biodiversity, climate change, conservation, sustainable development, ecology',
    full_length_share: 12,
    sub_topics: [
      {
        id: 'env-biodiversity',
        label: 'Biodiversity',
        description: 'National Parks, Wildlife Sanctuaries, Biosphere Reserves, Ramsar sites, biodiversity hotspots (Western Ghats, Eastern Himalayas, Indo-Burma, Sundaland), endemic species, coral reefs, mangroves, sacred groves',
        question_count_per_mock: 16,
      },
      {
        id: 'env-climate',
        label: 'Climate Change',
        description: 'UNFCCC, Kyoto Protocol, Paris Agreement, IPCC reports, NDCs, carbon markets (Article 6), greenhouse gases, global warming potential, carbon sink, climate finance, Green Climate Fund, Adaptation Fund',
        question_count_per_mock: 14,
      },
      {
        id: 'env-pollution',
        label: 'Pollution & Conservation',
        description: 'Air pollution (PM2.5, ozone), water pollution (BOD, COD, eutrophication), soil pollution, noise pollution, e-waste, plastic waste, environmental acts (EPA 1986, Water Act 1974, Air Act 1981), Wildlife Protection Act 1972, Forest Conservation Act 1980, Biological Diversity Act 2002, international treaties (Basel, Stockholm, Rotterdam, Minamata, Montreal Protocol)',
        question_count_per_mock: 14,
      },
      {
        id: 'env-sustainable',
        label: 'Sustainable Development & Renewable Energy',
        description: 'Green hydrogen, solar energy (ISA, PM Surya Ghar), wind energy, nuclear energy, biofuels (ethanol blending), circular economy, green finance, sovereign green bonds, carbon credit trading, Net Zero targets',
        question_count_per_mock: 12,
      },
      {
        id: 'env-ecology',
        label: 'Ecology Fundamentals',
        description: 'Food chains, food webs, trophic levels, ecological pyramids (number, biomass, energy), biogeochemical cycles (carbon, nitrogen, phosphorus, sulphur, water), ecological succession (primary, secondary, seral stages, climax community), biomes, ecosystem services (provisioning, regulating, cultural, supporting), keystone species, indicator species, edge effect, ecotone',
        question_count_per_mock: 12,
      },
      {
        id: 'env-eia',
        label: 'EIA & Environmental Governance',
        description: 'Environmental Impact Assessment (EIA) process and notification 2006 (amended 2020), National Green Tribunal (NGT), Central & State Pollution Control Boards (CPCB/SPCB), environmental clearance process, Coastal Regulation Zone (CRZ) notification, compensatory afforestation (CAMPA), environmental audit, public hearing process',
        question_count_per_mock: 10,
      },
      {
        id: 'env-species',
        label: 'Species & Conservation Projects',
        description: 'Project Tiger (NTCA, tiger reserves, census), Project Elephant, Project Cheetah (Kuno NP), IUCN Red List categories (CR, EN, VU, NT, LC), CITES (Appendix I, II, III), CMS (Convention on Migratory Species), captive breeding programmes, wildlife corridors, man-animal conflict, species recovery: Great Indian Bustard, snow leopard, Gangetic dolphin, one-horned rhino, Asiatic lion',
        question_count_per_mock: 12,
      },
      {
        id: 'env-sdgs',
        label: 'Sustainable Development Goals (SDGs)',
        description: '17 SDGs and their targets, SDG India Index (NITI Aayog), Agenda 2030, India\'s SDG progress by goal, interlinkages between SDGs (poverty-hunger-health-education-gender-water-energy), Voluntary National Reviews (VNR), localisation of SDGs, Leave No One Behind principle, SDG financing',
        question_count_per_mock: 10,
      },
    ],
  },
  {
    id: 'science',
    label: 'Science & Technology',
    description: 'General science, space, defence tech, emerging technologies',
    full_length_share: 12,
    sub_topics: [
      {
        id: 'sci-physics',
        label: 'Physics & Space',
        description: 'ISRO missions, satellites, nuclear energy, fundamental physics',
        question_count_per_mock: 25,
      },
      {
        id: 'sci-biology',
        label: 'Biology & Health',
        description: 'Diseases, vaccines, biotechnology, genetics, nutrition, public health',
        question_count_per_mock: 30,
      },
      {
        id: 'sci-it',
        label: 'IT & Emerging Tech',
        description: 'AI, blockchain, quantum computing, cybersecurity, digital India',
        question_count_per_mock: 25,
      },
      {
        id: 'sci-defense',
        label: 'Defence Technology',
        description: 'Indigenous missiles, radars, fighter jets, DRDO, Make in India defence',
        question_count_per_mock: 20,
      },
    ],
  },
  {
    id: 'current_affairs',
    label: 'Current Affairs',
    description: 'National & international events, schemes, reports (2025-2026)',
    full_length_share: 7,
    sub_topics: [
      {
        id: 'ca-national',
        label: 'National Affairs',
        description: 'Government schemes, policies, governance reforms, national events',
        question_count_per_mock: 35,
      },
      {
        id: 'ca-international',
        label: 'International Relations',
        description: 'Summits, treaties, organizations (UN, BRICS, G20, SCO), bilateral ties',
        question_count_per_mock: 30,
      },
      {
        id: 'ca-awards',
        label: 'Awards, Appointments & Events',
        description: 'Padma awards, sports, cultural events, key appointments',
        question_count_per_mock: 15,
      },
      {
        id: 'ca-reports',
        label: 'Reports & Indices',
        description: 'HDI, Global Hunger Index, ease of business, WHO/World Bank/UN reports',
        question_count_per_mock: 20,
      },
    ],
  },
  {
    id: 'art_culture',
    label: 'Art & Culture',
    description: 'Indian art, architecture, performing arts, paintings, handicrafts, literature, festivals',
    full_length_share: 4,
    sub_topics: [
      {
        id: 'ac-architecture',
        label: 'Architecture & Sculpture',
        description: 'Nagara/Dravida/Vesara temple styles, cave temples (Ajanta, Ellora, Elephanta, Badami), Buddhist stupas (Sanchi, Amaravati), Indo-Islamic architecture (Mughal forts, tombs, Qutub Minar), colonial architecture, Gandhara vs Mathura sculpture schools, UNESCO World Heritage Sites in India',
        question_count_per_mock: 25,
      },
      {
        id: 'ac-paintings',
        label: 'Paintings',
        description: 'Ajanta cave murals, Miniature painting traditions (Mughal, Rajasthani, Pahari, Deccan, Mysore, Tanjore), Folk paintings (Madhubani, Warli, Pattachitra, Kalamkari, Phad, Gond), Modern Indian art (Raja Ravi Varma, Amrita Sher-Gil, Nandalal Bose)',
        question_count_per_mock: 15,
      },
      {
        id: 'ac-performing',
        label: 'Performing Arts',
        description: '8 classical dance forms (Bharatanatyam, Kathak, Kathakali, Kuchipudi, Odissi, Manipuri, Sattriya, Mohiniyattam), folk dances (state-wise: Bihu, Garba, Bhangra, Lavani, Chhau), Hindustani vs Carnatic music, musical instruments, theatre traditions (Yakshagana, Jatra, Tamasha, Nautanki, Koodiyattam)',
        question_count_per_mock: 20,
      },
      {
        id: 'ac-literature',
        label: 'Literature & Languages',
        description: 'Vedic/Sanskrit/Pali/Prakrit texts, Sangam literature, Classical language status, major literary works and authors, Sahitya Akademi, Jnanpith awards, regional literary traditions',
        question_count_per_mock: 10,
      },
      {
        id: 'ac-handicrafts',
        label: 'Handicrafts, Textiles & GI Tags',
        description: 'GI-tagged products (state-wise), textile traditions (Banarasi, Pochampalli, Patola, Chanderi, Kanjeevaram), crafts (Bidriware, Dhokra, Blue Pottery, Papier-mâché), tribal crafts, traditional metalwork and woodwork',
        question_count_per_mock: 15,
      },
      {
        id: 'ac-festivals',
        label: 'Festivals, Traditions & Tribal Culture',
        description: 'Harvest festivals (Pongal, Baisakhi, Onam, Makar Sankranti), tribal festivals, PVTGs, Kumbh Mela, Rath Yatra, Pushkar Fair, UNESCO Intangible Cultural Heritage items from India, religious traditions',
        question_count_per_mock: 15,
      },
    ],
  },
  {
    id: 'society',
    label: 'Indian Society',
    description: 'Social structure, diversity, women empowerment, population, urbanization, social issues',
    full_length_share: 5,
    sub_topics: [
      {
        id: 'soc-structure',
        label: 'Social Structure & Diversity',
        description: 'Caste system (Varna, Jati), tribal communities (Scheduled Tribes, PVTGs), linguistic & religious diversity, pluralism, secularism in practice, communal harmony',
        question_count_per_mock: 25,
      },
      {
        id: 'soc-women',
        label: 'Women & Vulnerable Sections',
        description: 'Women empowerment, gender budgeting, child rights (POCSO, Juvenile Justice Act), SC/ST/OBC issues (reservation, Prevention of Atrocities Act), LGBTQ rights (Section 377, NALSA judgment), persons with disabilities (RPWD Act), senior citizens',
        question_count_per_mock: 25,
      },
      {
        id: 'soc-population',
        label: 'Population & Urbanization',
        description: 'Census 2021, demographic dividend, migration (rural-urban, international), urbanization challenges, smart cities mission, slums, housing, demographic transition model',
        question_count_per_mock: 25,
      },
      {
        id: 'soc-issues',
        label: 'Social Issues & Movements',
        description: 'Communalism, regionalism, secularism, poverty & inequality (Tendulkar, Rangarajan committees), globalization impact on Indian society, social reform movements, education policy (NEP 2020), health infrastructure',
        question_count_per_mock: 25,
      },
    ],
  },
];

// ============================================================
// Helper Functions
// ============================================================

/** Get a subject definition by ID */
export function getSubject(id: Subject): SubjectDef | undefined {
  return SUBJECTS.find(s => s.id === id);
}

/** Get a sub-topic label by its ID */
export function getSubTopicLabel(subTopicId: string): string {
  for (const subject of SUBJECTS) {
    const st = subject.sub_topics.find(s => s.id === subTopicId);
    if (st) return st.label;
  }
  return subTopicId;
}

/** Get the parent subject for a sub-topic ID */
export function getSubjectForSubTopic(subTopicId: string): SubjectDef | undefined {
  return SUBJECTS.find(s => s.sub_topics.some(st => st.id === subTopicId));
}

/** Get all sub-topic IDs across all subjects */
export function getAllSubTopicIds(): string[] {
  return SUBJECTS.flatMap(s => s.sub_topics.map(st => st.id));
}

/** Build generation batches for a given subject (for subject-wise mock) */
export function buildSubjectBatches(subject: Subject, questionsPerBatch: number = 25): GenerationBatch[] {
  const subjectDef = getSubject(subject);
  if (!subjectDef) throw new Error(`Unknown subject: ${subject}`);

  const batches: GenerationBatch[] = [];

  for (const st of subjectDef.sub_topics) {
    // We need enough questions for 5 mocks × question_count_per_mock
    const totalNeeded = st.question_count_per_mock * 5;
    const numBatches = Math.ceil(totalNeeded / questionsPerBatch);

    for (let i = 0; i < numBatches; i++) {
      const count = Math.min(questionsPerBatch, totalNeeded - (i * questionsPerBatch));
      // 3:4:3 difficulty ratio as per user specification
      const easy = Math.round(count * 0.30);
      const hard = Math.round(count * 0.30);
      const medium = count - easy - hard;

      batches.push({
        subject,
        sub_topic: st.id,
        sub_topic_label: st.label,
        count,
        difficulty_mix: { easy, medium, hard },
      });
    }
  }

  return batches;
}

/** Get total question count needed for all subject-wise mocks of one subject */
export function getTotalQuestionsForSubject(subject: Subject): number {
  const subjectDef = getSubject(subject);
  if (!subjectDef) return 0;
  return subjectDef.sub_topics.reduce((sum, st) => sum + st.question_count_per_mock * 5, 0);
}

/** Print summary of all subjects and question needs */
export function printSubjectSummary(): void {
  console.log('\n📚 UPSC Prelims GS — Subject Summary');
  console.log('═'.repeat(65));

  let grandTotal = 0;

  for (const subject of SUBJECTS) {
    const total = getTotalQuestionsForSubject(subject.id);
    grandTotal += total;
    console.log(`\n${subject.label} (${subject.full_length_share} Qs in full-length mock)`);
    console.log('─'.repeat(50));
    for (const st of subject.sub_topics) {
      const stTotal = st.question_count_per_mock * 5;
      console.log(`  ${st.label.padEnd(35)} ${stTotal} Qs (${st.question_count_per_mock}/mock × 5)`);
    }
    console.log(`  ${'SUBTOTAL'.padEnd(35)} ${total} Qs`);
  }

  console.log('\n' + '═'.repeat(65));
  console.log(`📊 GRAND TOTAL (Subject-wise mocks): ${grandTotal} questions`);
  console.log(`📊 Full-length mocks (10 × 100):     1,000 questions`);
  console.log(`📊 Combined (with overlap):           ~${Math.round(grandTotal * 0.8)} unique questions`);
  console.log('═'.repeat(65));
}
