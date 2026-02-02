// Mock data for internship.sg

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website: string;
  careers_url: string;
  description: string;
  industry: string;
  size: string;
  location: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  location: string;
  job_type: 'internship';
  work_arrangement: 'onsite' | 'remote' | 'hybrid';
  salary_min: number;
  salary_max: number;
  duration: string;
  application_url: string;
  status: 'active';
  posted_at: string;
  company: Company;
}

// Mock Companies
export const companies: Company[] = [
  {
    id: 'comp-001',
    name: 'Google Singapore',
    slug: 'google-singapore',
    logo_url: '/logos/google.png',
    website: 'https://www.google.com.sg',
    careers_url: 'https://careers.google.com',
    description: 'Google is a multinational technology company specializing in Internet-related services and products. Our Singapore office serves as a key hub for Asia-Pacific operations.',
    industry: 'Technology',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-002',
    name: 'Shopee',
    slug: 'shopee',
    logo_url: '/logos/shopee.png',
    website: 'https://www.shopee.sg',
    careers_url: 'https://careers.shopee.sg',
    description: 'Shopee is the leading e-commerce platform in Southeast Asia and Taiwan. We connect buyers and sellers through our mobile-centric marketplace.',
    industry: 'E-commerce',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-003',
    name: 'Grab',
    slug: 'grab',
    logo_url: '/logos/grab.png',
    website: 'https://www.grab.com',
    careers_url: 'https://grab.careers',
    description: 'Grab is Southeast Asia\'s leading superapp, offering everyday services like deliveries, mobility, financial services, and more.',
    industry: 'Technology',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-004',
    name: 'DBS Bank',
    slug: 'dbs-bank',
    logo_url: '/logos/dbs.png',
    website: 'https://www.dbs.com.sg',
    careers_url: 'https://www.dbs.com/careers',
    description: 'DBS is a leading financial services group in Asia with a presence in 18 markets. Headquartered in Singapore, DBS is a market leader in digital banking.',
    industry: 'Banking & Finance',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-005',
    name: 'TikTok Singapore',
    slug: 'tiktok-singapore',
    logo_url: '/logos/tiktok.png',
    website: 'https://www.tiktok.com',
    careers_url: 'https://careers.tiktok.com',
    description: 'TikTok is the leading destination for short-form mobile video. Our mission is to inspire creativity and bring joy.',
    industry: 'Technology',
    size: '500-1000',
    location: 'Singapore'
  },
  {
    id: 'comp-006',
    name: 'GovTech Singapore',
    slug: 'govtech-singapore',
    logo_url: '/logos/govtech.png',
    website: 'https://www.tech.gov.sg',
    careers_url: 'https://www.tech.gov.sg/careers',
    description: 'GovTech is the lead agency driving Singapore\'s Smart Nation initiative. We use technology to improve the lives of citizens.',
    industry: 'Government & Public Sector',
    size: '500-1000',
    location: 'Singapore'
  },
  {
    id: 'comp-007',
    name: 'Stripe',
    slug: 'stripe',
    logo_url: '/logos/stripe.png',
    website: 'https://stripe.com',
    careers_url: 'https://stripe.com/jobs',
    description: 'Stripe is a financial infrastructure platform for the internet. Millions of businesses use Stripe to accept payments and manage their businesses online.',
    industry: 'Fintech',
    size: '100-500',
    location: 'Singapore'
  },
  {
    id: 'comp-008',
    name: 'Carousell',
    slug: 'carousell',
    logo_url: '/logos/carousell.png',
    website: 'https://www.carousell.sg',
    careers_url: 'https://careers.carousell.com',
    description: 'Carousell is one of the world\'s largest and fastest growing classifieds marketplace. We make selling as easy as taking a photo.',
    industry: 'E-commerce',
    size: '500-1000',
    location: 'Singapore'
  },
  {
    id: 'comp-009',
    name: 'Sea Limited',
    slug: 'sea-limited',
    logo_url: '/logos/sea.png',
    website: 'https://www.sea.com',
    careers_url: 'https://www.sea.com/careers',
    description: 'Sea Limited is a leading global consumer internet company founded in Singapore, with a mission to better lives through technology.',
    industry: 'Technology',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-010',
    name: 'Lazada',
    slug: 'lazada',
    logo_url: '/logos/lazada.png',
    website: 'https://www.lazada.sg',
    careers_url: 'https://www.lazada.com/en/careers',
    description: 'Lazada is Southeast Asia\'s leading eCommerce platform, accelerating progress in Indonesia, Malaysia, the Philippines, Singapore, Thailand and Vietnam.',
    industry: 'E-commerce',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-011',
    name: 'ByteDance',
    slug: 'bytedance',
    logo_url: '/logos/bytedance.png',
    website: 'https://www.bytedance.com',
    careers_url: 'https://jobs.bytedance.com',
    description: 'ByteDance is a technology company operating a range of content platforms that inform, educate, entertain and inspire people across languages and cultures.',
    industry: 'Technology',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-012',
    name: 'OCBC Bank',
    slug: 'ocbc-bank',
    logo_url: '/logos/ocbc.png',
    website: 'https://www.ocbc.com',
    careers_url: 'https://www.ocbc.com/group/careers',
    description: 'OCBC Bank is the longest established Singapore bank, formed in 1932. We are one of the world\'s most highly-rated banks.',
    industry: 'Banking & Finance',
    size: '1000+',
    location: 'Singapore'
  },
  {
    id: 'comp-013',
    name: 'Razer',
    slug: 'razer',
    logo_url: '/logos/razer.png',
    website: 'https://www.razer.com',
    careers_url: 'https://www.razer.com/careers',
    description: 'Razer is the world\'s leading lifestyle brand for gamers. We design and build the world\'s largest gamer-focused ecosystem of hardware, software and services.',
    industry: 'Technology',
    size: '500-1000',
    location: 'Singapore'
  },
  {
    id: 'comp-014',
    name: 'Foodpanda',
    slug: 'foodpanda',
    logo_url: '/logos/foodpanda.png',
    website: 'https://www.foodpanda.sg',
    careers_url: 'https://careers.foodpanda.com',
    description: 'foodpanda is the leading food and grocery delivery platform in Asia, connecting customers with their favourite restaurants and shops.',
    industry: 'Technology',
    size: '500-1000',
    location: 'Singapore'
  },
  {
    id: 'comp-015',
    name: 'Binance',
    slug: 'binance',
    logo_url: '/logos/binance.png',
    website: 'https://www.binance.com',
    careers_url: 'https://www.binance.com/en/careers',
    description: 'Binance is the world\'s leading blockchain ecosystem and cryptocurrency infrastructure provider with a financial product suite.',
    industry: 'Fintech',
    size: '500-1000',
    location: 'Singapore'
  }
];

