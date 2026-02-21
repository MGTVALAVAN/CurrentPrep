export interface SyllabusTopic {
    id: string;
    title: string;
    titleTa: string;
    summary: string;
    summaryTa: string;
    pdfUrl?: string;
    pdfLabel?: string;
    subtopics?: SyllabusTopic[];
}

export interface SyllabusSection {
    id: string;
    title: string;
    titleTa: string;
    topics: SyllabusTopic[];
}

export interface SyllabusTab {
    id: string;
    title: string;
    titleTa: string;
    sections: SyllabusSection[];
}

export const prelimsData: SyllabusTab[] = [
    {
        id: 'gs1',
        title: 'GS Paper I',
        titleTa: 'GS தாள் I',
        sections: [
            {
                id: 'history',
                title: 'History of India & Indian National Movement',
                titleTa: 'இந்திய வரலாறு & தேசிய இயக்கம்',
                topics: [
                    {
                        id: 'ancient-history',
                        title: 'Ancient India',
                        titleTa: 'பண்டைய இந்தியா',
                        summary: 'Covers Indus Valley Civilization, Vedic period, Mauryan & Gupta Empires, Buddhist & Jain movements. Key NCERT sources: Class 6 (Our Pasts-I), Class 11 (Themes in Indian History-I). Focus on: Harappan town planning, Ashoka\'s Dhamma, Sangam Age literature, temple architecture evolution. Important for Prelims: Match civilization features with time periods, identify UNESCO heritage sites.',
                        summaryTa: 'சிந்து சமவெளி நாகரிகம், வேத காலம், மௌரிய & குப்த பேரரசுகள், புத்த & சமண இயக்கங்கள். முக்கிய NCERT ஆதாரங்கள்: வகுப்பு 6, வகுப்பு 11. ஹரப்பா நகர திட்டமிடல், அசோகரின் தம்மம், சங்க கால இலக்கியம், கோவில் கட்டிடக்கலை வளர்ச்சி.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?fess1=0-11',
                        pdfLabel: 'NCERT Class 6 - Our Pasts I',
                    },
                    {
                        id: 'medieval-history',
                        title: 'Medieval India',
                        titleTa: 'இடைக்கால இந்தியா',
                        summary: 'Delhi Sultanate (1206-1526): Slave, Khilji, Tughlaq, Sayyid, Lodi dynasties. Mughal Empire: Babur to Aurangzeb – administrative systems, architecture (Taj Mahal, Red Fort), cultural synthesis. Bhakti & Sufi movements: Kabir, Nanak, Chishti order. Vijayanagara & Bahmani kingdoms. NCERT Class 7 (Our Pasts-II), Class 11 (Themes in Indian History-II).',
                        summaryTa: 'டெல்லி சுல்தானகம் (1206-1526): அடிமை, கில்ஜி, துக்ளக், சையிது, லோடி வம்சங்கள். முகலாய பேரரசு: பாபர் முதல் ஔரங்கசீப் வரை. பக்தி & சூஃபி இயக்கங்கள். விஜயநகர & பாமினி அரசுகள்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?gess1=0-10',
                        pdfLabel: 'NCERT Class 7 - Our Pasts II',
                    },
                    {
                        id: 'modern-history',
                        title: 'Modern India & Freedom Struggle',
                        titleTa: 'நவீன இந்தியா & சுதந்திர போராட்டம்',
                        summary: 'British East India Company: Battle of Plassey (1757), Doctrine of Lapse. 1857 Revolt: Causes, leaders (Rani Lakshmibai, Tantia Tope), aftermath. Indian National Congress: Moderates, Extremists, Revolutionaries. Gandhian Era: Non-Cooperation (1920), Civil Disobedience (1930), Quit India (1942). Subhas Chandra Bose & INA. Constitutional development: Morley-Minto, Montagu-Chelmsford, Government of India Act 1935. NCERT Class 8 (Our Pasts-III), Class 12 (Themes in Indian History-III), Spectrum by Rajiv Ahir.',
                        summaryTa: 'பிரிட்டிஷ் கிழக்கிந்திய கம்பெனி: பிளாசி போர் (1757). 1857 கிளர்ச்சி. இந்திய தேசிய காங்கிரஸ்: மிதவாதிகள், தீவிரவாதிகள். காந்திய யுகம்: ஒத்துழையாமை, சிவில் கீழ்ப்படியாமை, வெள்ளையனே வெளியேறு.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?hess1=0-12',
                        pdfLabel: 'NCERT Class 8 - Our Pasts III',
                    },
                ],
            },
            {
                id: 'geography',
                title: 'Indian & World Geography',
                titleTa: 'இந்திய & உலக புவியியல்',
                topics: [
                    {
                        id: 'physical-geography',
                        title: 'Physical Geography',
                        titleTa: 'இயற்பியல் புவியியல்',
                        summary: 'Geomorphology: Interior of earth, plate tectonics, volcanism, earthquakes. Climatology: Atmospheric circulation, monsoons, cyclones, climate change. Oceanography: Ocean currents, tides, coral reefs, marine resources. Biogeography: Biomes, soil types, ecological succession. NCERT Class 11 (Fundamentals of Physical Geography, India Physical Environment).',
                        summaryTa: 'புவி உருவ அமைப்பு: பூமியின் உள்ளமைப்பு, தட்டு இயக்கவியல், எரிமலை, நிலநடுக்கம். காலநிலையியல்: வளிமண்டல சுழற்சி, பருவமழை. கடலியல்: கடல் நீரோட்டங்கள், அலைகள்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?kege1=0-16',
                        pdfLabel: 'NCERT Class 11 - Physical Geography',
                    },
                    {
                        id: 'human-geography',
                        title: 'Human & Economic Geography',
                        titleTa: 'மனித & பொருளாதார புவியியல்',
                        summary: 'Population: Distribution, density, growth, migration patterns, demographic transition. Urbanization: Smart cities, urban challenges, slums. Economic activities: Primary (agriculture, mining), secondary (industries), tertiary (services). Resources: Water, mineral, energy resources & conservation. Transport & communication networks. NCERT Class 12 (Human Geography, India: People and Economy).',
                        summaryTa: 'மக்கள்தொகை: பரவல், அடர்த்தி, வளர்ச்சி, இடம்பெயர்வு. நகரமயமாக்கல்: ஸ்மார்ட் நகரங்கள். பொருளாதார நடவடிக்கைகள்: முதன்மை, இரண்டாம் நிலை, மூன்றாம் நிலை.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?legy1=0-12',
                        pdfLabel: 'NCERT Class 12 - Human Geography',
                    },
                ],
            },
            {
                id: 'polity',
                title: 'Indian Polity & Governance',
                titleTa: 'இந்திய அரசியல் & ஆட்சி',
                topics: [
                    {
                        id: 'constitution-basics',
                        title: 'Constitution & Fundamental Rights',
                        titleTa: 'அரசியலமைப்பு & அடிப்படை உரிமைகள்',
                        summary: 'Constitutional framework: Preamble (sovereign, socialist, secular, democratic, republic). Fundamental Rights (Articles 12-35): Right to Equality, Freedom, Against Exploitation, Freedom of Religion, Cultural & Educational Rights, Constitutional Remedies. Directive Principles (Articles 36-51): Gandhian, Socialist, Liberal-Intellectual. Fundamental Duties (Article 51A). Amendment process (Article 368). Key source: Laxmikanth Indian Polity, NCERT Class 11 (Indian Constitution at Work).',
                        summaryTa: 'அரசியலமைப்பு கட்டமைப்பு: முகவுரை. அடிப்படை உரிமைகள் (பிரிவுகள் 12-35). வழிகாட்டு நெறிமுறைகள் (பிரிவுகள் 36-51). அடிப்படை கடமைகள் (பிரிவு 51A). திருத்த செயல்முறை (பிரிவு 368).',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?keps1=0-10',
                        pdfLabel: 'NCERT Class 11 - Indian Constitution at Work',
                    },
                ],
            },
            {
                id: 'economy',
                title: 'Economy & Environment',
                titleTa: 'பொருளாதாரம் & சுற்றுச்சூழல்',
                topics: [
                    {
                        id: 'indian-economy',
                        title: 'Indian Economy Basics',
                        titleTa: 'இந்திய பொருளாதார அடிப்படைகள்',
                        summary: 'Economic reforms since 1991: LPG (Liberalization, Privatization, Globalization). GDP, GNP, National Income concepts. Banking: RBI functions, monetary policy, repo rate, CRR/SLR. Fiscal policy: Union Budget, GST, deficit financing. Agriculture: Green Revolution, MSP, PM-KISAN. Industry: Make in India, MSME sector. NCERT Class 9-12 Economics, Indian Economy by Ramesh Singh.',
                        summaryTa: '1991 முதல் பொருளாதார சீர்திருத்தங்கள்: LPG. GDP, GNP, தேசிய வருமானம். வங்கி: RBI செயல்பாடுகள், நிதிக் கொள்கை. நிதிக் கொள்கை: மத்திய பட்ஜெட், GST.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?iess1=0-6',
                        pdfLabel: 'NCERT Class 9 - Economics',
                    },
                    {
                        id: 'environment',
                        title: 'Environment & Ecology',
                        titleTa: 'சுற்றுச்சூழல் & சூழலியல்',
                        summary: 'Biodiversity: Hotspots (Western Ghats, Eastern Himalayas), endemic species. Conservation: National Parks, Wildlife Sanctuaries, Biosphere Reserves, Ramsar sites. Climate Change: UNFCCC, Paris Agreement, NDCs, carbon neutrality. Pollution: Air (AQI, NCAP), Water (Ganga Action Plan), Solid Waste Management. Environmental laws: EPA 1986, Wildlife Protection Act 1972, Forest Conservation Act 1980. Shankar IAS Environment notes.',
                        summaryTa: 'உயிர்ப்பன்மை: வெப்ப மண்டலங்கள் (மேற்கு தொடர்ச்சி மலைகள்). பாதுகாப்பு: தேசிய பூங்காக்கள், வனவிலங்கு சரணாலயங்கள். காலநிலை மாற்றம்: UNFCCC, பாரிஸ் ஒப்பந்தம்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?lebo1=0-16',
                        pdfLabel: 'NCERT Class 12 - Biology (Ecology)',
                    },
                    {
                        id: 'science-tech',
                        title: 'Science & Technology',
                        titleTa: 'அறிவியல் & தொழில்நுட்பம்',
                        summary: 'Space: ISRO missions (Chandrayaan, Gaganyaan, Aditya-L1), PSLV/GSLV launch vehicles. Nuclear: India\'s three-stage nuclear programme, ITER. Defence: Indigenous platforms (Tejas, INS Vikrant, BrahMos). IT/Digital: Digital India, UPI, Aadhaar, AI policy. Biotech: Genome India Project, COVID vaccines. NCERT Class 9-10 Science, Science Reporter magazine.',
                        summaryTa: 'விண்வெளி: ISRO பணிகள். அணுசக்தி: இந்தியாவின் மூன்று-நிலை அணுசக்தி திட்டம். பாதுகாப்பு: உள்நாட்டு தளங்கள். IT/டிஜிட்டல்: டிஜிட்டல் இந்தியா, UPI.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?iesc1=0-15',
                        pdfLabel: 'NCERT Class 9 - Science',
                    },
                ],
            },
        ],
    },
    {
        id: 'csat',
        title: 'CSAT (Paper II)',
        titleTa: 'CSAT (தாள் II)',
        sections: [
            {
                id: 'comprehension',
                title: 'Comprehension & Communication',
                titleTa: 'புரிதல் & தொடர்பு',
                topics: [
                    {
                        id: 'reading-comprehension',
                        title: 'Reading Comprehension',
                        titleTa: 'வாசிப்பு புரிதல்',
                        summary: 'CSAT comprehension passages test inference, tone identification, and central theme extraction. Practice with UPSC previous year papers (2011-2024). Strategy: Read the questions first, then skim passages for relevant sections. Focus on elimination technique. Time allocation: 2-3 minutes per passage. Types: Factual, inferential, vocabulary-in-context. Target: 33% qualifying marks.',
                        summaryTa: 'CSAT புரிதல் பகுதிகள் ஊகம், தொனி அடையாளம் மற்றும் மைய கருத்து பிரித்தெடுப்பு ஆகியவற்றை சோதிக்கின்றன. UPSC முந்தைய ஆண்டு தாள்களுடன் பயிற்சி.',
                        pdfUrl: 'https://upsc.gov.in/examinations/previous-question-papers',
                        pdfLabel: 'UPSC Previous Year Papers',
                    },
                ],
            },
            {
                id: 'reasoning',
                title: 'Logical Reasoning & Analytical Ability',
                titleTa: 'தர்க்க ரீதியான பகுத்தறிவு',
                topics: [
                    {
                        id: 'logical-reasoning',
                        title: 'Logical Reasoning',
                        titleTa: 'தர்க்க பகுத்தறிவு',
                        summary: 'Syllogisms, Venn diagrams, statement-assumption, cause-effect, course of action. Blood relations, direction sense, coding-decoding, series completion. Data interpretation: Bar charts, pie charts, line graphs, tables. Decision making & problem solving. Practice: RS Aggarwal Reasoning, UPSC CSAT archives. Key: Focus on accuracy over speed for qualifying paper.',
                        summaryTa: 'நியாய வாக்கியங்கள், வென் வரைபடங்கள், கூற்று-அனுமானம். இரத்த உறவுகள், திசை உணர்வு. தரவு விளக்கம்: பட்டை வரைபடங்கள், வட்ட விளக்கப்படங்கள்.',
                        pdfUrl: 'https://upsc.gov.in/examinations/previous-question-papers',
                        pdfLabel: 'UPSC CSAT Archives',
                    },
                ],
            },
        ],
    },
];

