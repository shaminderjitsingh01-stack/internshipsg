export type QuestionCategory = "Behavioral" | "Technical" | "Case Study" | "Situational";
export type QuestionDifficulty = "Easy" | "Medium" | "Hard";
export type Industry = "General" | "Technology" | "Finance" | "Consulting" | "Marketing" | "Healthcare" | "Engineering" | "Startup";

export interface InterviewQuestion {
  id: number;
  question: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  industry: Industry;
  company?: string;
  tips: string[];
}

export const interviewQuestions: InterviewQuestion[] = [
  // BEHAVIORAL QUESTIONS (20 questions)
  {
    id: 1,
    question: "Tell me about yourself.",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Keep it to 2 minutes - focus on education, relevant experience, and career goals",
      "Use the Present-Past-Future formula: where you are now, how you got here, where you're going",
      "Tailor your answer to the specific role and company",
      "End with why you're excited about this opportunity"
    ]
  },
  {
    id: 2,
    question: "Why do you want to work here?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Research the company's mission, values, and recent news before the interview",
      "Connect your career goals to what the company offers",
      "Mention specific projects, products, or initiatives that excite you",
      "Show genuine enthusiasm without being overly flattering"
    ]
  },
  {
    id: 3,
    question: "Describe a challenge you overcame.",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Use the STAR method: Situation, Task, Action, Result",
      "Choose a professional or academic challenge, not personal drama",
      "Focus on what YOU did specifically, not the team",
      "Quantify the positive outcome if possible"
    ]
  },
  {
    id: 4,
    question: "Where do you see yourself in 5 years?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show ambition but be realistic - avoid saying 'your job'",
      "Align your goals with a logical career path at the company",
      "Express desire for growth and learning",
      "Focus on skills you want to develop, not just titles"
    ]
  },
  {
    id: 5,
    question: "What are your strengths?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Choose 2-3 strengths relevant to the job description",
      "Back up each strength with a specific example",
      "Avoid cliches like 'perfectionist' or 'workaholic'",
      "Be confident but not arrogant"
    ]
  },
  {
    id: 6,
    question: "What are your weaknesses?",
    category: "Behavioral",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Choose a real weakness, not a disguised strength",
      "Explain what you're doing to improve",
      "Don't mention weaknesses critical to the job",
      "Show self-awareness and growth mindset"
    ]
  },
  {
    id: 7,
    question: "Tell me about a time you worked in a team.",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Highlight your specific role and contributions",
      "Mention how you handled different opinions or conflicts",
      "Discuss the team's success and what made it work",
      "Show you can collaborate while still taking ownership"
    ]
  },
  {
    id: 8,
    question: "Describe a time you showed leadership.",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Leadership doesn't require a title - show initiative and influence",
      "Focus on how you motivated or guided others",
      "Describe the outcome and impact of your leadership",
      "Include any lessons learned"
    ]
  },
  {
    id: 9,
    question: "How do you handle criticism?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show you're open to feedback and don't take it personally",
      "Give a specific example of receiving and acting on criticism",
      "Emphasize continuous improvement and growth",
      "Distinguish between constructive criticism and unfair treatment"
    ]
  },
  {
    id: 10,
    question: "Tell me about a time you failed.",
    category: "Behavioral",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Own the failure - don't blame others or make excuses",
      "Choose a genuine failure, not a humble brag",
      "Focus on what you learned and how you've improved",
      "Show resilience and a positive attitude toward setbacks"
    ]
  },
  {
    id: 11,
    question: "What motivates you?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Be authentic - generic answers sound rehearsed",
      "Connect your motivation to what the role offers",
      "Mention both intrinsic (learning, impact) and extrinsic (recognition, growth) motivators",
      "Avoid mentioning money as your primary motivator"
    ]
  },
  {
    id: 12,
    question: "How do you prioritize your work?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Describe a specific system or method you use",
      "Mention tools (calendars, to-do lists, project management apps)",
      "Give an example of managing competing priorities",
      "Show flexibility when priorities change"
    ]
  },
  {
    id: 13,
    question: "Describe a time you went above and beyond.",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Choose an example that shows genuine initiative",
      "Explain why you decided to go the extra mile",
      "Describe the positive impact of your extra effort",
      "Don't make it sound like you always overwork"
    ]
  },
  {
    id: 14,
    question: "How do you handle stress and pressure?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Acknowledge that stress is normal in any job",
      "Share specific strategies you use to manage stress",
      "Give an example of performing well under pressure",
      "Show you can recognize when to ask for help"
    ]
  },
  {
    id: 15,
    question: "Tell me about a mistake you made and what you learned.",
    category: "Behavioral",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Choose a real mistake, not something trivial",
      "Take responsibility without dwelling on blame",
      "Focus heavily on the learning and growth",
      "Explain how you've applied this lesson since"
    ]
  },
  {
    id: 16,
    question: "How would your friends/colleagues describe you?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Be honest and choose traits relevant to the job",
      "Use specific examples to support each trait",
      "Avoid generic answers like 'nice' or 'hardworking'",
      "Consider asking friends beforehand for authentic answers"
    ]
  },
  {
    id: 17,
    question: "What do you know about our company?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Research the company's history, mission, and values",
      "Know their products, services, and recent news",
      "Understand their competitors and market position",
      "Show genuine interest, not just memorized facts"
    ]
  },
  {
    id: 18,
    question: "Why are you leaving your current position?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Never badmouth previous employers or colleagues",
      "Focus on what you're moving toward, not away from",
      "Mention growth opportunities, new challenges, or career alignment",
      "Be honest but diplomatic"
    ]
  },
  {
    id: 19,
    question: "What questions do you have for us?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Always have 2-3 thoughtful questions prepared",
      "Ask about the team, culture, or role specifics",
      "Avoid asking about salary or benefits in early rounds",
      "Show curiosity about growth opportunities and success metrics"
    ]
  },
  {
    id: 20,
    question: "Describe your ideal work environment.",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Research the company culture before answering",
      "Be authentic but align with what the company offers",
      "Mention collaboration, autonomy, or learning based on the role",
      "Show flexibility and adaptability"
    ]
  },

  // SITUATIONAL QUESTIONS (15 questions)
  {
    id: 21,
    question: "What would you do if you disagreed with your manager's decision?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show respect for authority while maintaining your perspective",
      "Emphasize open communication and understanding their viewpoint",
      "Explain how you'd present your concerns professionally",
      "Show you can ultimately support the team decision"
    ]
  },
  {
    id: 22,
    question: "How would you handle a missed deadline?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Acknowledge the importance of meeting deadlines",
      "Explain how you'd communicate proactively",
      "Describe steps to minimize impact and prevent recurrence",
      "Show accountability without making excuses"
    ]
  },
  {
    id: 23,
    question: "What would you do if you caught a colleague stealing?",
    category: "Situational",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Show you understand the seriousness of the situation",
      "Emphasize following company policies and procedures",
      "Mention reporting to appropriate authorities",
      "Demonstrate integrity while being thoughtful"
    ]
  },
  {
    id: 24,
    question: "How would you handle a difficult customer or client?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Listen actively and acknowledge their frustration",
      "Stay calm and professional regardless of their behavior",
      "Focus on finding a solution, not assigning blame",
      "Know when to escalate to a supervisor"
    ]
  },
  {
    id: 25,
    question: "What would you do if you were assigned a task you've never done before?",
    category: "Situational",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Show enthusiasm for learning new things",
      "Describe your approach to researching and upskilling",
      "Mention asking for help and guidance when needed",
      "Give an example of quickly learning something new"
    ]
  },
  {
    id: 26,
    question: "How would you handle conflicting priorities from two managers?",
    category: "Situational",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Acknowledge the difficulty without complaining",
      "Describe how you'd communicate with both managers",
      "Emphasize transparency and seeking clarification",
      "Show you can facilitate resolution professionally"
    ]
  },
  {
    id: 27,
    question: "What would you do if you realized you made an error that affected the team?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Take immediate responsibility",
      "Communicate the error promptly to relevant parties",
      "Focus on fixing the problem first, then preventing recurrence",
      "Show you learn from mistakes"
    ]
  },
  {
    id: 28,
    question: "How would you approach a project with an unclear brief?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show proactive communication skills",
      "Describe how you'd gather requirements and clarify expectations",
      "Mention creating a plan and getting stakeholder buy-in",
      "Demonstrate comfort with ambiguity while seeking clarity"
    ]
  },
  {
    id: 29,
    question: "What would you do if you had to work with someone you didn't get along with?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show professionalism and maturity",
      "Focus on common goals and deliverables",
      "Describe strategies for effective collaboration despite differences",
      "Emphasize keeping personal feelings separate from work"
    ]
  },
  {
    id: 30,
    question: "How would you handle receiving contradictory feedback?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Acknowledge that different perspectives are valuable",
      "Describe how you'd seek clarification and synthesize feedback",
      "Show you can make decisions when guidance isn't clear",
      "Emphasize learning from diverse viewpoints"
    ]
  },
  {
    id: 31,
    question: "What would you do if you finished your work early?",
    category: "Situational",
    difficulty: "Easy",
    industry: "General",
    tips: [
      "Show initiative and proactive attitude",
      "Mention offering help to teammates",
      "Describe using time for learning or improvement",
      "Ask your manager for additional responsibilities"
    ]
  },
  {
    id: 32,
    question: "How would you handle a situation where you had to deliver bad news?",
    category: "Situational",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Emphasize honesty and transparency",
      "Describe preparing for the conversation thoughtfully",
      "Show empathy while being direct",
      "Include potential solutions or next steps"
    ]
  },
  {
    id: 33,
    question: "What would you do if you noticed a safety or compliance issue?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Show that safety and compliance are top priorities",
      "Describe following proper reporting procedures",
      "Emphasize documentation and communication",
      "Show you'd take appropriate action regardless of consequences"
    ]
  },
  {
    id: 34,
    question: "How would you handle a project that was going off track?",
    category: "Situational",
    difficulty: "Medium",
    industry: "General",
    tips: [
      "Identify the root cause of the issues",
      "Communicate early with stakeholders about challenges",
      "Propose solutions or adjustments to scope/timeline",
      "Show problem-solving skills and accountability"
    ]
  },
  {
    id: 35,
    question: "What would you do if asked to do something unethical?",
    category: "Situational",
    difficulty: "Hard",
    industry: "General",
    tips: [
      "Show strong ethical principles",
      "Describe how you'd respectfully decline",
      "Mention escalating to appropriate channels if needed",
      "Demonstrate integrity is non-negotiable"
    ]
  },

  // TECHNICAL QUESTIONS (10 questions)
  {
    id: 36,
    question: "Walk me through a technical project you've worked on.",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Structure your answer: problem, approach, technologies, result",
      "Explain technical decisions at an appropriate level",
      "Highlight challenges faced and how you overcame them",
      "Quantify impact if possible"
    ]
  },
  {
    id: 37,
    question: "How do you stay updated with the latest technology trends?",
    category: "Technical",
    difficulty: "Easy",
    industry: "Technology",
    tips: [
      "Mention specific resources: blogs, podcasts, courses, communities",
      "Describe hands-on learning through side projects",
      "Show genuine passion for continuous learning",
      "Connect learning to practical application"
    ]
  },
  {
    id: 38,
    question: "Explain a complex technical concept to a non-technical person.",
    category: "Technical",
    difficulty: "Hard",
    industry: "Technology",
    tips: [
      "Choose a concept you understand deeply",
      "Use analogies and simple language",
      "Avoid jargon and technical terms",
      "Check for understanding as you explain"
    ]
  },
  {
    id: 39,
    question: "How do you approach debugging a problem?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Describe a systematic approach",
      "Mention tools and techniques you use",
      "Show you can isolate and reproduce issues",
      "Emphasize documentation and communication"
    ]
  },
  {
    id: 40,
    question: "What's your experience with [specific technology/tool]?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Be honest about your experience level",
      "Give specific examples of how you've used it",
      "Mention what you've learned and achieved",
      "Show eagerness to deepen your expertise"
    ]
  },
  {
    id: 41,
    question: "How do you ensure code quality in your projects?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Mention code reviews, testing, and documentation",
      "Describe tools and processes you use",
      "Show understanding of maintainability and scalability",
      "Emphasize continuous improvement"
    ]
  },
  {
    id: 42,
    question: "Describe a time you had to learn a new technology quickly.",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Show your learning strategy and approach",
      "Mention resources you used",
      "Describe how you applied the new knowledge",
      "Highlight the successful outcome"
    ]
  },
  {
    id: 43,
    question: "How do you handle technical disagreements with teammates?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Show respect for different perspectives",
      "Describe data-driven decision making",
      "Mention prototyping or testing to validate approaches",
      "Emphasize collaboration over being right"
    ]
  },
  {
    id: 44,
    question: "What's your experience with Agile/Scrum methodologies?",
    category: "Technical",
    difficulty: "Easy",
    industry: "Technology",
    tips: [
      "Describe your practical experience with Agile",
      "Mention specific ceremonies and artifacts",
      "Show understanding of the principles behind practices",
      "Be honest if your experience is limited"
    ]
  },
  {
    id: 45,
    question: "How do you balance technical debt with new features?",
    category: "Technical",
    difficulty: "Hard",
    industry: "Technology",
    tips: [
      "Show understanding of the trade-offs",
      "Describe how you prioritize and communicate",
      "Mention strategies for managing technical debt",
      "Emphasize long-term thinking"
    ]
  },

  // CASE STUDY QUESTIONS (10 questions)
  {
    id: 46,
    question: "How would you increase user engagement for a mobile app?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Technology",
    tips: [
      "Clarify the type of app and current metrics",
      "Structure your answer: analyze, hypothesize, prioritize, measure",
      "Consider user segments and their needs",
      "Propose specific, testable solutions"
    ]
  },
  {
    id: 47,
    question: "A client's sales have dropped 20%. How would you diagnose the problem?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Consulting",
    company: "McKinsey-style",
    tips: [
      "Ask clarifying questions about the business",
      "Use a framework: external vs internal factors",
      "Consider multiple hypotheses",
      "Propose data you'd need to validate each hypothesis"
    ]
  },
  {
    id: 48,
    question: "How would you launch a new product in the Singapore market?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Marketing",
    tips: [
      "Start with market analysis and customer segmentation",
      "Consider competitive landscape",
      "Propose go-to-market strategy with specific tactics",
      "Include success metrics and timeline"
    ]
  },
  {
    id: 49,
    question: "How would you improve the customer experience at a bank?",
    category: "Case Study",
    difficulty: "Medium",
    industry: "Finance",
    tips: [
      "Identify current pain points through customer lens",
      "Consider both digital and physical touchpoints",
      "Prioritize improvements by impact and feasibility",
      "Balance innovation with regulatory requirements"
    ]
  },
  {
    id: 50,
    question: "A startup is deciding between two business models. How would you advise them?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Startup",
    tips: [
      "Clarify the two models and the startup's goals",
      "Analyze pros and cons of each model",
      "Consider market conditions and competition",
      "Make a recommendation with clear reasoning"
    ]
  },
  {
    id: 51,
    question: "How would you prioritize features for a new app?",
    category: "Case Study",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Clarify user needs and business objectives",
      "Use a framework like RICE or MoSCoW",
      "Consider development effort and dependencies",
      "Balance quick wins with strategic features"
    ]
  },
  {
    id: 52,
    question: "How would you reduce operational costs by 15%?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Consulting",
    tips: [
      "Ask about current cost structure",
      "Identify major cost drivers",
      "Propose systematic approach to finding savings",
      "Consider both quick wins and structural changes"
    ]
  },
  {
    id: 53,
    question: "A company wants to expand internationally. Where should they go first?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Consulting",
    tips: [
      "Clarify the company's products and capabilities",
      "Define criteria for market selection",
      "Analyze 2-3 potential markets",
      "Make a recommendation with execution considerations"
    ]
  },
  {
    id: 54,
    question: "How would you design a rewards program for an e-commerce site?",
    category: "Case Study",
    difficulty: "Medium",
    industry: "Marketing",
    tips: [
      "Define objectives: retention, increased spend, referrals",
      "Consider customer segments and behaviors",
      "Design program mechanics and rewards",
      "Propose metrics to track success"
    ]
  },
  {
    id: 55,
    question: "A hospital wants to reduce patient wait times. How would you approach this?",
    category: "Case Study",
    difficulty: "Hard",
    industry: "Healthcare",
    tips: [
      "Map the patient journey and identify bottlenecks",
      "Consider capacity, scheduling, and processes",
      "Propose data-driven solutions",
      "Balance efficiency with quality of care"
    ]
  },

  // INDUSTRY-SPECIFIC BEHAVIORAL QUESTIONS (10 questions)
  {
    id: 56,
    question: "Why are you interested in finance/banking?",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "Finance",
    tips: [
      "Show genuine interest in financial markets and services",
      "Mention specific areas that excite you",
      "Connect your skills and background to finance",
      "Demonstrate awareness of industry challenges and opportunities"
    ]
  },
  {
    id: 57,
    question: "How do you handle working with large datasets?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Finance",
    tips: [
      "Describe tools and methods you've used",
      "Emphasize accuracy and attention to detail",
      "Show comfort with numbers and analysis",
      "Mention how you ensure data quality"
    ]
  },
  {
    id: 58,
    question: "Tell me about a time you influenced others without authority.",
    category: "Behavioral",
    difficulty: "Hard",
    industry: "Consulting",
    tips: [
      "Show communication and persuasion skills",
      "Describe building buy-in through data and logic",
      "Highlight relationship building",
      "Demonstrate impact and outcome"
    ]
  },
  {
    id: 59,
    question: "How do you approach problem-solving in ambiguous situations?",
    category: "Behavioral",
    difficulty: "Hard",
    industry: "Consulting",
    tips: [
      "Describe your framework for structuring problems",
      "Show comfort with uncertainty",
      "Mention hypothesis-driven approach",
      "Emphasize iterating as you learn more"
    ]
  },
  {
    id: 60,
    question: "Describe a creative marketing campaign you admire.",
    category: "Behavioral",
    difficulty: "Easy",
    industry: "Marketing",
    tips: [
      "Choose a campaign relevant to the company if possible",
      "Explain why it was effective",
      "Analyze the strategy behind it",
      "Connect it to what you'd bring to the role"
    ]
  },
  {
    id: 61,
    question: "How do you stay customer-focused in your work?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "Marketing",
    tips: [
      "Describe methods for understanding customer needs",
      "Give examples of customer-driven decisions",
      "Show empathy and user-centric thinking",
      "Mention feedback loops and testing"
    ]
  },
  {
    id: 62,
    question: "Why do you want to work at a startup vs. a large company?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "Startup",
    tips: [
      "Show understanding of startup environment",
      "Emphasize comfort with ambiguity and wearing many hats",
      "Connect your personality to startup culture",
      "Be honest about trade-offs"
    ]
  },
  {
    id: 63,
    question: "How do you handle rapid change and uncertainty?",
    category: "Behavioral",
    difficulty: "Medium",
    industry: "Startup",
    tips: [
      "Show adaptability and resilience",
      "Give specific examples of navigating change",
      "Emphasize focus on what you can control",
      "Demonstrate positive attitude toward challenges"
    ]
  },
  {
    id: 64,
    question: "Describe your approach to designing user-friendly interfaces.",
    category: "Technical",
    difficulty: "Medium",
    industry: "Technology",
    tips: [
      "Show user-centered design thinking",
      "Mention research and testing methods",
      "Describe iterating based on feedback",
      "Balance aesthetics with functionality"
    ]
  },
  {
    id: 65,
    question: "How do you ensure quality in your engineering work?",
    category: "Technical",
    difficulty: "Medium",
    industry: "Engineering",
    tips: [
      "Describe your quality assurance process",
      "Mention testing, reviews, and documentation",
      "Show attention to detail and standards",
      "Emphasize continuous improvement"
    ]
  }
];

// Helper function to get questions by category
export function getQuestionsByCategory(category: QuestionCategory): InterviewQuestion[] {
  return interviewQuestions.filter(q => q.category === category);
}

// Helper function to get questions by difficulty
export function getQuestionsByDifficulty(difficulty: QuestionDifficulty): InterviewQuestion[] {
  return interviewQuestions.filter(q => q.difficulty === difficulty);
}

// Helper function to get questions by industry
export function getQuestionsByIndustry(industry: Industry): InterviewQuestion[] {
  return interviewQuestions.filter(q => q.industry === industry);
}

// Get unique companies from questions
export function getUniqueCompanies(): string[] {
  const companies = interviewQuestions
    .filter(q => q.company)
    .map(q => q.company as string);
  return [...new Set(companies)];
}

// Get random questions
export function getRandomQuestions(count: number): InterviewQuestion[] {
  const shuffled = [...interviewQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
