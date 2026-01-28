export interface TrackModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'overview' | 'roles' | 'questions' | 'case-study' | 'skills';
  content: {
    sections: {
      title: string;
      items: string[];
    }[];
    questions?: {
      question: string;
      category: 'behavioral' | 'technical' | 'case' | 'situational';
      sampleAnswer?: string;
    }[];
    resources?: {
      title: string;
      url?: string;
      type: 'article' | 'video' | 'course' | 'book';
    }[];
  };
}

export interface IndustryTrack {
  slug: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  resourceCount: number;
  modules: TrackModule[];
  relatedCompanies: string[];
  skills: string[];
  salaryRange: string;
  demandLevel: 'High' | 'Medium' | 'Low';
}

export const INDUSTRY_TRACKS: IndustryTrack[] = [
  {
    slug: 'technology',
    name: 'Technology',
    icon: 'code',
    description: 'Software engineering, product management, and tech roles at leading tech companies. Learn to ace technical interviews and system design.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    resourceCount: 45,
    relatedCompanies: ['google', 'meta', 'tiktok', 'grab', 'shopee'],
    skills: ['Data Structures', 'Algorithms', 'System Design', 'API Development', 'Cloud Computing'],
    salaryRange: '$4,000 - $8,000/month',
    demandLevel: 'High',
    modules: [
      {
        id: 'tech-overview',
        title: 'Industry Overview',
        description: 'Understand the tech landscape in Singapore and Southeast Asia',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Singapore Tech Ecosystem',
              items: [
                'Singapore is the tech hub of Southeast Asia with major companies like Grab, Shopee, and Sea Group',
                'Strong government support through Smart Nation initiative and GovTech',
                'Growing startup ecosystem with over 4,000 tech startups',
                'Major global tech companies have APAC headquarters in Singapore'
              ]
            },
            {
              title: 'Key Industry Trends',
              items: [
                'AI and Machine Learning adoption accelerating across industries',
                'Cloud computing and infrastructure growth with AWS, GCP, Azure',
                'Fintech integration with traditional banking',
                'Web3 and blockchain development (regulated environment)',
                'Cybersecurity becoming critical as digital adoption grows'
              ]
            },
            {
              title: 'Career Growth Paths',
              items: [
                'Individual Contributor: Junior → Senior → Staff → Principal Engineer',
                'Management: Tech Lead → Engineering Manager → Director → VP/CTO',
                'Product: Associate PM → PM → Senior PM → Group PM → Director',
                'Many engineers move between product and engineering roles'
              ]
            }
          ],
          resources: [
            { title: 'Singapore Tech Ecosystem Report 2024', type: 'article' },
            { title: 'System Design Primer', type: 'course' },
            { title: 'Cracking the Coding Interview', type: 'book' }
          ]
        }
      },
      {
        id: 'tech-roles',
        title: 'Common Roles',
        description: 'Explore different tech roles and their requirements',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Software Engineer',
              items: [
                'Build and maintain software applications',
                'Skills: Programming languages (Python, Java, JavaScript), data structures, algorithms',
                'Daily work: Writing code, code reviews, debugging, documentation',
                'Interview focus: Coding problems, system design, behavioral'
              ]
            },
            {
              title: 'Product Manager',
              items: [
                'Define product strategy and roadmap',
                'Skills: User research, data analysis, communication, technical understanding',
                'Daily work: User interviews, PRDs, stakeholder alignment, metrics tracking',
                'Interview focus: Product sense, analytical, execution, leadership'
              ]
            },
            {
              title: 'Data Scientist',
              items: [
                'Extract insights from data and build ML models',
                'Skills: Python, SQL, statistics, machine learning, data visualization',
                'Daily work: Data analysis, model building, A/B testing, presentations',
                'Interview focus: Statistics, ML concepts, SQL, case studies'
              ]
            },
            {
              title: 'DevOps/SRE',
              items: [
                'Ensure system reliability and deployment efficiency',
                'Skills: Linux, cloud platforms, CI/CD, monitoring, automation',
                'Daily work: Infrastructure management, incident response, automation',
                'Interview focus: System design, troubleshooting, coding'
              ]
            }
          ]
        }
      },
      {
        id: 'tech-questions',
        title: 'Interview Questions',
        description: 'Practice common tech interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Technical Interview Tips',
              items: [
                'Think out loud - interviewers want to see your thought process',
                'Ask clarifying questions before diving into the solution',
                'Start with a brute force solution, then optimize',
                'Test your code with edge cases',
                'Practice on a whiteboard or shared document'
              ]
            }
          ],
          questions: [
            {
              question: 'Design a URL shortening service like bit.ly',
              category: 'technical',
              sampleAnswer: 'Start with requirements: 100M URLs/day, read-heavy. Use base62 encoding for short URLs, distributed cache (Redis) for reads, NoSQL database for storage. Discuss trade-offs between hash collision handling approaches.'
            },
            {
              question: 'Implement an LRU Cache with O(1) get and put operations',
              category: 'technical',
              sampleAnswer: 'Use a HashMap for O(1) lookup combined with a doubly linked list for O(1) removal and insertion. The map stores key to node reference, list maintains recency order.'
            },
            {
              question: 'Tell me about a time you had to learn a new technology quickly',
              category: 'behavioral',
              sampleAnswer: 'Use STAR method. Focus on your learning approach, resources used, how you applied the knowledge, and the positive outcome. Emphasize growth mindset and adaptability.'
            },
            {
              question: 'How would you improve the performance of a slow API endpoint?',
              category: 'situational',
              sampleAnswer: 'First, measure and profile to identify the bottleneck. Common solutions: add caching, optimize database queries (indexes, query restructuring), pagination, async processing for heavy tasks, CDN for static content.'
            },
            {
              question: 'Find the kth largest element in an unsorted array',
              category: 'technical',
              sampleAnswer: 'Multiple approaches: 1) Sort and return k-1 index - O(n log n), 2) Min-heap of size k - O(n log k), 3) Quickselect - O(n) average. Discuss trade-offs based on constraints.'
            }
          ]
        }
      },
      {
        id: 'tech-case',
        title: 'Case Studies',
        description: 'Learn from real tech scenarios and system designs',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case Study: Designing Grab Ride Matching',
              items: [
                'Problem: Match riders with nearby available drivers in real-time',
                'Challenges: Geospatial indexing, dynamic pricing, driver allocation fairness',
                'Solution approach: Geohash for location indexing, queuing system for requests',
                'Considerations: Peak hours, driver preferences, estimated arrival time accuracy'
              ]
            },
            {
              title: 'Case Study: Shopee Flash Sale System',
              items: [
                'Problem: Handle millions of concurrent users during flash sales',
                'Challenges: Inventory management, preventing overselling, system stability',
                'Solution approach: Distributed locks, queue-based ordering, inventory pre-warming',
                'Key metrics: Requests per second, success rate, latency percentiles'
              ]
            },
            {
              title: 'Case Study: Building a News Feed',
              items: [
                'Problem: Show relevant content to users in real-time',
                'Approaches: Push model (fanout on write) vs Pull model (fanout on read)',
                'Trade-offs: Write amplification vs Read latency',
                'Additional features: Ranking algorithm, content diversity, real-time updates'
              ]
            }
          ]
        }
      },
      {
        id: 'tech-skills',
        title: 'Technical Skills',
        description: 'Build the skills needed for tech interviews',
        duration: '90 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Data Structures to Master',
              items: [
                'Arrays and Strings - manipulation, sliding window, two pointers',
                'Hash Tables - O(1) lookups, collision handling',
                'Trees and Graphs - BFS, DFS, traversals',
                'Heaps - priority queues, top K problems',
                'Linked Lists - fast/slow pointers, reversal'
              ]
            },
            {
              title: 'Algorithms',
              items: [
                'Sorting - quicksort, mergesort, understand trade-offs',
                'Binary Search - on sorted arrays, answer space',
                'Dynamic Programming - memoization, tabulation',
                'Graph algorithms - BFS, DFS, Dijkstra, topological sort',
                'Recursion and Backtracking'
              ]
            },
            {
              title: 'System Design Concepts',
              items: [
                'Load balancing and horizontal scaling',
                'Caching strategies (Redis, Memcached)',
                'Database design (SQL vs NoSQL, sharding)',
                'Message queues (Kafka, RabbitMQ)',
                'Microservices architecture'
              ]
            }
          ],
          resources: [
            { title: 'LeetCode Top 150 Problems', type: 'course' },
            { title: 'System Design Interview Book', type: 'book' },
            { title: 'Grokking System Design', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'finance-banking',
    name: 'Finance & Banking',
    icon: 'building-library',
    description: 'Investment banking, corporate finance, and wealth management at top financial institutions. Master financial modeling and case interviews.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    resourceCount: 38,
    relatedCompanies: ['dbs', 'ocbc', 'uob', 'stripe'],
    skills: ['Financial Modeling', 'Valuation', 'Excel', 'Bloomberg Terminal', 'Risk Analysis'],
    salaryRange: '$4,500 - $9,000/month',
    demandLevel: 'High',
    modules: [
      {
        id: 'finance-overview',
        title: 'Industry Overview',
        description: 'Understand Singapore as a financial hub',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Singapore Financial Landscape',
              items: [
                'Singapore is Asia\'s leading financial center with 200+ banks',
                'Three local banks (DBS, OCBC, UOB) are among the strongest in the world',
                'Major investment banks have significant APAC operations here',
                'Growing fintech sector with digital banking licenses issued'
              ]
            },
            {
              title: 'Key Trends in Banking',
              items: [
                'Digital transformation - mobile banking, AI-powered services',
                'ESG and sustainable finance becoming mainstream',
                'Open banking and API integration',
                'Wealth management growth with rising APAC wealth',
                'Regulatory focus on cybersecurity and data protection'
              ]
            },
            {
              title: 'Career Paths',
              items: [
                'Investment Banking: Analyst → Associate → VP → Director → MD',
                'Corporate Banking: Analyst → Manager → Senior Manager → Director',
                'Wealth Management: RM → Senior RM → Team Lead → Director',
                'Risk & Compliance: Analyst → Manager → Senior Manager → Head'
              ]
            }
          ]
        }
      },
      {
        id: 'finance-roles',
        title: 'Common Roles',
        description: 'Explore different finance and banking roles',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Investment Banking Analyst',
              items: [
                'Work on M&A, IPOs, debt financing, and advisory projects',
                'Skills: Financial modeling, valuation, PowerPoint, attention to detail',
                'Daily work: Building models, creating pitchbooks, due diligence',
                'Interview focus: Technicals, fit questions, deal experience'
              ]
            },
            {
              title: 'Corporate Banker',
              items: [
                'Provide financing solutions to corporate clients',
                'Skills: Credit analysis, relationship management, product knowledge',
                'Daily work: Client meetings, credit proposals, portfolio management',
                'Interview focus: Credit analysis, commercial awareness, fit'
              ]
            },
            {
              title: 'Wealth Management',
              items: [
                'Manage portfolios and advise high-net-worth individuals',
                'Skills: Investment knowledge, relationship building, sales',
                'Daily work: Client meetings, portfolio reviews, market updates',
                'Interview focus: Market knowledge, client scenarios, sales aptitude'
              ]
            },
            {
              title: 'Risk Analyst',
              items: [
                'Identify, measure, and monitor financial risks',
                'Skills: Quantitative analysis, VaR, stress testing, regulations',
                'Daily work: Risk reports, model validation, policy development',
                'Interview focus: Technical risk concepts, case studies'
              ]
            }
          ]
        }
      },
      {
        id: 'finance-questions',
        title: 'Interview Questions',
        description: 'Practice finance interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Technical Interview Tips',
              items: [
                'Know your accounting - understand all three financial statements',
                'Practice mental math for quick calculations',
                'Stay updated on market news and recent deals',
                'Prepare your "Why finance?" and "Why this bank?" answers',
                'Have 2-3 market ideas ready to discuss'
              ]
            }
          ],
          questions: [
            {
              question: 'Walk me through a DCF valuation',
              category: 'technical',
              sampleAnswer: 'Project free cash flows for 5-10 years, calculate terminal value using perpetuity growth or exit multiple method, discount back to present value using WACC, sum FCFs and terminal value for enterprise value, subtract net debt for equity value.'
            },
            {
              question: 'If a company has negative working capital, is that good or bad?',
              category: 'technical',
              sampleAnswer: 'Depends on the context. For retail (like Shopee), negative working capital can be good - collecting from customers before paying suppliers. For manufacturing, it might indicate cash flow issues. Always analyze the business model.'
            },
            {
              question: 'Tell me about a recent deal you found interesting',
              category: 'situational',
              sampleAnswer: 'Prepare 2-3 recent M&A deals or IPOs in Singapore/APAC. Discuss deal rationale, valuation, challenges, and your view on whether it was good for stakeholders.'
            },
            {
              question: 'How would you value a private company with no comparable public companies?',
              category: 'case',
              sampleAnswer: 'Use precedent transactions, DCF with industry benchmarks, asset-based valuation, or venture capital method for startups. Apply appropriate discounts for illiquidity and lack of information.'
            },
            {
              question: 'If interest rates rise, what happens to bond prices and bank profitability?',
              category: 'technical',
              sampleAnswer: 'Bond prices fall (inverse relationship). Banks generally benefit short-term as net interest margins expand (loan rates reprice faster than deposits). Long-term depends on economic impact and credit quality.'
            }
          ]
        }
      },
      {
        id: 'finance-case',
        title: 'Case Studies',
        description: 'Work through finance case studies',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case: M&A Deal Analysis',
              items: [
                'Scenario: Company A (tech) acquiring Company B (fintech) for $500M',
                'Analyze: Strategic rationale, synergies, financing options',
                'Valuation: Comparable companies, precedent transactions, DCF',
                'Considerations: Regulatory approval, integration risks, culture fit'
              ]
            },
            {
              title: 'Case: Credit Analysis',
              items: [
                'Scenario: SME seeking $5M loan for expansion',
                'Analyze: Financial statements, cash flow coverage, collateral',
                'Risk factors: Industry outlook, management experience, market position',
                'Decision: Loan amount, terms, covenants, pricing'
              ]
            },
            {
              title: 'Case: Portfolio Construction',
              items: [
                'Scenario: Build portfolio for 45-year-old with $1M, moderate risk tolerance',
                'Consider: Time horizon, liquidity needs, tax situation',
                'Asset allocation: Equities, bonds, alternatives, cash',
                'Implementation: Direct stocks vs funds, geographic diversification'
              ]
            }
          ]
        }
      },
      {
        id: 'finance-skills',
        title: 'Technical Skills',
        description: 'Build skills for finance interviews',
        duration: '90 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Financial Statement Analysis',
              items: [
                'Income Statement: Revenue, margins, operating leverage',
                'Balance Sheet: Assets, liabilities, working capital, leverage ratios',
                'Cash Flow Statement: Operating, investing, financing activities',
                'Linking statements: Net income → Cash flow → Balance sheet'
              ]
            },
            {
              title: 'Valuation Methods',
              items: [
                'DCF: WACC calculation, terminal value, sensitivity analysis',
                'Comparable Companies: EV/EBITDA, P/E, sector-specific multiples',
                'Precedent Transactions: Control premiums, deal synergies',
                'LBO: Returns analysis, debt capacity, exit assumptions'
              ]
            },
            {
              title: 'Excel & Financial Modeling',
              items: [
                'Keyboard shortcuts - reduce mouse usage',
                'Three-statement model construction',
                'Sensitivity and scenario analysis',
                'Data tables and goal seek',
                'Model auditing and error checking'
              ]
            }
          ],
          resources: [
            { title: 'Wall Street Prep - Financial Modeling', type: 'course' },
            { title: 'Investment Banking Interview Guide', type: 'book' },
            { title: 'Breaking Into Wall Street', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'consulting',
    name: 'Consulting',
    icon: 'presentation-chart',
    description: 'Strategy consulting and management consulting at top firms. Master case interviews and structured problem-solving.',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    resourceCount: 42,
    relatedCompanies: [],
    skills: ['Problem Solving', 'Case Interview', 'PowerPoint', 'Data Analysis', 'Communication'],
    salaryRange: '$5,000 - $8,500/month',
    demandLevel: 'High',
    modules: [
      {
        id: 'consulting-overview',
        title: 'Industry Overview',
        description: 'Understand the consulting landscape',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Consulting in Singapore',
              items: [
                'Major strategy firms: McKinsey, BCG, Bain (MBB) have strong Singapore presence',
                'Big 4 consulting: Deloitte, PwC, EY, KPMG offer strategy and operations',
                'Boutique firms specializing in digital, sustainability, and regional expertise',
                'Growing demand for digital transformation and ESG consulting'
              ]
            },
            {
              title: 'Types of Consulting',
              items: [
                'Strategy Consulting: Corporate strategy, growth, M&A due diligence',
                'Operations Consulting: Supply chain, process improvement, cost reduction',
                'Technology Consulting: Digital transformation, system implementation',
                'HR/Organization: Talent strategy, change management, culture'
              ]
            },
            {
              title: 'Career Path',
              items: [
                'Business Analyst/Associate → Consultant → Manager → Principal → Partner',
                'Typical 2-3 years per level, up-or-out culture',
                'Exit opportunities: Corporate strategy, startups, PE/VC, industry roles',
                'Many return as experienced hires or industry experts'
              ]
            }
          ]
        }
      },
      {
        id: 'consulting-roles',
        title: 'Common Roles',
        description: 'Explore consulting roles and expectations',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Business Analyst / Associate',
              items: [
                'Entry-level role focused on analysis and deliverable creation',
                'Skills: Excel, PowerPoint, structured thinking, communication',
                'Daily work: Data analysis, client interviews, slide creation, research',
                'Interview: Case interviews, fit interviews, written tests'
              ]
            },
            {
              title: 'Consultant',
              items: [
                'Lead workstreams and manage analysts',
                'Skills: Project management, client management, synthesis',
                'Daily work: Workstream ownership, client presentations, team leadership',
                'Typical after 2-3 years as analyst'
              ]
            },
            {
              title: 'Manager',
              items: [
                'Manage entire project and client relationships',
                'Skills: Business development, team leadership, executive presence',
                'Daily work: Client meetings, project direction, team coaching',
                'Some firms have MBA recruiting at this level'
              ]
            }
          ]
        }
      },
      {
        id: 'consulting-questions',
        title: 'Interview Questions',
        description: 'Practice case and fit interview questions',
        duration: '90 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Case Interview Tips',
              items: [
                'Take time to structure - don\'t rush into the case',
                'Clarify the objective and key constraints',
                'Use frameworks as a starting point, not a rigid structure',
                'Be hypothesis-driven and test your hypotheses',
                'Synthesize findings into a clear recommendation'
              ]
            },
            {
              title: 'Fit Interview Tips',
              items: [
                'Use STAR method for behavioral stories',
                'Prepare 5-6 stories that cover leadership, teamwork, challenges',
                'Know your resume inside out',
                'Research the specific firm culture and values',
                'Prepare thoughtful questions for the interviewer'
              ]
            }
          ],
          questions: [
            {
              question: 'Case: Your client is a Singapore airline seeing declining profits. How would you approach this?',
              category: 'case',
              sampleAnswer: 'Structure into revenue and cost. Revenue: passenger volume x yield (price per seat-km). Cost: fixed (fleet, staff) vs variable (fuel, maintenance). Explore market trends, competitive position, and operational efficiency. Hypothesize most likely drivers and test with data.'
            },
            {
              question: 'Case: A bubble tea chain wants to expand to 100 stores. Is this a good idea?',
              category: 'case',
              sampleAnswer: 'Assess market size and saturation, current store economics (sales, margins, payback), operational capability to scale, competitive landscape, capital requirements. Recommend based on unit economics and market opportunity.'
            },
            {
              question: 'Tell me about a time you led a team through a difficult situation',
              category: 'behavioral',
              sampleAnswer: 'STAR format: Describe specific situation, your leadership actions (communication, problem-solving, motivation), the outcome, and lessons learned. Show self-awareness and growth.'
            },
            {
              question: 'Why consulting? Why this firm?',
              category: 'behavioral',
              sampleAnswer: 'Be genuine about your interest in problem-solving, variety, and learning. Research firm-specific differentiators - culture, industries, approach. Connect to your personal experiences and career goals.'
            },
            {
              question: 'Estimate the market size for electric vehicles in Singapore',
              category: 'case',
              sampleAnswer: 'Top-down: Total vehicles → annual new car sales → EV adoption %. Bottom-up: Segments (private, taxis, commercial) × estimated EV penetration. Consider government incentives and charging infrastructure.'
            }
          ]
        }
      },
      {
        id: 'consulting-case',
        title: 'Case Studies',
        description: 'Practice full case interview scenarios',
        duration: '60 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Profitability Case',
              items: [
                'Client: Regional restaurant chain with 50 outlets',
                'Problem: Profits declined 20% despite flat revenues',
                'Structure: Revenue (price x volume) and Costs (fixed + variable)',
                'Key insight: Food costs increased, labor productivity decreased',
                'Recommendation: Menu optimization, kitchen process improvement'
              ]
            },
            {
              title: 'Market Entry Case',
              items: [
                'Client: Singapore fintech considering Indonesia expansion',
                'Structure: Market attractiveness, competitive landscape, entry strategy',
                'Considerations: Regulation, partnerships, localization needs',
                'Key questions: Market size, customer needs, competitive moats',
                'Recommendation framework: Go/No-go decision with entry approach'
              ]
            },
            {
              title: 'Growth Strategy Case',
              items: [
                'Client: E-commerce platform seeking 3x growth in 5 years',
                'Structure: Current baseline, growth levers, feasibility',
                'Growth options: Geographic, product expansion, M&A, new segments',
                'Prioritization: Impact, feasibility, strategic fit',
                'Recommendation: Prioritized initiatives with resource requirements'
              ]
            }
          ]
        }
      },
      {
        id: 'consulting-skills',
        title: 'Technical Skills',
        description: 'Build consulting-specific skills',
        duration: '45 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Case Frameworks',
              items: [
                'Profitability: Revenue - Costs, decompose each',
                'Market Entry: Market, Competition, Capabilities, Financials',
                'M&A: Strategic rationale, Synergies, Risks, Valuation',
                'Growth: Ansoff Matrix - Market penetration, development, product, diversification',
                'Remember: Frameworks are starting points, not answers'
              ]
            },
            {
              title: 'Quantitative Skills',
              items: [
                'Mental math: Practice quick calculations',
                'Market sizing: Top-down vs bottom-up approaches',
                'Break-even analysis: Fixed costs ÷ contribution margin',
                'NPV/IRR basics for investment decisions',
                'Sensitivity analysis for key assumptions'
              ]
            },
            {
              title: 'Communication Skills',
              items: [
                'Pyramid principle: Lead with the answer',
                'MECE: Mutually Exclusive, Collectively Exhaustive',
                'So-what test: Every slide needs a clear message',
                'Storyboarding: Structure before details',
                'Executive presence: Confident, concise, clear'
              ]
            }
          ],
          resources: [
            { title: 'Case in Point', type: 'book' },
            { title: 'Victor Cheng - Case Interview Secrets', type: 'video' },
            { title: 'PrepLounge - Case Interview Practice', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    icon: 'megaphone',
    description: 'Brand management, digital marketing, and marketing analytics at top companies. Learn to create impactful campaigns and drive growth.',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    resourceCount: 32,
    relatedCompanies: ['shopee', 'grab', 'lazada'],
    skills: ['Digital Marketing', 'Analytics', 'Content Strategy', 'Brand Management', 'Campaign Management'],
    salaryRange: '$3,500 - $6,000/month',
    demandLevel: 'Medium',
    modules: [
      {
        id: 'marketing-overview',
        title: 'Industry Overview',
        description: 'Understand the marketing landscape',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Marketing in Singapore',
              items: [
                'Singapore is regional marketing hub for many MNCs',
                'Strong digital marketing ecosystem with tech platforms',
                'E-commerce growth driving performance marketing demand',
                'Influencer marketing and social commerce growing rapidly'
              ]
            },
            {
              title: 'Marketing Trends',
              items: [
                'Data-driven marketing and personalization',
                'Social commerce integration (TikTok Shop, Instagram Shopping)',
                'First-party data strategies post-cookie deprecation',
                'AI in content creation and campaign optimization',
                'Sustainability and purpose-driven marketing'
              ]
            },
            {
              title: 'Career Paths',
              items: [
                'Brand Marketing: Brand Executive → Manager → Director → CMO',
                'Digital Marketing: Specialist → Manager → Head of Digital',
                'Analytics: Marketing Analyst → Lead → Director of Analytics',
                'Growth: Growth Marketer → Growth Lead → VP Growth'
              ]
            }
          ]
        }
      },
      {
        id: 'marketing-roles',
        title: 'Common Roles',
        description: 'Explore marketing roles and requirements',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Brand Marketing',
              items: [
                'Build and maintain brand equity and positioning',
                'Skills: Brand strategy, consumer insights, creative direction',
                'Daily work: Campaign planning, agency management, brand guidelines',
                'Interview: Brand case studies, campaign concepts, fit'
              ]
            },
            {
              title: 'Digital Marketing',
              items: [
                'Plan and execute digital campaigns across channels',
                'Skills: Paid media, SEO/SEM, analytics, marketing automation',
                'Daily work: Campaign management, A/B testing, reporting',
                'Interview: Channel expertise, metrics interpretation, optimization'
              ]
            },
            {
              title: 'Growth Marketing',
              items: [
                'Drive user acquisition, activation, and retention',
                'Skills: Experimentation, data analysis, product marketing',
                'Daily work: Growth experiments, funnel optimization, analytics',
                'Interview: Growth cases, metrics, experimentation approach'
              ]
            },
            {
              title: 'Marketing Analytics',
              items: [
                'Measure campaign effectiveness and provide insights',
                'Skills: SQL, analytics tools, statistics, visualization',
                'Daily work: Dashboards, attribution analysis, reporting',
                'Interview: Technical skills, business interpretation'
              ]
            }
          ]
        }
      },
      {
        id: 'marketing-questions',
        title: 'Interview Questions',
        description: 'Practice marketing interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Marketing Interview Tips',
              items: [
                'Bring a portfolio of campaigns or projects you\'ve worked on',
                'Be data-driven - always mention metrics and results',
                'Stay updated on marketing trends and case studies',
                'Show creativity but ground it in strategy',
                'Demonstrate understanding of the full marketing funnel'
              ]
            }
          ],
          questions: [
            {
              question: 'How would you increase user acquisition for Grab by 20%?',
              category: 'case',
              sampleAnswer: 'Analyze current channels and CAC, identify underperforming and high-potential channels. Consider referral programs, partnerships, localized campaigns. Propose A/B tests with clear success metrics.'
            },
            {
              question: 'Tell me about a campaign you ran and its results',
              category: 'behavioral',
              sampleAnswer: 'STAR format with metrics. Describe objective, strategy, execution, and results. Include learnings and what you would do differently. Show ownership and impact.'
            },
            {
              question: 'How do you measure the success of a brand campaign?',
              category: 'technical',
              sampleAnswer: 'Define objectives (awareness, consideration, sentiment). Metrics: brand lift studies, share of voice, NPS, social sentiment. Balance leading indicators with lagging business metrics. Discuss attribution challenges.'
            },
            {
              question: 'Facebook CPM increased 30%. What would you do?',
              category: 'situational',
              sampleAnswer: 'Diagnose the cause: competition, seasonality, targeting, creative fatigue. Test new audiences, refresh creatives, explore alternative channels. Consider the holistic CAC and ROAS, not just CPM.'
            },
            {
              question: 'Design a go-to-market strategy for a new product launch',
              category: 'case',
              sampleAnswer: 'Define target audience and positioning. Plan launch phases: teaser, launch, sustain. Channel mix based on audience behavior. Create content strategy. Set success metrics and measurement plan.'
            }
          ]
        }
      },
      {
        id: 'marketing-case',
        title: 'Case Studies',
        description: 'Learn from successful marketing campaigns',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case: Shopee 11.11 Campaign',
              items: [
                'Objective: Drive massive sales during 11.11 shopping festival',
                'Strategy: Multi-channel campaign with celebrity endorsements, games, vouchers',
                'Execution: TV, digital, in-app, influencers, partnership deals',
                'Results: Record-breaking orders, app downloads, engagement metrics',
                'Key learnings: Gamification, urgency, omnichannel integration'
              ]
            },
            {
              title: 'Case: Viral Growth Campaign',
              items: [
                'Scenario: Food delivery app launching referral program',
                'Design: Incentive structure for referrer and referee',
                'Mechanics: Frictionless sharing, tracking, reward fulfillment',
                'Optimization: Segment high-value referrers, prevent fraud',
                'Metrics: K-factor, referral CAC vs paid CAC, LTV of referred users'
              ]
            },
            {
              title: 'Case: Rebranding Exercise',
              items: [
                'Scenario: Traditional bank repositioning for younger audience',
                'Research: Current perception, target audience insights',
                'Strategy: Brand essence, visual identity, messaging',
                'Rollout: Internal alignment, phased external launch',
                'Measurement: Brand tracking study, social sentiment, NPS'
              ]
            }
          ]
        }
      },
      {
        id: 'marketing-skills',
        title: 'Technical Skills',
        description: 'Build skills for marketing roles',
        duration: '45 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Digital Marketing Channels',
              items: [
                'Paid Social: Facebook/Instagram, TikTok, LinkedIn targeting and optimization',
                'Search: Google Ads, SEO fundamentals, keyword strategy',
                'Programmatic: DSPs, audience targeting, brand safety',
                'Email/CRM: Segmentation, automation, personalization',
                'Affiliate: Partner management, attribution, commission structures'
              ]
            },
            {
              title: 'Analytics & Tools',
              items: [
                'Google Analytics: Attribution, funnels, audience analysis',
                'Excel/Sheets: Pivot tables, VLOOKUP, data analysis',
                'SQL: Basic queries for marketing data',
                'Visualization: Creating impactful dashboards',
                'Marketing automation: HubSpot, Marketo, etc.'
              ]
            },
            {
              title: 'Creative & Content',
              items: [
                'Copywriting: Headlines, CTAs, email copy',
                'Brief writing: Clear creative direction',
                'Content planning: Editorial calendars, content pillars',
                'UGC and influencer content management',
                'Video content basics for social media'
              ]
            }
          ],
          resources: [
            { title: 'Google Digital Marketing Certification', type: 'course' },
            { title: 'Meta Blueprint', type: 'course' },
            { title: 'Marketing Analytics - Coursera', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    icon: 'heart',
    description: 'Healthcare management, pharmaceuticals, and healthtech roles. Make an impact on public health and medical innovation.',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    resourceCount: 28,
    relatedCompanies: [],
    skills: ['Healthcare Operations', 'Regulatory Knowledge', 'Clinical Research', 'Health Economics', 'Data Analysis'],
    salaryRange: '$3,500 - $6,500/month',
    demandLevel: 'Medium',
    modules: [
      {
        id: 'healthcare-overview',
        title: 'Industry Overview',
        description: 'Understand the healthcare industry in Singapore',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Healthcare in Singapore',
              items: [
                'World-class healthcare system ranked among the best globally',
                'Major clusters: SingHealth, NUHS, NHG with multiple hospitals',
                'Growing biomedical and pharmaceutical sector',
                'Emerging healthtech and digital health ecosystem'
              ]
            },
            {
              title: 'Industry Trends',
              items: [
                'Aging population driving demand for elder care and chronic disease management',
                'Telemedicine and digital health accelerated by COVID-19',
                'AI in diagnostics and drug discovery',
                'Precision medicine and genomics',
                'Mental health awareness and services expansion'
              ]
            },
            {
              title: 'Career Paths',
              items: [
                'Hospital Administration: Executive → Manager → Director → CEO',
                'Pharma/Medical Affairs: Associate → Manager → Director → VP',
                'Healthtech: Product Manager, Data Scientist, Operations',
                'Clinical Research: CRA → Lead → Manager → Director'
              ]
            }
          ]
        }
      },
      {
        id: 'healthcare-roles',
        title: 'Common Roles',
        description: 'Explore healthcare industry roles',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Healthcare Management',
              items: [
                'Manage hospital operations and improve patient care',
                'Skills: Operations management, healthcare finance, quality improvement',
                'Daily work: Process improvement, stakeholder management, reporting',
                'Interview: Case studies, healthcare knowledge, leadership'
              ]
            },
            {
              title: 'Pharmaceutical - Commercial',
              items: [
                'Market pharmaceutical products to healthcare providers',
                'Skills: Product knowledge, sales, regulatory understanding',
                'Daily work: HCP engagement, territory management, education',
                'Interview: Role plays, product knowledge, healthcare scenarios'
              ]
            },
            {
              title: 'Clinical Research',
              items: [
                'Conduct and manage clinical trials',
                'Skills: GCP knowledge, project management, attention to detail',
                'Daily work: Site monitoring, data review, regulatory submissions',
                'Interview: Technical knowledge, scenario questions, compliance'
              ]
            },
            {
              title: 'Healthtech Product',
              items: [
                'Build digital health products and solutions',
                'Skills: Product management, healthcare domain, technical understanding',
                'Daily work: User research, requirements, stakeholder alignment',
                'Interview: Product cases, healthcare understanding, technical'
              ]
            }
          ]
        }
      },
      {
        id: 'healthcare-questions',
        title: 'Interview Questions',
        description: 'Practice healthcare interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Healthcare Interview Tips',
              items: [
                'Show genuine passion for healthcare and patient impact',
                'Understand the Singapore healthcare system structure',
                'Stay updated on healthcare policy and trends',
                'For pharma, know the regulatory environment',
                'Demonstrate ethical awareness and patient-first thinking'
              ]
            }
          ],
          questions: [
            {
              question: 'How would you reduce patient wait times at a polyclinic?',
              category: 'case',
              sampleAnswer: 'Analyze current patient flow and bottlenecks. Consider appointment optimization, triage improvements, parallel processing, digital pre-registration. Balance efficiency with care quality. Propose pilot and measurement plan.'
            },
            {
              question: 'Why healthcare? What attracts you to this industry?',
              category: 'behavioral',
              sampleAnswer: 'Be genuine about your motivation - personal experiences, impact potential, intellectual interest. Connect to specific role and show you understand healthcare challenges and rewards.'
            },
            {
              question: 'How would you launch a new diabetes drug in Singapore?',
              category: 'case',
              sampleAnswer: 'Regulatory approval pathway, KOL engagement, clinical data positioning, payer strategy (CPF, Medishield), HCP education, patient support programs. Consider competition and differentiation.'
            },
            {
              question: 'Describe a time you dealt with an ethical dilemma',
              category: 'behavioral',
              sampleAnswer: 'Healthcare values ethics highly. Share a genuine example showing your thought process, stakeholder considerations, and how you reached a principled decision. Show maturity and integrity.'
            },
            {
              question: 'How would you improve medication adherence for chronic disease patients?',
              category: 'situational',
              sampleAnswer: 'Identify barriers: cost, complexity, side effects, forgetfulness. Solutions: simplified regimens, reminder apps, patient education, pharmacist counseling, packaging innovations. Measure adherence rates and outcomes.'
            }
          ]
        }
      },
      {
        id: 'healthcare-case',
        title: 'Case Studies',
        description: 'Work through healthcare scenarios',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case: Hospital Efficiency',
              items: [
                'Problem: ER overcrowding and long wait times',
                'Analysis: Patient flow, triage process, bed availability',
                'Solutions: Fast track for minor cases, predictive admission, care coordination',
                'Implementation: Change management, staff training, technology',
                'Metrics: Wait times, patient satisfaction, length of stay'
              ]
            },
            {
              title: 'Case: Telemedicine Adoption',
              items: [
                'Objective: Increase telemedicine utilization post-pandemic',
                'Challenges: Elderly population, tech literacy, doctor adoption',
                'Strategy: Patient education, simple UI, integration with existing care',
                'Metrics: Adoption rate, patient satisfaction, clinical outcomes',
                'Sustainability: Business model, reimbursement, regulatory'
              ]
            },
            {
              title: 'Case: Pharmaceutical Market Access',
              items: [
                'Scenario: New cancer drug seeking MOH subsidy',
                'Requirements: Clinical evidence, cost-effectiveness analysis',
                'Strategy: Health economics study, KOL advocacy, patient advocacy',
                'Negotiation: Price-volume agreements, outcomes-based contracts',
                'Timeline: 12-18 months for subsidy application'
              ]
            }
          ]
        }
      },
      {
        id: 'healthcare-skills',
        title: 'Technical Skills',
        description: 'Build healthcare industry skills',
        duration: '45 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Healthcare Knowledge',
              items: [
                'Singapore healthcare system: Public vs private, financing (3Ms)',
                'Healthcare regulations: HSA, MOH guidelines, data protection',
                'Healthcare economics: QALY, ICER, HTA processes',
                'Quality frameworks: JCI, accreditation, safety protocols',
                'Epidemiology basics: Disease prevalence, outcomes research'
              ]
            },
            {
              title: 'Industry-Specific Skills',
              items: [
                'Clinical research: GCP, ICH guidelines, protocol development',
                'Pharmaceutical: Drug development process, commercial models',
                'Hospital operations: Lean healthcare, patient flow, quality improvement',
                'Health informatics: EHR systems, interoperability, data standards'
              ]
            },
            {
              title: 'Transferable Skills',
              items: [
                'Data analysis: Healthcare analytics, outcome measurement',
                'Project management: Complex stakeholder environments',
                'Communication: Medical writing, presentations to HCPs',
                'Problem-solving: Root cause analysis, process improvement'
              ]
            }
          ],
          resources: [
            { title: 'Healthcare Management - Coursera', type: 'course' },
            { title: 'Singapore Healthcare System Overview', type: 'article' },
            { title: 'Clinical Trials Fundamentals', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'engineering',
    name: 'Engineering',
    icon: 'wrench',
    description: 'Mechanical, electrical, civil, and chemical engineering at top firms. Apply your technical skills to real-world projects.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    resourceCount: 35,
    relatedCompanies: [],
    skills: ['CAD/CAM', 'Technical Analysis', 'Project Management', 'Safety Compliance', 'Problem Solving'],
    salaryRange: '$3,500 - $5,500/month',
    demandLevel: 'Medium',
    modules: [
      {
        id: 'engineering-overview',
        title: 'Industry Overview',
        description: 'Understand engineering opportunities in Singapore',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Engineering in Singapore',
              items: [
                'Major sectors: Electronics, petrochemicals, aerospace, marine, construction',
                'Government focus on advanced manufacturing and Industry 4.0',
                'Strong infrastructure development - MRT, HDB, Changi Airport',
                'Growing sustainability and green technology focus'
              ]
            },
            {
              title: 'Industry Trends',
              items: [
                'Automation and robotics adoption accelerating',
                'Digital twins and simulation-driven design',
                'Sustainable engineering and green buildings',
                'Additive manufacturing (3D printing) for production',
                'IoT and smart infrastructure'
              ]
            },
            {
              title: 'Career Paths',
              items: [
                'Technical: Engineer → Senior Engineer → Principal → Chief Engineer',
                'Management: Engineer → Project Manager → Director → VP Engineering',
                'Specialists: Design, R&D, Quality, Safety tracks',
                'Cross-functional: Move to product management, consulting, business roles'
              ]
            }
          ]
        }
      },
      {
        id: 'engineering-roles',
        title: 'Common Roles',
        description: 'Explore engineering roles across industries',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Design Engineer',
              items: [
                'Create product designs and specifications',
                'Skills: CAD software, engineering principles, creativity',
                'Daily work: 3D modeling, simulations, prototyping, documentation',
                'Interview: Technical questions, design challenges, portfolio'
              ]
            },
            {
              title: 'Process Engineer',
              items: [
                'Optimize manufacturing and industrial processes',
                'Skills: Lean/Six Sigma, data analysis, process simulation',
                'Daily work: Process improvement, troubleshooting, capacity planning',
                'Interview: Process cases, problem-solving, technical knowledge'
              ]
            },
            {
              title: 'Project Engineer',
              items: [
                'Manage engineering projects from concept to completion',
                'Skills: Project management, technical coordination, vendor management',
                'Daily work: Planning, stakeholder coordination, progress tracking',
                'Interview: Project scenarios, leadership, technical breadth'
              ]
            },
            {
              title: 'R&D Engineer',
              items: [
                'Research and develop new products and technologies',
                'Skills: Research methodology, prototyping, technical writing',
                'Daily work: Experiments, analysis, documentation, collaboration',
                'Interview: Research experience, problem-solving, innovation'
              ]
            }
          ]
        }
      },
      {
        id: 'engineering-questions',
        title: 'Interview Questions',
        description: 'Practice engineering interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Engineering Interview Tips',
              items: [
                'Bring your portfolio or project documentation',
                'Be ready to do calculations on the spot',
                'Review fundamental engineering principles',
                'Prepare examples of problem-solving and innovation',
                'Know the company\'s products and technical challenges'
              ]
            }
          ],
          questions: [
            {
              question: 'Describe a technical problem you solved and your approach',
              category: 'behavioral',
              sampleAnswer: 'STAR format focusing on your systematic approach, tools/methods used, collaboration, and results. Quantify the impact if possible (cost savings, efficiency gains).'
            },
            {
              question: 'How would you reduce manufacturing defects by 50%?',
              category: 'case',
              sampleAnswer: 'Apply root cause analysis (5 Whys, fishbone diagram), identify top defect categories, implement corrective actions (process controls, training, equipment), establish measurement system, continuous improvement cycle.'
            },
            {
              question: 'What CAD software are you proficient in? Show us a project.',
              category: 'technical',
              sampleAnswer: 'Discuss your experience level honestly. Walk through a project showing your design thinking, constraints considered, iterations made. Explain technical choices and trade-offs.'
            },
            {
              question: 'How do you ensure safety compliance in engineering projects?',
              category: 'situational',
              sampleAnswer: 'Follow standards (OSHA, local regulations), conduct risk assessments, implement safety reviews at design stages, ensure proper documentation and training, continuous safety audits.'
            },
            {
              question: 'Explain [fundamental concept] to a non-technical person',
              category: 'technical',
              sampleAnswer: 'Shows communication skills. Use analogies, avoid jargon, check understanding. This is important for working with cross-functional teams and stakeholders.'
            }
          ]
        }
      },
      {
        id: 'engineering-case',
        title: 'Case Studies',
        description: 'Work through engineering scenarios',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case: Production Line Optimization',
              items: [
                'Problem: Production line bottleneck limiting capacity',
                'Analysis: Time studies, process mapping, constraint identification',
                'Solutions: Line balancing, automation, parallel processing',
                'Implementation: Cost-benefit analysis, phased rollout',
                'Results: Capacity increase, cost reduction, quality improvement'
              ]
            },
            {
              title: 'Case: Product Failure Investigation',
              items: [
                'Scenario: Product returns due to premature failure',
                'Investigation: Failure mode analysis, testing, root cause',
                'Findings: Material defect, design margin, manufacturing variation',
                'Corrective actions: Design change, supplier qualification, inspection',
                'Prevention: FMEA update, design guidelines, quality controls'
              ]
            },
            {
              title: 'Case: New Product Development',
              items: [
                'Brief: Develop new product with specific requirements',
                'Process: Concept generation, selection, detailed design',
                'Considerations: DFM, cost, timeline, regulatory',
                'Prototyping: Iterations, testing, validation',
                'Launch: Production ramp, quality assurance, documentation'
              ]
            }
          ]
        }
      },
      {
        id: 'engineering-skills',
        title: 'Technical Skills',
        description: 'Build skills for engineering roles',
        duration: '45 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Technical Fundamentals',
              items: [
                'Engineering principles: Mechanics, thermodynamics, materials',
                'Mathematics: Calculus, statistics, numerical methods',
                'Physics: Applied to your engineering discipline',
                'Drawing interpretation: GD&T, engineering drawings',
                'Standards and codes: ISO, industry-specific standards'
              ]
            },
            {
              title: 'Software & Tools',
              items: [
                'CAD: SolidWorks, AutoCAD, CATIA, NX',
                'Simulation: FEA, CFD, process simulation',
                'Data analysis: Excel, MATLAB, Python',
                'Project management: MS Project, Primavera',
                'PLM systems: Product lifecycle management'
              ]
            },
            {
              title: 'Professional Skills',
              items: [
                'Project management: Planning, execution, control',
                'Quality methods: Six Sigma, SPC, FMEA',
                'Lean manufacturing: Value stream, waste reduction',
                'Safety: Risk assessment, safety management systems',
                'Technical writing: Reports, specifications, procedures'
              ]
            }
          ],
          resources: [
            { title: 'SolidWorks Certification', type: 'course' },
            { title: 'Six Sigma Green Belt', type: 'course' },
            { title: 'Project Management Fundamentals', type: 'course' }
          ]
        }
      }
    ]
  },
  {
    slug: 'startup',
    name: 'Startup',
    icon: 'rocket',
    description: 'Early-stage startups and scale-ups. Learn to thrive in fast-paced environments with high ownership and rapid learning.',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    resourceCount: 30,
    relatedCompanies: ['stripe', 'grab', 'shopee'],
    skills: ['Adaptability', 'Ownership', 'Rapid Learning', 'Cross-functional Work', 'Problem Solving'],
    salaryRange: '$3,000 - $6,000/month',
    demandLevel: 'High',
    modules: [
      {
        id: 'startup-overview',
        title: 'Industry Overview',
        description: 'Understand the startup ecosystem',
        duration: '30 mins',
        type: 'overview',
        content: {
          sections: [
            {
              title: 'Singapore Startup Ecosystem',
              items: [
                'Over 4,000 tech startups and 400+ VC funds',
                'Government support: Startup SG, EDB, SEEDS',
                'Strong presence of accelerators: Y Combinator, Antler, Entrepreneur First',
                'Unicorns born here: Grab, Sea, Lazada (acquired)',
                'Hub for SEA expansion for global startups'
              ]
            },
            {
              title: 'Startup Stages',
              items: [
                'Pre-seed/Seed: MVP, finding product-market fit, <20 people',
                'Series A: Scaling proven model, building teams, 20-100 people',
                'Series B+: Rapid scaling, expanding markets, 100+ people',
                'Late stage/Pre-IPO: Mature operations, profitability focus',
                'Each stage has different opportunities and risks'
              ]
            },
            {
              title: 'Why Join a Startup?',
              items: [
                'High learning curve and broad exposure',
                'Direct impact on company direction',
                'Equity upside potential (with risks)',
                'Work with passionate, driven people',
                'Fast career progression for strong performers'
              ]
            }
          ]
        }
      },
      {
        id: 'startup-roles',
        title: 'Common Roles',
        description: 'Explore startup roles and expectations',
        duration: '45 mins',
        type: 'roles',
        content: {
          sections: [
            {
              title: 'Generalist / Business Operations',
              items: [
                'Wear multiple hats across operations, strategy, analytics',
                'Skills: Problem-solving, Excel, communication, adaptability',
                'Daily work: Varies widely - operations, analysis, special projects',
                'Great for learning but requires comfort with ambiguity'
              ]
            },
            {
              title: 'Growth / Marketing',
              items: [
                'Drive user acquisition and revenue growth',
                'Skills: Digital marketing, analytics, experimentation',
                'Daily work: Running campaigns, analyzing data, testing hypotheses',
                'High ownership and direct impact on key metrics'
              ]
            },
            {
              title: 'Product',
              items: [
                'Define and build the product',
                'Skills: User research, prioritization, technical understanding',
                'Daily work: User interviews, roadmap, working with engineering',
                'Closer to engineering than in big companies'
              ]
            },
            {
              title: 'Software Engineer',
              items: [
                'Build and maintain the product',
                'Skills: Full-stack development, shipping quickly, pragmatism',
                'Daily work: Coding, deploying, fixing bugs, wearing many hats',
                'More autonomy but less specialization than big tech'
              ]
            }
          ]
        }
      },
      {
        id: 'startup-questions',
        title: 'Interview Questions',
        description: 'Practice startup interview questions',
        duration: '60 mins',
        type: 'questions',
        content: {
          sections: [
            {
              title: 'Startup Interview Tips',
              items: [
                'Show genuine interest in the company\'s mission and product',
                'Demonstrate ownership mentality and initiative',
                'Be comfortable discussing failure and learning',
                'Show you can work with ambiguity',
                'Research the founders and their background'
              ]
            }
          ],
          questions: [
            {
              question: 'Why do you want to join a startup instead of a big company?',
              category: 'behavioral',
              sampleAnswer: 'Be genuine - learning, ownership, impact, culture. Show you understand the trade-offs: less structure, more risk, potentially lower pay. Connect to your career goals.'
            },
            {
              question: 'Tell me about a time you built something from scratch',
              category: 'behavioral',
              sampleAnswer: 'Show initiative, resourcefulness, and ability to work with limited resources. Doesn\'t have to be work - side projects, student organizations count. Focus on your process and results.'
            },
            {
              question: 'How would you prioritize these three competing priorities?',
              category: 'situational',
              sampleAnswer: 'Show structured thinking: clarify impact and urgency of each, consider dependencies, communicate trade-offs. Demonstrate you can make decisions with incomplete information.'
            },
            {
              question: 'What would you do in your first 30 days here?',
              category: 'situational',
              sampleAnswer: 'Show initiative: learn the business, meet stakeholders, identify quick wins, understand metrics. Balance learning with delivering value quickly.'
            },
            {
              question: 'Our user retention is dropping. How would you diagnose this?',
              category: 'case',
              sampleAnswer: 'Segment users, analyze cohorts, look at funnel drop-offs, conduct user interviews. Form hypotheses, test them with data. Show analytical thinking and customer empathy.'
            }
          ]
        }
      },
      {
        id: 'startup-case',
        title: 'Case Studies',
        description: 'Learn from startup scenarios',
        duration: '45 mins',
        type: 'case-study',
        content: {
          sections: [
            {
              title: 'Case: Finding Product-Market Fit',
              items: [
                'Scenario: B2B SaaS with low customer retention',
                'Diagnosis: Customer interviews, usage data analysis',
                'Finding: Core feature valuable, but missing key workflow integration',
                'Action: Pivot feature set, narrow ICP, improve onboarding',
                'Metrics: Retention improved from 60% to 85%'
              ]
            },
            {
              title: 'Case: Scaling Operations',
              items: [
                'Scenario: Food delivery startup scaling from 100 to 1000 orders/day',
                'Challenges: Driver supply, restaurant quality, customer support',
                'Solutions: Dynamic pricing, restaurant scoring, automated support',
                'Implementation: Phased rollout, constant iteration',
                'Learning: Systems thinking and automation are key'
              ]
            },
            {
              title: 'Case: Fundraising Preparation',
              items: [
                'Objective: Raise Series A for fintech startup',
                'Preparation: Metrics deck, financial model, narrative',
                'Key metrics: GMV, take rate, unit economics, retention',
                'Process: Warm intros, VC meetings, term sheet negotiation',
                'Outcome: Raised $10M at $50M valuation'
              ]
            }
          ]
        }
      },
      {
        id: 'startup-skills',
        title: 'Technical Skills',
        description: 'Build skills for startup roles',
        duration: '45 mins',
        type: 'skills',
        content: {
          sections: [
            {
              title: 'Analytical Skills',
              items: [
                'Excel/Sheets: Pivot tables, modeling, charts',
                'SQL: Query databases, analyze user data',
                'Data visualization: Clear, actionable dashboards',
                'Metrics: Understand SaaS, marketplace, consumer metrics',
                'A/B testing: Experiment design and interpretation'
              ]
            },
            {
              title: 'Execution Skills',
              items: [
                'Project management: Get things done without formal process',
                'Communication: Clear writing, presentations, stakeholder management',
                'Prioritization: Focus on high-impact work',
                'Speed: Ship fast, iterate, don\'t over-engineer',
                'Resourcefulness: Find solutions with limited resources'
              ]
            },
            {
              title: 'Startup-Specific Knowledge',
              items: [
                'Fundraising: VC landscape, term sheets, dilution',
                'Unit economics: CAC, LTV, payback period, margins',
                'Growth frameworks: AARRR funnel, north star metrics',
                'Product development: MVP, iteration, user feedback',
                'Legal basics: Equity, vesting, IP, employment'
              ]
            }
          ],
          resources: [
            { title: 'Startup School by Y Combinator', type: 'course' },
            { title: 'Zero to One by Peter Thiel', type: 'book' },
            { title: 'The Lean Startup', type: 'book' }
          ]
        }
      }
    ]
  }
];

export function getTrackBySlug(slug: string): IndustryTrack | undefined {
  return INDUSTRY_TRACKS.find(track => track.slug === slug);
}

export function getAllTracks(): IndustryTrack[] {
  return INDUSTRY_TRACKS;
}

export function getTracksByCompany(companySlug: string): IndustryTrack[] {
  return INDUSTRY_TRACKS.filter(track =>
    track.relatedCompanies.includes(companySlug)
  );
}