export const mainsData: SyllabusTab[] = [
    {
        id: 'gs1-mains',
        title: 'GS Paper I',
        titleTa: 'GS தாள் I',
        sections: [
            {
                id: 'culture',
                title: 'Indian Heritage & Culture',
                titleTa: 'இந்திய பாரம்பரியம் & கலாச்சாரம்',
                topics: [
                    {
                        id: 'indian-culture',
                        title: 'Art Forms, Literature & Architecture',
                        titleTa: 'கலை வடிவங்கள், இலக்கியம் & கட்டிடக்கலை',
                        summary: 'Classical dance: Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Kathakali, Sattriya, Mohiniyattam. Music: Carnatic vs Hindustani. Painting: Mughal, Rajasthani, Pahari, Tanjore. Architecture: Temple styles (Nagara, Dravida, Vesara), Indo-Islamic, Colonial. Literature: Sangam, Sanskrit epics, Sufi & Bhakti poetry. Theatre: Yakshagana, Theyyam, Chhau. NCERT Class 11-12 Fine Arts.',
                        summaryTa: 'செம்மையான நடனம்: பரதநாட்டியம், கதக், ஒடிசி. இசை: கர்நாடக vs ஹிந்துஸ்தானி. ஓவியம்: முகலாய, ராஜஸ்தானி, தஞ்சாவூர்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?keha1=0-9',
                        pdfLabel: 'NCERT Class 11 - Fine Arts',
                    },
                ],
            },
            {
                id: 'modern-world',
                title: 'Modern History & World History',
                titleTa: 'நவீன வரலாறு & உலக வரலாறு',
                topics: [
                    {
                        id: 'world-history',
                        title: 'World History (18th-20th Century)',
                        titleTa: 'உலக வரலாறு (18-20 நூற்றாண்டு)',
                        summary: 'Industrial Revolution (Britain), French Revolution, American Revolution. Nationalism: Unification of Italy & Germany. Imperialism & colonialism in Asia & Africa. World War I & II: Causes, events, outcomes. Russian Revolution, Chinese Revolution. Cold War: NATO, Warsaw Pact, Non-Aligned Movement. Decolonization. NCERT Class 9-10 (India & Contemporary World), Norman Lowe\'s Modern World History.',
                        summaryTa: 'தொழிற்புரட்சி, பிரெஞ்சு புரட்சி, அமெரிக்க புரட்சி. தேசியவாதம். உலகப் போர்கள் I & II. பனிப்போர்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?iess2=0-8',
                        pdfLabel: 'NCERT Class 9 - India & Contemporary World',
                    },
                ],
            },
            {
                id: 'society',
                title: 'Indian Society',
                titleTa: 'இந்திய சமூகம்',
                topics: [
                    {
                        id: 'society-topics',
                        title: 'Social Issues & Diversity',
                        titleTa: 'சமூக பிரச்சினைகள் & பன்முகத்தன்மை',
                        summary: 'Diversity: Linguistic, religious, ethnic diversity. Caste system: Evolution, reservation policy, inter-caste dynamics. Women\'s issues: Gender inequality, women empowerment, POSH Act, Beti Bachao. Urbanization: Challenges, smart cities mission. Communalism, regionalism, secularism. Population: Demographic dividend, ageing population. Globalization impact on Indian society. NCERT Class 12 (Indian Society), Sociology optional.',
                        summaryTa: 'பன்முகத்தன்மை: மொழி, மத, இன பன்முகத்தன்மை. சாதி அமைப்பு. பெண்கள் பிரச்சினைகள். நகரமயமாக்கல். மக்கள்தொகை.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?leso1=0-6',
                        pdfLabel: 'NCERT Class 12 - Indian Society',
                    },
                ],
            },
        ],
    },
    {
        id: 'gs2-mains',
        title: 'GS Paper II',
        titleTa: 'GS தாள் II',
        sections: [
            {
                id: 'governance',
                title: 'Governance & Polity',
                titleTa: 'ஆட்சி & அரசியல்',
                topics: [
                    {
                        id: 'governance-topics',
                        title: 'Governance, Constitution & Social Justice',
                        titleTa: 'ஆட்சி, அரசியலமைப்பு & சமூக நீதி',
                        summary: 'Parliament: Lok Sabha & Rajya Sabha functions, legislative process, question hour, committee system. Judiciary: Supreme Court, High Courts, judicial review, PIL, judicial activism. Federalism: Centre-State relations, Governor\'s role, President\'s rule, inter-state disputes. Local governance: 73rd & 74th Amendments, Panchayati Raj. Statutory bodies: Election Commission, CAG, UPSC. 2nd ARC recommendations on governance reforms.',
                        summaryTa: 'நாடாளுமன்றம்: மக்களவை & மாநிலங்களவை செயல்பாடுகள். நீதித்துறை: உச்ச நீதிமன்றம், நீதித்துறை மறுஆய்வு. கூட்டாட்சி: மத்திய-மாநில உறவுகள்.',
                        pdfUrl: 'https://ncert.nic.in/textbook.php?keps2=0-9',
                        pdfLabel: 'NCERT Class 11 - Political Science II',
                    },
                ],
            },
            {
                id: 'international',
                title: 'International Relations',
                titleTa: 'சர்வதேச உறவுகள்',
                topics: [
                    {
                        id: 'ir-topics',
                        title: 'India & Its Neighbours, Global Groupings',
                        titleTa: 'இந்தியா & அண்டை நாடுகள், உலகளாவிய குழுக்கள்',
                        summary: 'India\'s neighbourhood policy: Relations with Pakistan, China, Bangladesh, Sri Lanka, Nepal. Look East/Act East Policy: ASEAN, Indo-Pacific strategy, Quad. Global forums: UN reform, G20 presidency, BRICS, SCO. Bilateral: India-US, India-Russia, India-EU, India-Africa. MEA overview of foreign policy doctrine. Diaspora & soft power. Key agreements: LEMOA, BECA, nuclear deals.',
                        summaryTa: 'இந்தியாவின் அண்டை நாட்டு கொள்கை: பாகிஸ்தான், சீனா உறவுகள். உலகளாவிய மன்றங்கள்: UN, G20, BRICS.',
                        pdfUrl: 'https://www.mea.gov.in',
                        pdfLabel: 'MEA Official Website',
                    },
                ],
            },
        ],
    },
    {
        id: 'gs3-mains',
        title: 'GS Paper III',
        titleTa: 'GS தாள் III',
        sections: [
            {
                id: 'economy-mains',
                title: 'Economy & Development',
                titleTa: 'பொருளாதாரம் & வளர்ச்சி',
                topics: [
                    {
                        id: 'economy-development',
                        title: 'Economic Development & Planning',
                        titleTa: 'பொருளாதார வளர்ச்சி & திட்டமிடல்',
                        summary: 'Planning: NITI Aayog (replaced Planning Commission), five-year plans legacy, SDGs. Growth: GDP trends, sectoral contribution (agriculture, industry, services). Inclusive growth: MGNREGA, skill development, Start-up India. Budgeting: Fiscal deficit, FRBM Act, revenue & capital expenditure. Economic Survey analysis: Key chapters on human development, climate change, inequality. External sector: BoP, forex reserves, FDI vs FPI. Yojana & Kurukshetra magazines.',
                        summaryTa: 'திட்டமிடல்: நிதி ஆயோக். வளர்ச்சி: GDP போக்குகள். உள்ளடங்கிய வளர்ச்சி: MGNREGA. பட்ஜெட்: நிதிப் பற்றாக்குறை.',
                        pdfUrl: 'https://www.indiabudget.gov.in',
                        pdfLabel: 'Economic Survey',
                    },
                ],
            },
            {
                id: 'security',
                title: 'Security & Disaster Management',
                titleTa: 'பாதுகாப்பு & பேரிடர் மேலாண்மை',
                topics: [
                    {
                        id: 'internal-security',
                        title: 'Internal Security & Disaster Management',
                        titleTa: 'உள்நாட்டு பாதுகாப்பு & பேரிடர் மேலாண்மை',
                        summary: 'Internal security: Left-wing extremism, insurgency in NE India, J&K situation, border management. Cyber security: IT Act, CERT-In, data protection, social media challenges. Role of media & civil society. Organized crime, terrorism financing. Disaster management: NDMA, SDMA, DM Act 2005. Natural disasters: Earthquakes, floods, cyclones, drought. Man-made: Industrial, nuclear. Sendai Framework. Community-based disaster preparedness.',
                        summaryTa: 'உள்நாட்டு பாதுகாப்பு: இடதுசாரி தீவிரவாதம். சைபர் பாதுகாப்பு. ஊடகங்களின் பங்கு. பேரிடர் மேலாண்மை: NDMA, DM சட்டம் 2005.',
                        pdfUrl: 'https://ndma.gov.in',
                        pdfLabel: 'NDMA Official Website',
                    },
                ],
            },
        ],
    },
    {
        id: 'gs4-mains',
        title: 'GS Paper IV (Ethics)',
        titleTa: 'GS தாள் IV (நெறிமுறைகள்)',
        sections: [
            {
                id: 'ethics',
                title: 'Ethics, Integrity & Aptitude',
                titleTa: 'நெறிமுறைகள், நேர்மை & திறன்',
                topics: [
                    {
                        id: 'ethics-basics',
                        title: 'Ethics & Human Interface',
                        titleTa: 'நெறிமுறைகள் & மனித இடைமுகம்',
                        summary: 'Essence of Ethics: Determinants (family, society, education). Dimensions: Consequences of ethics in human actions. Ethics in private & public relationships. Human values: Lessons from great leaders (Gandhi, Mandela, Kalam). Role of family, society & educational institutions. Attitude: Content, structure, function. Moral & political attitudes, social influence. Emotional Intelligence: Concepts, utility, application in governance. Lexicon Ethics by Niraj Kumar for comprehensive preparation.',
                        summaryTa: 'நெறிமுறைகளின் சாரம்: நிர்ணயிக்கும் காரணிகள். மனித மதிப்புகள்: பெரிய தலைவர்களிடமிருந்து பாடங்கள். அணுகுமுறை. உணர்ச்சி நுண்ணறிவு.',
                        pdfUrl: 'https://upsc.gov.in/examinations/syllabus',
                        pdfLabel: 'UPSC Official Syllabus',
                    },
                    {
                        id: 'case-studies',
                        title: 'Case Studies (50+ Practice)',
                        titleTa: 'வழக்கு ஆய்வுகள் (50+ பயிற்சி)',
                        summary: 'GS4 case studies carry 120/250 marks. Categories: Conflict of interest, civil service challenges, ethical dilemmas in governance, corruption, environmental ethics, corporate governance. Framework: Identify stakeholders → List ethical issues → Apply ethical theories (consequentialism, deontology, virtue ethics) → Propose solutions → Justify. Practice 50+ cases: Whistle-blowing dilemmas, disaster triage, communal tension management, transfer posting ethics, budget allocation fairness. Time: 10-12 minutes per case study.',
                        summaryTa: 'GS4 வழக்கு ஆய்வுகள் 120/250 மதிப்பெண்கள். வகைகள்: நல உடன்பாடு மோதல், ஊழல், சுற்றுச்சூழல் நெறிமுறைகள். கட்டமைப்பு: பங்குதாரர்களை அடையாளம் காண → தீர்வுகளை முன்மொழி.',
                        pdfUrl: 'https://upsc.gov.in/examinations/previous-question-papers',
                        pdfLabel: 'UPSC Previous Year Ethics Papers',
                    },
                ],
            },
        ],
    },
];