// Mock Jobs
export const jobs: Job[] = [
  {
    id: 'job-001',
    company_id: 'comp-001',
    title: 'Software Engineering Intern',
    slug: 'google-software-engineering-intern',
    description: 'Join Google\'s engineering team as a Software Engineering Intern. You will work on real projects that impact billions of users worldwide. Collaborate with experienced engineers to build scalable solutions.',
    requirements: [
      'Currently pursuing a degree in Computer Science or related field',
      'Strong programming skills in Python, Java, or C++',
      'Understanding of data structures and algorithms',
      'Excellent problem-solving abilities',
      'Good communication skills'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 5000,
    salary_max: 7000,
    duration: '3-6 months',
    application_url: 'https://careers.google.com/jobs/results/',
    status: 'active',
    posted_at: '2026-01-15T08:00:00Z',
    company: companies[0]
  },
  {
    id: 'job-002',
    company_id: 'comp-001',
    title: 'Data Science Intern',
    slug: 'google-data-science-intern',
    description: 'Work with Google\'s data science team to analyze large datasets and build machine learning models. You will help drive data-informed decisions across various products.',
    requirements: [
      'Pursuing degree in Statistics, Mathematics, Computer Science, or related field',
      'Experience with Python and SQL',
      'Knowledge of machine learning concepts',
      'Familiarity with data visualization tools',
      'Strong analytical thinking'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 5500,
    salary_max: 7500,
    duration: '3-6 months',
    application_url: 'https://careers.google.com/jobs/results/',
    status: 'active',
    posted_at: '2026-01-20T08:00:00Z',
    company: companies[0]
  },
  {
    id: 'job-003',
    company_id: 'comp-002',
    title: 'Frontend Engineering Intern',
    slug: 'shopee-frontend-engineering-intern',
    description: 'Join Shopee\'s frontend team to build user interfaces that serve millions of users daily. Work with React and modern web technologies.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Experience with HTML, CSS, JavaScript',
      'Familiarity with React or Vue.js',
      'Understanding of responsive design',
      'Attention to detail and user experience'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 3500,
    salary_max: 5000,
    duration: '3-6 months',
    application_url: 'https://careers.shopee.sg',
    status: 'active',
    posted_at: '2026-01-18T08:00:00Z',
    company: companies[1]
  },
  {
    id: 'job-004',
    company_id: 'comp-002',
    title: 'Product Management Intern',
    slug: 'shopee-product-management-intern',
    description: 'Work with Shopee\'s product team to define and launch new features. Conduct user research, analyze data, and collaborate with engineering teams.',
    requirements: [
      'Pursuing degree in Business, Computer Science, or related field',
      'Strong analytical and problem-solving skills',
      'Excellent communication abilities',
      'Interest in e-commerce and technology',
      'Ability to work in a fast-paced environment'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://careers.shopee.sg',
    status: 'active',
    posted_at: '2026-01-22T08:00:00Z',
    company: companies[1]
  },
  {
    id: 'job-005',
    company_id: 'comp-003',
    title: 'Backend Engineering Intern',
    slug: 'grab-backend-engineering-intern',
    description: 'Join Grab\'s backend engineering team to build scalable microservices. Work on systems that power rides, deliveries, and payments across Southeast Asia.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Strong programming skills in Go, Java, or Python',
      'Understanding of distributed systems',
      'Knowledge of databases and APIs',
      'Problem-solving mindset'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 4000,
    salary_max: 5500,
    duration: '3-6 months',
    application_url: 'https://grab.careers',
    status: 'active',
    posted_at: '2026-01-25T08:00:00Z',
    company: companies[2]
  },
  {
    id: 'job-006',
    company_id: 'comp-003',
    title: 'Machine Learning Intern',
    slug: 'grab-machine-learning-intern',
    description: 'Work on ML models that improve Grab\'s core services including dynamic pricing, ETA predictions, and fraud detection.',
    requirements: [
      'Pursuing degree in Computer Science, Statistics, or related field',
      'Experience with Python and ML frameworks (TensorFlow, PyTorch)',
      'Strong foundation in mathematics and statistics',
      'Understanding of ML algorithms',
      'Research experience is a plus'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 4500,
    salary_max: 6000,
    duration: '3-6 months',
    application_url: 'https://grab.careers',
    status: 'active',
    posted_at: '2026-01-26T08:00:00Z',
    company: companies[2]
  },
  {
    id: 'job-007',
    company_id: 'comp-004',
    title: 'Technology Analyst Intern',
    slug: 'dbs-technology-analyst-intern',
    description: 'Join DBS\'s technology team to work on digital banking solutions. Contribute to projects that transform how customers interact with banking services.',
    requirements: [
      'Pursuing degree in Computer Science, Information Systems, or related field',
      'Programming experience in Java or Python',
      'Interest in financial technology',
      'Good communication skills',
      'Team player with initiative'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://www.dbs.com/careers',
    status: 'active',
    posted_at: '2026-01-10T08:00:00Z',
    company: companies[3]
  },
  {
    id: 'job-008',
    company_id: 'comp-004',
    title: 'Data Analytics Intern',
    slug: 'dbs-data-analytics-intern',
    description: 'Work with DBS\'s analytics team to derive insights from banking data. Help build dashboards and reports that drive business decisions.',
    requirements: [
      'Pursuing degree in Statistics, Mathematics, or related field',
      'Experience with SQL and Python',
      'Knowledge of data visualization tools (Tableau, Power BI)',
      'Strong analytical skills',
      'Attention to detail'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://www.dbs.com/careers',
    status: 'active',
    posted_at: '2026-01-12T08:00:00Z',
    company: companies[3]
  },
  {
    id: 'job-009',
    company_id: 'comp-005',
    title: 'Software Engineering Intern',
    slug: 'tiktok-software-engineering-intern',
    description: 'Build features for TikTok\'s platform that entertain and connect millions of users. Work on challenging technical problems at scale.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Strong coding skills in one or more programming languages',
      'Understanding of algorithms and data structures',
      'Passion for social media and content creation',
      'Creative problem-solving abilities'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 4500,
    salary_max: 6500,
    duration: '3-6 months',
    application_url: 'https://careers.tiktok.com',
    status: 'active',
    posted_at: '2026-01-28T08:00:00Z',
    company: companies[4]
  },
  {
    id: 'job-010',
    company_id: 'comp-005',
    title: 'Content Operations Intern',
    slug: 'tiktok-content-operations-intern',
    description: 'Support TikTok\'s content operations team in managing creator partnerships and content quality initiatives.',
    requirements: [
      'Pursuing degree in Communications, Marketing, or related field',
      'Understanding of social media trends',
      'Strong communication skills',
      'Detail-oriented and organized',
      'Interest in content creation and digital media'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 3000,
    salary_max: 4000,
    duration: '3-6 months',
    application_url: 'https://careers.tiktok.com',
    status: 'active',
    posted_at: '2026-01-29T08:00:00Z',
    company: companies[4]
  },
  {
    id: 'job-011',
    company_id: 'comp-006',
    title: 'Software Engineering Intern',
    slug: 'govtech-software-engineering-intern',
    description: 'Contribute to Singapore\'s Smart Nation initiative by building digital services that improve citizens\' lives.',
    requirements: [
      'Singapore Citizen or Permanent Resident',
      'Pursuing degree in Computer Science or related field',
      'Experience with modern web technologies',
      'Interest in public sector technology',
      'Strong sense of civic responsibility'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 2800,
    salary_max: 3800,
    duration: '3-6 months',
    application_url: 'https://www.tech.gov.sg/careers',
    status: 'active',
    posted_at: '2026-01-05T08:00:00Z',
    company: companies[5]
  },
  {
    id: 'job-012',
    company_id: 'comp-006',
    title: 'UX Design Intern',
    slug: 'govtech-ux-design-intern',
    description: 'Design user experiences for government digital services. Conduct user research and create intuitive interfaces for diverse user groups.',
    requirements: [
      'Singapore Citizen or Permanent Resident',
      'Pursuing degree in Design, HCI, or related field',
      'Proficiency in design tools (Figma, Sketch)',
      'Strong portfolio demonstrating UX work',
      'Empathy for users and attention to accessibility'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 2800,
    salary_max: 3800,
    duration: '3-6 months',
    application_url: 'https://www.tech.gov.sg/careers',
    status: 'active',
    posted_at: '2026-01-08T08:00:00Z',
    company: companies[5]
  },
  {
    id: 'job-013',
    company_id: 'comp-007',
    title: 'Software Engineering Intern',
    slug: 'stripe-software-engineering-intern',
    description: 'Build the economic infrastructure for the internet. Work on Stripe\'s APIs and systems that power millions of businesses.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Strong programming skills in Ruby, Python, or Go',
      'Understanding of web technologies and APIs',
      'Interest in payments and financial technology',
      'Excellent problem-solving skills'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 5000,
    salary_max: 7000,
    duration: '3-6 months',
    application_url: 'https://stripe.com/jobs',
    status: 'active',
    posted_at: '2026-01-30T08:00:00Z',
    company: companies[6]
  },
  {
    id: 'job-014',
    company_id: 'comp-008',
    title: 'Mobile Engineering Intern',
    slug: 'carousell-mobile-engineering-intern',
    description: 'Build features for Carousell\'s mobile apps used by millions of users to buy and sell items.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Experience with iOS (Swift) or Android (Kotlin)',
      'Understanding of mobile app architecture',
      'Interest in marketplace and social features',
      'Self-motivated and proactive'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://careers.carousell.com',
    status: 'active',
    posted_at: '2026-01-17T08:00:00Z',
    company: companies[7]
  },
  {
    id: 'job-015',
    company_id: 'comp-008',
    title: 'Marketing Intern',
    slug: 'carousell-marketing-intern',
    description: 'Support Carousell\'s marketing team in campaigns and initiatives. Help grow user engagement and brand awareness.',
    requirements: [
      'Pursuing degree in Marketing, Communications, or related field',
      'Strong writing and communication skills',
      'Understanding of digital marketing channels',
      'Creative thinking and attention to detail',
      'Experience with social media marketing is a plus'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 2500,
    salary_max: 3500,
    duration: '3-6 months',
    application_url: 'https://careers.carousell.com',
    status: 'active',
    posted_at: '2026-01-19T08:00:00Z',
    company: companies[7]
  },
  {
    id: 'job-016',
    company_id: 'comp-009',
    title: 'Software Engineering Intern',
    slug: 'sea-software-engineering-intern',
    description: 'Join Sea\'s engineering team to build products that serve millions of users across gaming, e-commerce, and fintech.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Strong coding skills in C++, Java, or Python',
      'Understanding of software development principles',
      'Good analytical and problem-solving skills',
      'Team player with good communication'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 4000,
    salary_max: 5500,
    duration: '3-6 months',
    application_url: 'https://www.sea.com/careers',
    status: 'active',
    posted_at: '2026-01-14T08:00:00Z',
    company: companies[8]
  },
  {
    id: 'job-017',
    company_id: 'comp-010',
    title: 'Business Analytics Intern',
    slug: 'lazada-business-analytics-intern',
    description: 'Work with Lazada\'s analytics team to generate insights that drive business growth across Southeast Asia.',
    requirements: [
      'Pursuing degree in Business, Statistics, or related field',
      'Experience with SQL and Excel',
      'Strong analytical and quantitative skills',
      'Good presentation and communication abilities',
      'Interest in e-commerce industry'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://www.lazada.com/en/careers',
    status: 'active',
    posted_at: '2026-01-21T08:00:00Z',
    company: companies[9]
  },
  {
    id: 'job-018',
    company_id: 'comp-011',
    title: 'Research Intern - AI',
    slug: 'bytedance-research-intern-ai',
    description: 'Conduct research in AI and machine learning at ByteDance\'s research lab. Publish papers and develop cutting-edge algorithms.',
    requirements: [
      'Pursuing PhD or Masters in Computer Science, AI, or related field',
      'Strong publication record or research experience',
      'Expertise in deep learning frameworks',
      'Excellent mathematical foundation',
      'Self-driven with research initiative'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 6000,
    salary_max: 8000,
    duration: '3-6 months',
    application_url: 'https://jobs.bytedance.com',
    status: 'active',
    posted_at: '2026-01-27T08:00:00Z',
    company: companies[10]
  },
  {
    id: 'job-019',
    company_id: 'comp-012',
    title: 'Digital Banking Intern',
    slug: 'ocbc-digital-banking-intern',
    description: 'Work on OCBC\'s digital banking initiatives and help transform traditional banking services.',
    requirements: [
      'Pursuing degree in Business, Finance, or Technology',
      'Interest in digital transformation',
      'Good analytical skills',
      'Strong communication abilities',
      'Customer-centric mindset'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 3000,
    salary_max: 4000,
    duration: '3-6 months',
    application_url: 'https://www.ocbc.com/group/careers',
    status: 'active',
    posted_at: '2026-01-11T08:00:00Z',
    company: companies[11]
  },
  {
    id: 'job-020',
    company_id: 'comp-013',
    title: 'Hardware Engineering Intern',
    slug: 'razer-hardware-engineering-intern',
    description: 'Design and test gaming peripherals at Razer. Work on cutting-edge hardware for the gaming community.',
    requirements: [
      'Pursuing degree in Electrical Engineering or related field',
      'Experience with hardware design and testing',
      'Knowledge of CAD tools',
      'Passion for gaming and esports',
      'Attention to detail and quality'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://www.razer.com/careers',
    status: 'active',
    posted_at: '2026-01-23T08:00:00Z',
    company: companies[12]
  },
  {
    id: 'job-021',
    company_id: 'comp-013',
    title: 'Software Engineering Intern',
    slug: 'razer-software-engineering-intern',
    description: 'Build software for Razer\'s gaming ecosystem including Synapse and Cortex platforms.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Experience with C++ or C#',
      'Interest in gaming software development',
      'Understanding of system programming',
      'Passionate gamer is a plus'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 4500,
    duration: '3-6 months',
    application_url: 'https://www.razer.com/careers',
    status: 'active',
    posted_at: '2026-01-24T08:00:00Z',
    company: companies[12]
  },
  {
    id: 'job-022',
    company_id: 'comp-014',
    title: 'Operations Intern',
    slug: 'foodpanda-operations-intern',
    description: 'Support foodpanda\'s operations team in optimizing delivery logistics and vendor management.',
    requirements: [
      'Pursuing degree in Business, Operations, or related field',
      'Strong analytical and problem-solving skills',
      'Proficiency in Excel and data analysis',
      'Good communication and interpersonal skills',
      'Ability to work in fast-paced environment'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 2800,
    salary_max: 3800,
    duration: '3-6 months',
    application_url: 'https://careers.foodpanda.com',
    status: 'active',
    posted_at: '2026-01-16T08:00:00Z',
    company: companies[13]
  },
  {
    id: 'job-023',
    company_id: 'comp-015',
    title: 'Blockchain Engineering Intern',
    slug: 'binance-blockchain-engineering-intern',
    description: 'Work on blockchain infrastructure and smart contracts at Binance. Build the future of decentralized finance.',
    requirements: [
      'Pursuing degree in Computer Science or related field',
      'Understanding of blockchain technology',
      'Experience with Solidity or Rust is a plus',
      'Strong programming fundamentals',
      'Interest in cryptocurrency and Web3'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'remote',
    salary_min: 4500,
    salary_max: 6500,
    duration: '3-6 months',
    application_url: 'https://www.binance.com/en/careers',
    status: 'active',
    posted_at: '2026-01-31T08:00:00Z',
    company: companies[14]
  },
  {
    id: 'job-024',
    company_id: 'comp-015',
    title: 'Security Engineering Intern',
    slug: 'binance-security-engineering-intern',
    description: 'Help secure Binance\'s platform and protect user assets. Work on security systems and threat detection.',
    requirements: [
      'Pursuing degree in Computer Science, Cybersecurity, or related field',
      'Understanding of security principles and cryptography',
      'Experience with penetration testing is a plus',
      'Strong analytical and investigative skills',
      'Attention to detail and security mindset'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 4500,
    salary_max: 6500,
    duration: '3-6 months',
    application_url: 'https://www.binance.com/en/careers',
    status: 'active',
    posted_at: '2026-02-01T08:00:00Z',
    company: companies[14]
  },
  {
    id: 'job-025',
    company_id: 'comp-003',
    title: 'Product Design Intern',
    slug: 'grab-product-design-intern',
    description: 'Design user experiences for Grab\'s superapp. Create intuitive interfaces for rides, food delivery, and payments.',
    requirements: [
      'Pursuing degree in Design, HCI, or related field',
      'Strong portfolio demonstrating product design work',
      'Proficiency in Figma or Sketch',
      'Understanding of design systems',
      'User-centered design mindset'
    ],
    location: 'Singapore',
    job_type: 'internship',
    work_arrangement: 'hybrid',
    salary_min: 3500,
    salary_max: 5000,
    duration: '3-6 months',
    application_url: 'https://grab.careers',
    status: 'active',
    posted_at: '2026-02-01T08:00:00Z',
    company: companies[2]
  }
];

// Helper functions

/**
 * Get jobs with optional filtering
 */
export function getJobs(search?: string, industry?: string): Job[] {
  let filteredJobs = [...jobs];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.company.name.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
    );
  }

  if (industry) {
    filteredJobs = filteredJobs.filter(
      (job) => job.company.industry.toLowerCase() === industry.toLowerCase()
    );
  }

  return filteredJobs;
}

/**
 * Get all companies
 */
export function getCompanies(): Company[] {
  return companies;
}

/**
 * Get a single job by slug
 */
export function getJobBySlug(slug: string): Job | undefined {
  return jobs.find((job) => job.slug === slug);
}

/**
 * Get a single company by slug
 */
export function getCompanyBySlug(slug: string): Company | undefined {
  return companies.find((company) => company.slug === slug);
}

/**
 * Get statistics
 */
export function getStats(): { jobs: number; companies: number } {
  return {
    jobs: jobs.length,
    companies: companies.length
  };
}

/**
 * Get unique industries
 */
export function getIndustries(): string[] {
  const industries = new Set(companies.map((company) => company.industry));
  return Array.from(industries).sort();
}

/**
 * Get jobs by company ID
 */
export function getJobsByCompanyId(companyId: string): Job[] {
  return jobs.filter((job) => job.company_id === companyId);
}

/**
 * Get job count by company
 */
export function getJobCountByCompany(): Record<string, number> {
  const counts: Record<string, number> = {};
  jobs.forEach((job) => {
    counts[job.company_id] = (counts[job.company_id] || 0) + 1;
  });
  return counts;
}

/**
 * Filter companies by search and industry
 */
export function filterCompanies(search?: string, industry?: string): Company[] {
  let filtered = [...companies];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (company) =>
        company.name.toLowerCase().includes(searchLower) ||
        company.industry.toLowerCase().includes(searchLower) ||
        company.description.toLowerCase().includes(searchLower)
    );
  }

  if (industry) {
    filtered = filtered.filter(
      (company) => company.industry.toLowerCase() === industry.toLowerCase()
    );
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}
