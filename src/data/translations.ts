export type TranslationKey =
    | 'site_name'
    | 'nav_home'
    | 'nav_syllabus'
    | 'nav_features'
    | 'nav_pricing'
    | 'nav_blog'
    | 'nav_about'
    | 'nav_login'
    | 'nav_signup'
    | 'hero_title'
    | 'hero_subtitle'
    | 'hero_cta_syllabus'
    | 'hero_cta_quiz'
    | 'stats_aspirants'
    | 'stats_ncert'
    | 'stats_current_affairs'
    | 'stats_topics'
    | 'features_title'
    | 'features_subtitle'
    | 'feature_ai_title'
    | 'feature_ai_desc'
    | 'feature_community_title'
    | 'feature_community_desc'
    | 'feature_tracker_title'
    | 'feature_tracker_desc'
    | 'feature_offline_title'
    | 'feature_offline_desc'
    | 'feature_bilingual_title'
    | 'feature_bilingual_desc'
    | 'feature_digest_title'
    | 'feature_digest_desc'
    | 'cta_title'
    | 'cta_subtitle'
    | 'cta_button'
    | 'footer_tagline'
    | 'footer_quick_links'
    | 'footer_resources'
    | 'footer_contact'
    | 'footer_rights'
    | 'syllabus_title'
    | 'syllabus_subtitle'
    | 'prelims'
    | 'mains'
    | 'download_pdf'
    | 'take_quiz'
    | 'about_title'
    | 'about_mission'
    | 'pricing_title'
    | 'pricing_subtitle'
    | 'pricing_free'
    | 'pricing_premium'
    | 'pricing_month'
    | 'pricing_free_desc'
    | 'pricing_premium_desc'
    | 'pricing_get_started'
    | 'pricing_upgrade'
    | 'blog_title'
    | 'blog_subtitle'
    | 'features_page_title'
    | 'features_page_subtitle'
    | 'language_toggle';

