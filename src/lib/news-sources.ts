/**
 * News source configuration for the Current Affairs Agent.
 * Sources: The Hindu, The Indian Express, News on AIR (All India Radio)
 */

export interface NewsSource {
  name: string;
  shortName: string;
  rssFeeds: { url: string; section: string }[];
  baseUrl: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'The Hindu',
    shortName: 'The Hindu',
    baseUrl: 'https://www.thehindu.com',
    rssFeeds: [
      { url: 'https://www.thehindu.com/news/national/feeder/default.rss', section: 'National' },
      { url: 'https://www.thehindu.com/news/international/feeder/default.rss', section: 'International' },
      { url: 'https://www.thehindu.com/business/feeder/default.rss', section: 'Business' },
      { url: 'https://www.thehindu.com/sci-tech/feeder/default.rss', section: 'Science & Tech' },
      { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', section: 'Editorial' },
    ],
  },
  {
    name: 'The Indian Express',
    shortName: 'Indian Express',
    baseUrl: 'https://indianexpress.com',
    rssFeeds: [
      { url: 'https://indianexpress.com/section/india/feed/', section: 'India' },
      { url: 'https://indianexpress.com/section/world/feed/', section: 'World' },
      { url: 'https://indianexpress.com/section/business/feed/', section: 'Business' },
      { url: 'https://indianexpress.com/section/technology/feed/', section: 'Technology' },
      { url: 'https://indianexpress.com/section/opinion/editorials/feed/', section: 'Editorial' },
      { url: 'https://indianexpress.com/section/explained/feed/', section: 'Explained' },
    ],
  },
  {
    name: 'News on AIR (All India Radio)',
    shortName: 'News on AIR',
    baseUrl: 'https://newsonair.gov.in',
    rssFeeds: [
      { url: 'https://newsonair.gov.in/Main-News-702.aspx?feed=rss', section: 'Main News' },
      { url: 'https://newsonair.gov.in/National-English-702.aspx?feed=rss', section: 'National' },
      { url: 'https://newsonair.gov.in/International-English-702.aspx?feed=rss', section: 'International' },
      { url: 'https://newsonair.gov.in/Business-English-702.aspx?feed=rss', section: 'Business' },
      { url: 'https://newsonair.gov.in/Sports-English-702.aspx?feed=rss', section: 'Sports' },
    ],
  },
];

export const UPSC_CATEGORIES = [
  { id: 'polity', label: 'Polity & Governance', gsMapping: ['GS-II: Polity', 'GS-II: Governance'] },
  { id: 'economy', label: 'Economy', gsMapping: ['GS-III: Economy'] },
  { id: 'ir', label: 'International Relations', gsMapping: ['GS-II: IR'] },
  { id: 'environment', label: 'Environment', gsMapping: ['GS-III: Environment'] },
  { id: 'science', label: 'Science & Tech', gsMapping: ['GS-III: Science & Tech'] },
  { id: 'social', label: 'Social Issues', gsMapping: ['GS-I: Society', 'GS-II: Social Justice'] },
  { id: 'history', label: 'History & Culture', gsMapping: ['GS-I: History', 'GS-I: Culture'] },
  { id: 'geography', label: 'Geography', gsMapping: ['GS-I: Geography'] },
  { id: 'security', label: 'Internal Security', gsMapping: ['GS-III: Internal Security'] },
  { id: 'ethics', label: 'Ethics & Integrity', gsMapping: ['GS-IV: Ethics'] },
] as const;

export type UPSCCategory = (typeof UPSC_CATEGORIES)[number]['id'];
