export interface Company {
  slug: string;
  name: string;
  industry: string;
  description: string;
  headquarters: string;
  employeeCount: string;
  interviewProcess: string[];
  commonQuestions: {
    question: string;
    category: 'behavioral' | 'technical' | 'case' | 'situational';
    tip?: string;
  }[];
  tips: string[];
  culture: string[];
  benefits: string[];
}

export const COMPANIES: Company[] = [
  {
    slug: 'shopee',
    name: 'Shopee',
    industry: 'E-commerce',
    description: 'Leading e-commerce platform in Southeast Asia and Taiwan, known for its mobile-first approach and integrated payment solutions through ShopeePay.',
    headquarters: 'Singapore',
    employeeCount: '10,000+',
    interviewProcess: [
      'Online Assessment (Coding + Aptitude)',
      'Phone Screen with HR',
      'Technical Interview (1-2 rounds)',
      'Hiring Manager Interview',
      'HR Final Interview'
    ],
    commonQuestions: [
      {
        question: 'Design a system to handle flash sales with millions of concurrent users.',
        category: 'technical',
        tip: 'Focus on scalability, caching, and queue management.'
      },
      {
        question: 'Tell me about a time you had to work with a difficult team member.',
        category: 'behavioral',
        tip: 'Use STAR method and emphasize collaboration and resolution.'
      },
      {
        question: 'How would you improve the Shopee checkout experience?',
        category: 'case',
        tip: 'Think about user pain points and propose data-driven solutions.'
      },
      {
        question: 'Implement a function to find the shortest path in a graph.',
        category: 'technical',
        tip: 'Know BFS for unweighted graphs, Dijkstra for weighted.'
      },
      {
        question: 'Why do you want to join Shopee over other e-commerce companies?',
        category: 'behavioral',
        tip: 'Research Shopee\'s unique position in SEA market.'
      }
    ],
    tips: [
      'Practice LeetCode medium-hard problems, especially graph and dynamic programming',
      'Understand Shopee\'s business model across different markets',
      'Be prepared for system design questions even for internships',
      'Show enthusiasm for e-commerce and the Southeast Asian market',
      'Prepare examples of working in fast-paced environments'
    ],
    culture: ['Fast-paced', 'Data-driven', 'Entrepreneurial', 'Results-oriented'],
    benefits: ['Competitive salary', 'Employee discounts', 'Learning opportunities', 'International exposure']
  },
  {
    slug: 'grab',
    name: 'Grab',
    industry: 'Technology / Super App',
    description: 'Southeast Asia\'s leading superapp offering ride-hailing, food delivery, payments, and financial services across 8 countries.',
    headquarters: 'Singapore',
    employeeCount: '8,000+',
    interviewProcess: [
      'Online Coding Assessment',
      'Recruiter Phone Screen',
      'Technical Phone Interview',
      'Virtual Onsite (2-3 rounds)',
      'Final Interview with Senior Leadership'
    ],
    commonQuestions: [
      {
        question: 'Design a real-time ride matching system.',
        category: 'technical',
        tip: 'Consider geospatial indexing, matching algorithms, and scalability.'
      },
      {
        question: 'How would you handle a situation where a project deadline is at risk?',
        category: 'situational',
        tip: 'Show proactive communication and problem-solving skills.'
      },
      {
        question: 'Estimate the number of GrabFood orders in Singapore daily.',
        category: 'case',
        tip: 'Break down the problem systematically with clear assumptions.'
      },
      {
        question: 'Implement an LRU cache with O(1) operations.',
        category: 'technical',
        tip: 'Use HashMap combined with doubly linked list.'
      },
      {
        question: 'Describe a time you had to learn something new quickly.',
        category: 'behavioral',
        tip: 'Highlight adaptability and growth mindset.'
      }
    ],
    tips: [
      'Focus on system design and distributed systems concepts',
      'Understand Grab\'s superapp ecosystem and how services interconnect',
      'Prepare for geospatial and real-time data processing questions',
      'Demonstrate passion for solving Southeast Asian problems',
      'Practice estimation/market sizing questions'
    ],
    culture: ['Mission-driven', 'Collaborative', 'Innovation-focused', 'Inclusive'],
    benefits: ['Grab credits', 'Flexible work arrangements', 'Health coverage', 'Learning budget']
  },
  {
    slug: 'google',
    name: 'Google',
    industry: 'Technology',
    description: 'Global technology leader in search, cloud computing, advertising, and various consumer products. Singapore office focuses on APAC operations and engineering.',
    headquarters: 'Mountain View, USA (Singapore APAC HQ)',
    employeeCount: '180,000+ globally',
    interviewProcess: [
      'Online Assessment (2 Coding Problems)',
      'Phone/Video Technical Interview',
      'Virtual Onsite (4-5 rounds)',
      'Team Matching',
      'Hiring Committee Review'
    ],
    commonQuestions: [
      {
        question: 'Design Google Maps navigation system.',
        category: 'technical',
        tip: 'Focus on graph algorithms, real-time updates, and scale.'
      },
      {
        question: 'Tell me about a time you demonstrated leadership.',
        category: 'behavioral',
        tip: 'Google values "Googleyness" - show humility and collaboration.'
      },
      {
        question: 'How many tennis balls can fit in this room?',
        category: 'case',
        tip: 'Show structured thinking, not just the answer.'
      },
      {
        question: 'Find the median of two sorted arrays in O(log n) time.',
        category: 'technical',
        tip: 'Use binary search approach on the smaller array.'
      },
      {
        question: 'Describe a complex problem you solved and how you approached it.',
        category: 'behavioral',
        tip: 'Focus on data-driven decision making and iteration.'
      }
    ],
    tips: [
      'Master data structures and algorithms - practice 150+ LeetCode problems',
      'Understand Big O complexity deeply - space and time',
      'Practice thinking out loud and explaining your approach',
      'Prepare for behavioral questions using the STAR method',
      'Research Google\'s products and recent announcements',
      'Show genuine curiosity and passion for technology'
    ],
    culture: ['Innovation', 'Psychological safety', 'Data-driven', 'User-focused'],
    benefits: ['Competitive compensation', 'Free meals', 'Learning resources', 'Health and wellness programs']
  },
  {
    slug: 'tiktok',
    name: 'TikTok / ByteDance',
    industry: 'Technology / Social Media',
    description: 'Global leader in short-form video content with over 1 billion users. ByteDance Singapore houses key engineering and product teams.',
    headquarters: 'Beijing, China (Singapore Regional HQ)',
    employeeCount: '150,000+ globally',
    interviewProcess: [
      'Online Coding Assessment (2-3 problems)',
      'Technical Phone Screen',
      'Technical Interviews (2-3 rounds)',
      'Behavioral Interview',
      'HR Discussion'
    ],
    commonQuestions: [
      {
        question: 'Design TikTok\'s video recommendation system.',
        category: 'technical',
        tip: 'Cover collaborative filtering, content-based filtering, and real-time ranking.'
      },
      {
        question: 'How do you handle working in ambiguous situations?',
        category: 'situational',
        tip: 'Show initiative and ability to define problems.'
      },
      {
        question: 'Implement a rate limiter for API requests.',
        category: 'technical',
        tip: 'Consider sliding window, token bucket, or leaky bucket algorithms.'
      },
      {
        question: 'What would you do to increase creator engagement on TikTok?',
        category: 'case',
        tip: 'Think about creator incentives, tools, and community features.'
      },
      {
        question: 'Tell me about a project you\'re most proud of.',
        category: 'behavioral',
        tip: 'Quantify impact and explain your specific contributions.'
      }
    ],
    tips: [
      'Strong focus on algorithms - practice medium to hard LeetCode',
      'Understand recommendation systems and machine learning basics',
      'Be prepared for multiple coding rounds with tight time constraints',
      'Research ByteDance\'s product portfolio beyond TikTok',
      'Show entrepreneurial spirit and ability to move fast'
    ],
    culture: ['Fast-paced', 'Always Day 1', 'Data-informed', 'Bold'],
    benefits: ['Competitive pay', 'Meal allowances', 'Gym membership', 'Tech equipment']
  },
  {
    slug: 'meta',
    name: 'Meta',
    industry: 'Technology / Social Media',
    description: 'Parent company of Facebook, Instagram, WhatsApp, and Quest. Singapore office focuses on APAC partnerships and engineering.',
    headquarters: 'Menlo Park, USA (Singapore APAC Office)',
    employeeCount: '70,000+ globally',
    interviewProcess: [
      'Initial Coding Assessment',
      'Recruiter Screen',
      'Technical Phone Interview',
      'Virtual Onsite (3-4 rounds)',
      'Hiring Committee Decision'
    ],
    commonQuestions: [
      {
        question: 'Design Facebook News Feed.',
        category: 'technical',
        tip: 'Consider ranking algorithms, caching, and real-time updates at scale.'
      },
      {
        question: 'Tell me about a time you received critical feedback.',
        category: 'behavioral',
        tip: 'Show growth mindset and how you acted on feedback.'
      },
      {
        question: 'Serialize and deserialize a binary tree.',
        category: 'technical',
        tip: 'Use preorder traversal with null markers.'
      },
      {
        question: 'How would you measure the success of Instagram Stories?',
        category: 'case',
        tip: 'Define metrics for engagement, retention, and creator adoption.'
      },
      {
        question: 'Describe a time you had to make a decision with incomplete information.',
        category: 'situational',
        tip: 'Emphasize data-gathering and risk assessment.'
      }
    ],
    tips: [
      'Practice behavioral questions extensively - Meta values culture fit',
      'Master graph problems and BFS/DFS variations',
      'Understand Meta\'s core values: Move Fast, Be Bold, Focus on Impact',
      'Prepare for product sense questions about Meta\'s apps',
      'Practice coding in a shared document environment'
    ],
    culture: ['Move Fast', 'Be Bold', 'Focus on Long-term Impact', 'Build Social Value'],
    benefits: ['High compensation', 'RSUs', 'Health benefits', 'Wellness programs']
  },
  {
    slug: 'dbs',
    name: 'DBS Bank',
    industry: 'Banking / Finance',
    description: 'Singapore\'s largest bank and leading financial services group in Asia, known for digital innovation and sustainable banking.',
    headquarters: 'Singapore',
    employeeCount: '33,000+',
    interviewProcess: [
      'Online Application & Assessment',
      'HR Phone Screen',
      'Technical/Case Interview',
      'Panel Interview with Business Leaders',
      'Final HR Interview'
    ],
    commonQuestions: [
      {
        question: 'How would you improve DBS\'s mobile banking app?',
        category: 'case',
        tip: 'Research DBS\'s current features and competitor analysis.'
      },
      {
        question: 'Tell me about a time you showed initiative.',
        category: 'behavioral',
        tip: 'Show proactiveness aligned with DBS\'s innovation culture.'
      },
      {
        question: 'How would you design a fraud detection system?',
        category: 'technical',
        tip: 'Consider ML models, rule engines, and real-time processing.'
      },
      {
        question: 'What do you know about DBS\'s digital transformation journey?',
        category: 'behavioral',
        tip: 'Research "Digital to the Core" strategy and Gandalf rating.'
      },
      {
        question: 'Present a solution to increase youth banking adoption.',
        category: 'case',
        tip: 'Think about digital-native features and lifestyle integration.'
      }
    ],
    tips: [
      'Understand DBS\'s position as "World\'s Best Digital Bank"',
      'Research fintech trends and how banks are adapting',
      'Prepare case studies on banking digital transformation',
      'Show interest in sustainable finance and ESG',
      'Demonstrate customer-centric thinking'
    ],
    culture: ['Customer-obsessed', 'Data-driven', 'Agile', 'Purpose-led'],
    benefits: ['Structured internship program', 'Mentorship', 'Banking benefits', 'Return offer potential']
  },
  {
    slug: 'ocbc',
    name: 'OCBC Bank',
    industry: 'Banking / Finance',
    description: 'Singapore\'s oldest bank with a strong regional presence across ASEAN and Greater China, known for wealth management and insurance.',
    headquarters: 'Singapore',
    employeeCount: '30,000+',
    interviewProcess: [
      'Online Application',
      'Cognitive & Personality Assessment',
      'Video Interview',
      'Assessment Centre',
      'Final Panel Interview'
    ],
    commonQuestions: [
      {
        question: 'How would you advise a client on portfolio diversification?',
        category: 'case',
        tip: 'Show understanding of risk management and asset classes.'
      },
      {
        question: 'Describe a situation where you had to influence others.',
        category: 'behavioral',
        tip: 'Use examples showing communication and persuasion skills.'
      },
      {
        question: 'What trends do you see affecting banking in the next 5 years?',
        category: 'situational',
        tip: 'Discuss AI, open banking, sustainability, and digital currencies.'
      },
      {
        question: 'How would you approach a unhappy customer?',
        category: 'situational',
        tip: 'Show empathy, active listening, and resolution focus.'
      },
      {
        question: 'Why banking and why OCBC specifically?',
        category: 'behavioral',
        tip: 'Research OCBC\'s heritage and differentiation from competitors.'
      }
    ],
    tips: [
      'Understand OCBC\'s focus on wealth management and Great Eastern partnership',
      'Prepare for assessment centre with group discussions',
      'Research current banking regulations and compliance landscape',
      'Show interest in OCBC\'s sustainability commitments',
      'Practice video interview format with clear communication'
    ],
    culture: ['Heritage-proud', 'Customer-focused', 'Long-term thinking', 'Integrity'],
    benefits: ['Comprehensive training', 'Cross-functional exposure', 'Healthcare', 'Career development']
  },
  {
    slug: 'uob',
    name: 'UOB',
    industry: 'Banking / Finance',
    description: 'Leading bank in Asia with a network across Southeast Asia, Greater China, and key financial centres worldwide.',
    headquarters: 'Singapore',
    employeeCount: '26,000+',
    interviewProcess: [
      'Online Application',
      'Online Assessment',
      'HR Interview',
      'Business Unit Interview',
      'Senior Leadership Interview'
    ],
    commonQuestions: [
      {
        question: 'How would you analyze a company\'s financial health?',
        category: 'case',
        tip: 'Discuss key financial ratios and qualitative factors.'
      },
      {
        question: 'Tell me about a time you worked in a team to achieve a goal.',
        category: 'behavioral',
        tip: 'Emphasize collaboration and your specific role.'
      },
      {
        question: 'What\'s your view on the future of payments?',
        category: 'situational',
        tip: 'Cover digital wallets, real-time payments, and cross-border solutions.'
      },
      {
        question: 'How would you improve SME banking services?',
        category: 'case',
        tip: 'UOB has strong SME focus - research their current offerings.'
      },
      {
        question: 'Describe a challenging situation and how you overcame it.',
        category: 'behavioral',
        tip: 'Show resilience and problem-solving abilities.'
      }
    ],
    tips: [
      'Research UOB\'s strong SME banking focus and ASEAN expansion',
      'Understand UOB\'s TMRW digital bank initiative',
      'Prepare for competency-based behavioral questions',
      'Show regional mindset and interest in ASEAN markets',
      'Demonstrate understanding of banking fundamentals'
    ],
    culture: ['Honorable', 'Enterprising', 'United', 'Committed'],
    benefits: ['Structured graduate program', 'Regional rotations possible', 'Training', 'Benefits package']
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    industry: 'Fintech / Payments',
    description: 'Global payments infrastructure company powering millions of businesses. Singapore serves as APAC headquarters.',
    headquarters: 'San Francisco, USA (Singapore APAC HQ)',
    employeeCount: '8,000+ globally',
    interviewProcess: [
      'Recruiter Call',
      'Technical Phone Screen',
      'Take-home Project or Live Coding',
      'Virtual Onsite (4-5 rounds)',
      'Final Review'
    ],
    commonQuestions: [
      {
        question: 'Design a payment processing system.',
        category: 'technical',
        tip: 'Consider idempotency, failure handling, and reconciliation.'
      },
      {
        question: 'Tell me about a time you simplified a complex problem.',
        category: 'behavioral',
        tip: 'Stripe values clarity and good judgment.'
      },
      {
        question: 'Debug this API code that\'s returning incorrect responses.',
        category: 'technical',
        tip: 'Think systematically about error handling and edge cases.'
      },
      {
        question: 'How would you help a merchant integrate Stripe payments?',
        category: 'situational',
        tip: 'Show customer empathy and technical communication skills.'
      },
      {
        question: 'What interests you about the payments industry?',
        category: 'behavioral',
        tip: 'Demonstrate genuine curiosity about financial infrastructure.'
      }
    ],
    tips: [
      'Practice building clean, production-quality code',
      'Understand API design principles and RESTful patterns',
      'Research Stripe\'s products: Payments, Billing, Connect, etc.',
      'Prepare for collaborative debugging exercises',
      'Show strong communication and documentation skills'
    ],
    culture: ['Users first', 'Move with urgency', 'Think rigorously', 'Operate with empathy'],
    benefits: ['Competitive compensation', 'Remote flexibility', 'Learning budget', 'Wellness benefits']
  },
  {
    slug: 'amazon',
    name: 'Amazon',
    industry: 'Technology / E-commerce / Cloud',
    description: 'Global leader in e-commerce and cloud computing (AWS). Singapore hosts AWS, retail, and operations teams.',
    headquarters: 'Seattle, USA (Singapore APAC Office)',
    employeeCount: '1.5M+ globally',
    interviewProcess: [
      'Online Assessment (OA)',
      'Phone Screen with Recruiter',
      'Technical Phone Interview',
      'Virtual Onsite Loop (4-5 interviews)',
      'Bar Raiser Interview'
    ],
    commonQuestions: [
      {
        question: 'Design Amazon\'s product recommendation system.',
        category: 'technical',
        tip: 'Cover collaborative filtering and personalization at scale.'
      },
      {
        question: 'Tell me about a time you disagreed with your manager.',
        category: 'behavioral',
        tip: 'Use Leadership Principles: Have Backbone, Disagree and Commit.'
      },
      {
        question: 'Implement a function to find all anagrams of a word.',
        category: 'technical',
        tip: 'Use sorted strings as keys or character frequency maps.'
      },
      {
        question: 'How would you handle a situation where you can\'t meet a deadline?',
        category: 'situational',
        tip: 'Show Ownership and Customer Obsession principles.'
      },
      {
        question: 'Describe a time you invented or simplified something.',
        category: 'behavioral',
        tip: 'Aligns with Invent and Simplify leadership principle.'
      }
    ],
    tips: [
      'MEMORIZE all 16 Amazon Leadership Principles',
      'Prepare 2-3 STAR stories for each Leadership Principle',
      'Practice explaining your thought process while coding',
      'Understand the Bar Raiser concept and its importance',
      'Research the specific team you\'re interviewing with'
    ],
    culture: ['Customer Obsession', 'Ownership', 'Invent and Simplify', 'Bias for Action'],
    benefits: ['Competitive pay', 'Stock options', 'Health benefits', 'Career growth paths']
  },
  {
    slug: 'govtech',
    name: 'GovTech Singapore',
    industry: 'Government / Technology',
    description: 'Singapore government agency driving digital transformation of public services through technology and data.',
    headquarters: 'Singapore',
    employeeCount: '3,000+',
    interviewProcess: [
      'Online Application',
      'Technical Assessment',
      'Technical Interview',
      'Panel Interview',
      'Final Interview with Leadership'
    ],
    commonQuestions: [
      {
        question: 'How would you design a government digital identity system?',
        category: 'technical',
        tip: 'Consider security, privacy, accessibility, and scale.'
      },
      {
        question: 'Why do you want to work in the public sector?',
        category: 'behavioral',
        tip: 'Show genuine interest in public service and impact.'
      },
      {
        question: 'Design an API for citizen services.',
        category: 'technical',
        tip: 'Focus on security, reliability, and ease of integration.'
      },
      {
        question: 'How would you make government services more accessible?',
        category: 'case',
        tip: 'Consider digital divide, elderly users, and multi-language support.'
      },
      {
        question: 'Tell me about a project where you had significant impact.',
        category: 'behavioral',
        tip: 'Quantify impact and show mission alignment.'
      }
    ],
    tips: [
      'Understand Singapore\'s Smart Nation initiative',
      'Research GovTech products: SingPass, LifeSG, TraceTogether, etc.',
      'Show passion for public service and citizen impact',
      'Prepare for discussions on data privacy and security',
      'Demonstrate awareness of accessibility and inclusive design'
    ],
    culture: ['Mission-driven', 'Collaborative', 'Innovative', 'Public service oriented'],
    benefits: ['Meaningful work', 'Work-life balance', 'Training opportunities', 'Government benefits']
  },
  {
    slug: 'lazada',
    name: 'Lazada',
    industry: 'E-commerce',
    description: 'Leading e-commerce platform in Southeast Asia, backed by Alibaba Group. Pioneer of online shopping in the region.',
    headquarters: 'Singapore',
    employeeCount: '10,000+',
    interviewProcess: [
      'Online Application Screening',
      'HR Phone Interview',
      'Technical Assessment/Case Study',
      'Technical/Business Interview (2 rounds)',
      'Final Leadership Interview'
    ],
    commonQuestions: [
      {
        question: 'Design a product search and ranking system.',
        category: 'technical',
        tip: 'Consider relevance, personalization, and conversion optimization.'
      },
      {
        question: 'How would you improve seller onboarding experience?',
        category: 'case',
        tip: 'Think about pain points and process optimization.'
      },
      {
        question: 'Tell me about a time you failed and what you learned.',
        category: 'behavioral',
        tip: 'Show self-awareness and growth mindset.'
      },
      {
        question: 'Implement a function to calculate delivery cost based on zones.',
        category: 'technical',
        tip: 'Consider edge cases and efficiency.'
      },
      {
        question: 'How would you increase GMV for a specific category?',
        category: 'case',
        tip: 'Show understanding of e-commerce metrics and levers.'
      }
    ],
    tips: [
      'Understand Lazada\'s position in SEA and Alibaba ecosystem',
      'Prepare for case studies on marketplace dynamics',
      'Research LazMall, LazGlobal, and logistics capabilities',
      'Show data-driven thinking and hypothesis testing',
      'Demonstrate understanding of seller and buyer experiences'
    ],
    culture: ['Entrepreneurial', 'Fast-moving', 'Results-driven', 'Customer-first'],
    benefits: ['Alibaba ecosystem exposure', 'Employee discounts', 'Regional opportunities', 'Learning culture']
  }
];

export function getCompanyBySlug(slug: string): Company | undefined {
  return COMPANIES.find(company => company.slug === slug);
}

export function getAllCompanies(): Company[] {
  return COMPANIES;
}

export function getCompaniesByIndustry(industry: string): Company[] {
  return COMPANIES.filter(company =>
    company.industry.toLowerCase().includes(industry.toLowerCase())
  );
}