export const translations: Record<'en' | 'ta', Record<TranslationKey, string>> = {
    en: {
        site_name: 'CurrentPrep',
        nav_home: 'Home',
        nav_syllabus: 'Syllabus',
        nav_features: 'Features',
        nav_pricing: 'Pricing',
        nav_blog: 'Blog',
        nav_about: 'About',
        nav_login: 'Log in',
        nav_signup: 'Sign Up Free',
        hero_title: 'Free UPSC CSE Resources – Study Smart, Clear IAS',
        hero_subtitle: 'CSE SelfStudy Hub — Your complete self-study companion with NCERT summaries, AI-powered tools, and a supportive community. 100% free, always.',
        hero_cta_syllabus: 'Explore Syllabus',
        hero_cta_quiz: 'Start AI Quiz',
        stats_aspirants: '10,000+ Aspirants',
        stats_ncert: '100% Free NCERT Hub',
        stats_current_affairs: 'Daily Current Affairs',
        stats_topics: '500+ Topic Summaries',
        features_title: 'Everything You Need to Crack UPSC',
        features_subtitle: 'Powerful tools designed for self-study warriors who refuse to let budget be a barrier.',
        feature_ai_title: 'AI Answer Checker',
        feature_ai_desc: 'Upload your answer sheets or type essays—get instant AI-powered feedback aligned with UPSC marking standards.',
        feature_community_title: 'Community Forum',
        feature_community_desc: 'Join thousands of aspirants in Prelims & Mains discussion threads. Find mentors who cleared CSE.',
        feature_tracker_title: 'Progress Tracker',
        feature_tracker_desc: 'Gamified dashboard with badges, study streaks, and walking-break timers. Track every topic you master.',
        feature_offline_title: 'Offline Access',
        feature_offline_desc: 'Download summaries and study materials for offline access. Perfect for areas with limited connectivity.',
        feature_bilingual_title: 'Bilingual Support',
        feature_bilingual_desc: 'Switch seamlessly between English and Tamil. Study in the language you think in.',
        feature_digest_title: 'Daily Digest',
        feature_digest_desc: 'Curated current affairs from The Hindu, PIB, and Yojana. Never miss an important update.',
        cta_title: 'Start Your IAS Journey Today',
        cta_subtitle: 'Join 10,000+ aspirants already using CurrentPrep. No fees, no barriers.',
        cta_button: 'Get Started – It\'s Free',
        footer_tagline: 'Where Aspirants Become Achievers — Democratizing UPSC preparation for self-study warriors across India.',
        footer_quick_links: 'Quick Links',
        footer_resources: 'Resources',
        footer_contact: 'Contact',
        footer_rights: '© 2025 CurrentPrep. All rights reserved.',
        syllabus_title: 'UPSC CSE Syllabus Hub',
        syllabus_subtitle: 'Complete syllabus breakdown with NCERT summaries, official PDF links, and topic-wise practice quizzes.',
        prelims: 'Prelims',
        mains: 'Mains',
        download_pdf: 'Download PDF',
        take_quiz: 'Take Quiz',
        about_title: 'About CurrentPrep',
        about_mission: 'Democratizing UPSC prep for self-study warriors.',
        pricing_title: 'Simple, Transparent Pricing',
        pricing_subtitle: 'Start free, upgrade when you need advanced AI coaching.',
        pricing_free: 'Free Forever',
        pricing_premium: 'Premium',
        pricing_month: '/month',
        pricing_free_desc: 'Everything you need to start your UPSC journey.',
        pricing_premium_desc: 'Advanced AI tools for serious aspirants ready to clear CSE.',
        pricing_get_started: 'Get Started Free',
        pricing_upgrade: 'Upgrade to Premium',
        blog_title: 'UPSC Preparation Blog',
        blog_subtitle: 'Expert tips, NCERT notes, strategy guides, and current affairs analysis.',
        features_page_title: 'Powerful Features for UPSC Aspirants',
        features_page_subtitle: 'Every tool you need for self-study success, built with cutting-edge AI.',
        language_toggle: 'தமிழ்',
    },
    ta: {
        site_name: 'CurrentPrep',
        nav_home: 'முகப்பு',
        nav_syllabus: 'பாடத்திட்டம்',
        nav_features: 'அம்சங்கள்',
        nav_pricing: 'விலை',
        nav_blog: 'வலைப்பதிவு',
        nav_about: 'பற்றி',
        nav_login: 'உள்நுழை',
        nav_signup: 'இலவசமாக பதிவுசெய்',
        hero_title: 'இலவச UPSC CSE வளங்கள் – புத்திசாலித்தனமாக படி, IAS தேர்ச்சி',
        hero_subtitle: 'NCERT சுருக்கங்கள், AI கருவிகள் மற்றும் சமூக ஆதரவுடன் உங்கள் முழுமையான சுயபயிற்சி துணை. 100% இலவசம்.',
        hero_cta_syllabus: 'பாடத்திட்டத்தை ஆராய',
        hero_cta_quiz: 'AI வினாடி வினா தொடங்கு',
        stats_aspirants: '10,000+ விண்ணப்பதாரர்கள்',
        stats_ncert: '100% இலவச NCERT மையம்',
        stats_current_affairs: 'தினசரி நடப்பு நிகழ்வுகள்',
        stats_topics: '500+ தலைப்பு சுருக்கங்கள்',
        features_title: 'UPSC தேர்ச்சிக்கு தேவையான அனைத்தும்',
        features_subtitle: 'பட்ஜெட் தடையாக இருக்க மறுக்கும் சுயபயிற்சி வீரர்களுக்காக வடிவமைக்கப்பட்ட சக்திவாய்ந்த கருவிகள்.',
        feature_ai_title: 'AI பதில் சரிபார்ப்பு',
        feature_ai_desc: 'உங்கள் விடைத்தாள்களை பதிவேற்றவும் – UPSC மதிப்பீட்டு தரநிலைகளுடன் உடனடி AI பின்னூட்டம் பெறவும்.',
        feature_community_title: 'சமூக மன்றம்',
        feature_community_desc: 'ஆயிரக்கணக்கான விண்ணப்பதாரர்களுடன் விவாதங்களில் சேரவும். CSE தேர்ச்சி பெற்ற வழிகாட்டிகளை கண்டறியவும்.',
        feature_tracker_title: 'முன்னேற்ற கண்காணிப்பு',
        feature_tracker_desc: 'பேட்ஜ்கள், படிப்பு தொடர்கள் மற்றும் நடை-இடைவேளை நேரங்களுடன் விளையாட்டு மயமான டாஷ்போர்டு.',
        feature_offline_title: 'ஆஃப்லைன் அணுகல்',
        feature_offline_desc: 'சுருக்கங்களை பதிவிறக்கவும். குறைந்த இணைப்பு உள்ள பகுதிகளுக்கு சிறந்தது.',
        feature_bilingual_title: 'இருமொழி ஆதரவு',
        feature_bilingual_desc: 'ஆங்கிலம் மற்றும் தமிழ் இடையே மாறவும். நீங்கள் சிந்திக்கும் மொழியில் படியுங்கள்.',
        feature_digest_title: 'தினசரி செரிமானம்',
        feature_digest_desc: 'The Hindu, PIB மற்றும் யோஜனா இலிருந்து தொகுக்கப்பட்ட நடப்பு நிகழ்வுகள்.',
        cta_title: 'இன்றே உங்கள் IAS பயணத்தை தொடங்குங்கள்',
        cta_subtitle: '10,000+ விண்ணப்பதாரர்கள் ஏற்கனவே CurrentPrep பயன்படுத்துகின்றனர். கட்டணம் இல்லை, தடைகள் இல்லை.',
        cta_button: 'தொடங்குங்கள் – இலவசம்',
        footer_tagline: 'Where Aspirants Become Achievers — இந்தியா முழுவதும் சுயபயிற்சி வீரர்களுக்கான UPSC தயாரிப்பை ஜனநாயகமயமாக்குதல்.',
        footer_quick_links: 'விரைவு இணைப்புகள்',
        footer_resources: 'வளங்கள்',
        footer_contact: 'தொடர்பு',
        footer_rights: '© 2025 CurrentPrep. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
        syllabus_title: 'UPSC CSE பாடத்திட்ட மையம்',
        syllabus_subtitle: 'NCERT சுருக்கங்கள், அதிகாரப்பூர்வ PDF இணைப்புகள் மற்றும் தலைப்பு வாரியான வினாடி வினாக்களுடன் முழுமையான பாடத்திட்ட பிரிப்பு.',
        prelims: 'ப்ரிலிம்ஸ்',
        mains: 'மெயின்ஸ்',
        download_pdf: 'PDF பதிவிறக்கம்',
        take_quiz: 'வினாடி வினா',
        about_title: 'CurrentPrep பற்றி',
        about_mission: 'சுயபயிற்சி வீரர்களுக்கான UPSC தயாரிப்பை ஜனநாயகமயமாக்குதல்.',
        pricing_title: 'எளிய, வெளிப்படையான விலை',
        pricing_subtitle: 'இலவசமாக தொடங்குங்கள், மேம்பட்ட AI பயிற்சி தேவையெனில் மேம்படுத்துங்கள்.',
        pricing_free: 'எப்போதும் இலவசம்',
        pricing_premium: 'பிரீமியம்',
        pricing_month: '/மாதம்',
        pricing_free_desc: 'உங்கள் UPSC பயணத்தை தொடங்க தேவையான அனைத்தும்.',
        pricing_premium_desc: 'CSE தேர்ச்சிக்கு தயாராக உள்ள தீவிர விண்ணப்பதாரர்களுக்கான மேம்பட்ட AI கருவிகள்.',
        pricing_get_started: 'இலவசமாக தொடங்கு',
        pricing_upgrade: 'பிரீமியத்திற்கு மேம்படுத்து',
        blog_title: 'UPSC தயாரிப்பு வலைப்பதிவு',
        blog_subtitle: 'நிபுணர் குறிப்புகள், NCERT குறிப்புகள், உத்தி வழிகாட்டிகள் மற்றும் நடப்பு நிகழ்வு பகுப்பாய்வு.',
        features_page_title: 'UPSC விண்ணப்பதாரர்களுக்கான சக்திவாய்ந்த அம்சங்கள்',
        features_page_subtitle: 'சுயபயிற்சி வெற்றிக்கு தேவையான ஒவ்வொரு கருவியும், நவீன AI யுடன் கட்டமைக்கப்பட்டது.',
        language_toggle: 'English',
    },
};
