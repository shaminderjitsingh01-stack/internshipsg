export type ArticleCategory = 'Interview Tips' | 'Resume Tips' | 'Career Advice' | 'Industry Insights';

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readTime: number; // in minutes
  publishedAt: string;
  author: string;
  content: string;
  relatedSlugs: string[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'top-10-interview-mistakes-to-avoid',
    title: 'Top 10 Interview Mistakes to Avoid',
    excerpt: 'Learn about the most common interview mistakes that candidates make and how to avoid them to increase your chances of landing your dream internship.',
    category: 'Interview Tips',
    readTime: 8,
    publishedAt: '2026-01-15',
    author: 'Internship.sg Team',
    relatedSlugs: ['how-to-answer-tell-me-about-yourself', 'star-method-complete-guide', 'how-to-follow-up-after-interview'],
    content: `
# Top 10 Interview Mistakes to Avoid

Landing an internship in Singapore's competitive job market requires more than just a stellar resume. Your interview performance can make or break your chances. Here are the top 10 mistakes candidates make and how to avoid them.

## 1. Arriving Unprepared

**The Mistake:** Walking into an interview without researching the company, role, or industry.

**How to Avoid It:** Spend at least 2-3 hours researching before any interview:
- Read the company's website, especially their "About" and "News" sections
- Check their LinkedIn page for recent updates
- Understand their products, services, and competitors
- Know the job description inside out

## 2. Poor Body Language

**The Mistake:** Slouching, avoiding eye contact, or appearing disengaged.

**How to Avoid It:**
- Sit up straight and lean slightly forward to show interest
- Maintain natural eye contact (aim for 60-70% of the time)
- Use open hand gestures when speaking
- Smile genuinely, especially when greeting and departing

## 3. Not Asking Questions

**The Mistake:** When asked "Do you have any questions for us?", saying "No, I think you covered everything."

**How to Avoid It:** Always prepare 3-5 thoughtful questions:
- "What does success look like in this role after 3 months?"
- "What's the team culture like?"
- "What are the biggest challenges facing the team right now?"
- "What learning opportunities are available for interns?"

## 4. Speaking Negatively About Previous Experiences

**The Mistake:** Badmouthing previous employers, professors, or teammates.

**How to Avoid It:**
- Frame challenges as learning experiences
- Focus on what you gained rather than what went wrong
- If asked about conflicts, emphasize resolution and growth

## 5. Giving Generic Answers

**The Mistake:** Providing vague, rehearsed answers without specific examples.

**How to Avoid It:**
- Use the STAR method (Situation, Task, Action, Result)
- Prepare 5-7 specific stories from your experiences
- Quantify your achievements when possible
- Make your examples relevant to the role

## 6. Arriving Late

**The Mistake:** Showing up late or exactly on time (which feels rushed).

**How to Avoid It:**
- Plan to arrive 10-15 minutes early
- Do a practice run to the location beforehand
- Account for Singapore's traffic and MRT delays
- Have the interviewer's contact in case of emergencies

## 7. Inappropriate Dress Code

**The Mistake:** Dressing too casually or not matching the company culture.

**How to Avoid It:**
- When in doubt, dress slightly more formal
- Research the company's dress code beforehand
- For tech companies: smart casual is usually fine
- For banks and consulting: business formal is expected

## 8. Rambling or Not Answering the Question

**The Mistake:** Going off-topic or giving unnecessarily long answers.

**How to Avoid It:**
- Keep answers to 1-2 minutes for most questions
- Start with a direct answer, then provide context
- Pause to think before answering complex questions
- Practice the "headline first" approach

## 9. Not Demonstrating Enthusiasm

**The Mistake:** Appearing indifferent or treating the interview like a transaction.

**How to Avoid It:**
- Show genuine interest in the company and role
- Express enthusiasm verbally: "I'm really excited about..."
- Share why this specific opportunity appeals to you
- Follow up with a thank-you email within 24 hours

## 10. Failing to Sell Yourself

**The Mistake:** Being too modest or failing to highlight your achievements.

**How to Avoid It:**
- Prepare a clear personal pitch (30-60 seconds)
- Know your top 3 strengths and have examples for each
- Connect your experiences to the role's requirements
- Practice talking about your achievements confidently

## Key Takeaways

- Preparation is 80% of interview success
- Specific examples beat generic claims every time
- Enthusiasm and genuine interest are contagious
- Body language matters as much as your words
- Every question is an opportunity to demonstrate value

Practice these tips with our AI interviewer and get instant feedback on your performance. The more you practice, the more natural these behaviors become.
    `
  },
  {
    slug: 'how-to-answer-tell-me-about-yourself',
    title: "How to Answer 'Tell Me About Yourself'",
    excerpt: "Master the most common interview opening question with a structured approach that showcases your strengths and captures the interviewer's attention.",
    category: 'Interview Tips',
    readTime: 6,
    publishedAt: '2026-01-12',
    author: 'Internship.sg Team',
    relatedSlugs: ['star-method-complete-guide', 'top-10-interview-mistakes-to-avoid', 'how-to-research-company-before-interview'],
    content: `
# How to Answer 'Tell Me About Yourself'

"Tell me about yourself" is often the first question in an interview, and it sets the tone for everything that follows. Here's how to craft a compelling response that makes a lasting impression.

## Why Interviewers Ask This Question

Understanding the purpose helps you craft a better answer:
- To break the ice and ease into the conversation
- To hear your communication style and ability to summarize
- To learn what you consider most important about yourself
- To guide the direction of follow-up questions

## The Present-Past-Future Framework

Structure your answer using this proven framework:

### 1. Present (30 seconds)
Start with your current situation:
- What you're studying and where
- Any current relevant activities (projects, part-time work, CCAs)
- A brief hook that shows your passion

**Example:** "I'm a third-year Computer Science student at NUS, currently leading a team of four in developing a mobile app for campus food delivery as my capstone project."

### 2. Past (30 seconds)
Connect relevant experiences:
- Previous internships or work experience
- Key achievements and skills developed
- What led you to this field

**Example:** "Last summer, I interned at a local startup where I built RESTful APIs and learned the importance of scalable system design. That experience confirmed my interest in backend development."

### 3. Future (20 seconds)
Show how this role fits your goals:
- Why you're interested in this specific role
- How it aligns with your career aspirations
- Your enthusiasm for the opportunity

**Example:** "I'm excited about this internship at Grab because I want to work on systems that impact millions of users daily, and I'm particularly drawn to your engineering culture of ownership and innovation."

## Sample Answers by Industry

### For Tech Roles
"I'm currently a final-year Information Systems student at SMU, specializing in software development. What excites me most is solving complex problems through code. Last year, I completed an internship at a fintech startup where I built a payment reconciliation system that reduced manual processing time by 60%. I also contribute to open-source projects in my spare time and recently had a pull request merged into a popular library. I'm applying to Google because I want to work on products that impact billions of users and learn from the best engineers in the industry."

### For Business Roles
"I'm a third-year Business student at NTU with a focus on strategy and analytics. I've always been fascinated by how companies make decisions, which led me to join the NTU Consulting Club where I'm currently VP of Projects. In that role, I've led three pro-bono consulting projects for local SMEs. Last semester, I also interned at Deloitte in their strategy team, where I helped analyze market entry opportunities for a retail client. I'm drawn to McKinsey because of the breadth of industries and the steep learning curve that the firm offers."

### For Marketing Roles
"I'm a Year 3 Communications student at NUS with a passion for digital marketing. I run a lifestyle Instagram account with 15,000 followers where I've learned hands-on about content strategy and audience engagement. Last summer, I interned at a D2C beauty brand where I helped increase their social media engagement by 40% through a UGC campaign I proposed. I'm excited about this role at Shopee because I want to understand marketing at scale and contribute to campaigns that reach millions of consumers across Southeast Asia."

## Common Mistakes to Avoid

### 1. Starting with "So, basically..."
Begin confidently without filler words or apologetic openings.

### 2. Reciting Your Resume
Don't list everything you've done. Select 2-3 relevant highlights.

### 3. Getting Too Personal
Keep it professional. Save personal hobbies unless they're relevant.

### 4. Going Too Long
Aim for 60-90 seconds maximum. Practice with a timer.

### 5. Being Too Vague
Use specific examples and quantifiable achievements.

## Practice Tips

1. **Write it out first:** Draft your answer, then practice speaking it naturally
2. **Time yourself:** Record and listen back to ensure you're within 90 seconds
3. **Get feedback:** Practice with friends or our AI interviewer
4. **Customize:** Tweak your answer for each company and role
5. **Sound natural:** Memorize key points, not word-for-word scripts

## Quick Formula

If you're short on time, use this simple formula:

**"I'm [current status] with a focus on [relevant specialty]. I got into this field because [genuine interest]. Recently, I [relevant achievement]. I'm excited about [company] because [specific reason]."**

Remember: This question is your chance to control the narrative. Use it wisely to highlight your most impressive and relevant qualities.
    `
  },
  {
    slug: 'star-method-complete-guide',
    title: 'STAR Method: A Complete Guide',
    excerpt: 'Learn how to structure your interview answers using the STAR method to deliver compelling, memorable responses that showcase your abilities.',
    category: 'Interview Tips',
    readTime: 10,
    publishedAt: '2026-01-10',
    author: 'Internship.sg Team',
    relatedSlugs: ['how-to-answer-tell-me-about-yourself', 'top-10-interview-mistakes-to-avoid', 'how-to-follow-up-after-interview'],
    content: `
# STAR Method: A Complete Guide

The STAR method is the gold standard for answering behavioral interview questions. Master this technique, and you'll deliver structured, compelling answers that interviewers love.

## What is the STAR Method?

STAR stands for:
- **S**ituation: Set the context
- **T**ask: Describe your responsibility
- **A**ction: Explain what you did
- **R**esult: Share the outcome

## Why Use STAR?

Interviewers ask behavioral questions ("Tell me about a time when...") because past behavior predicts future performance. STAR helps you:
- Stay organized and on-topic
- Provide specific, memorable examples
- Demonstrate your thought process
- Show measurable impact

## Breaking Down Each Component

### Situation (10-15 seconds)
Set the scene with essential context:
- When and where did this happen?
- What was the overall context?
- Who was involved?

**Keep it brief.** Just enough context for the interviewer to understand the scenario.

**Example:** "During my second-year summer internship at a logistics company, our team was facing a critical challenge with our delivery tracking system experiencing frequent outages."

### Task (10-15 seconds)
Clarify your specific role and objective:
- What was expected of you?
- What was the goal or challenge?
- Why was this important?

**Example:** "As the only software engineering intern on the team, I was asked to identify the root cause and propose a solution within two weeks before peak season."

### Action (45-60 seconds)
This is the heart of your answer. Describe what YOU did:
- What specific steps did you take?
- Why did you choose that approach?
- What skills did you use?
- How did you overcome obstacles?

**Key tip:** Use "I" not "we." Interviewers want to know YOUR contribution.

**Example:** "First, I analyzed the system logs and identified that the outages correlated with database query spikes. I then profiled the most resource-intensive queries and found that a poorly optimized join was causing timeouts. I researched indexing strategies and proposed adding a composite index. After discussing with my supervisor and getting approval, I implemented the change in our staging environment and ran load tests to verify the improvement."

### Result (15-20 seconds)
Share the outcome and impact:
- What was achieved? (Quantify when possible)
- What did you learn?
- What recognition did you receive?

**Example:** "After implementing the index, query times decreased from 3 seconds to 50 milliseconds. The system handled peak season without any outages for the first time in two years. My supervisor shared the solution with the regional teams, and I received a return offer for the following summer."

## STAR Examples by Question Type

### "Tell me about a time you showed leadership."

**Situation:** "During my final year project at NTU, our team of five was struggling to make progress. We were two weeks behind schedule with just one month until the deadline."

**Task:** "Although I wasn't the designated team leader, I realized someone needed to step up to reorganize our approach."

**Action:** "I scheduled a team meeting and facilitated a retrospective where everyone could share blockers. I discovered that unclear task assignments were causing duplicate work and confusion. I proposed we adopt a Kanban board and daily 15-minute standups. I also paired underperforming members with stronger ones to balance workload and skill-share. When conflicts arose between two members, I mediated privately and found a compromise."

**Result:** "We delivered the project on time and received an A grade. Two teammates later told me I should have been team leader from the start. This experience taught me that leadership isn't about titles but about taking initiative when needed."

### "Describe a situation where you failed."

**Situation:** "In my first internship at a marketing agency, I was excited to take on a social media campaign for a client."

**Task:** "I was responsible for creating and scheduling content for a week-long promotional campaign."

**Action:** "I was so eager to impress that I scheduled all the posts without getting proper approval from my supervisor or the client. I assumed I understood the brand voice well enough. When the posts went live, the client was unhappy because the tone didn't match their guidelines."

**Result:** "The posts had to be taken down, and my supervisor had to apologize to the client. I learned a painful but valuable lesson about the importance of approval processes and not letting enthusiasm override due diligence. From then on, I always build in checkpoints and seek feedback before finalizing any client-facing work. In subsequent campaigns, I received positive feedback specifically for my thoroughness in the review process."

### "Give an example of solving a difficult problem."

**Situation:** "While interning at a startup, we discovered that 30% of user signups were dropping off at the payment page."

**Task:** "The product manager asked me to investigate and propose solutions within a week."

**Action:** "I started by analyzing our analytics data to identify patterns in the drop-offs. I then conducted guerrilla user testing with five friends who fit our target demographic. I discovered that the payment form was asking for too much information upfront, and the error messages were unclear. I created a wireframe with a simplified three-step checkout flow and clearer validation feedback. I presented my findings and proposal to the product and engineering teams with data supporting each recommendation."

**Result:** "The team implemented my recommendations the following sprint. Within a month, the signup completion rate improved by 18%, representing significant additional revenue. The PM mentioned my analysis in the company all-hands and asked me to document my research process for future reference."

## Common STAR Mistakes

### 1. Too Much Situation, Too Little Action
- Spend 60-70% of your answer on Action
- Keep Situation and Task brief

### 2. Using "We" Instead of "I"
- It's okay to acknowledge the team
- But be specific about YOUR contribution

### 3. Vague or Missing Results
- Quantify impact whenever possible
- Include lessons learned if results were negative

### 4. Not Answering the Actual Question
- Listen carefully to what's being asked
- Match your example to the competency being assessed

### 5. Choosing Weak Examples
- Pick stories that show meaningful challenges
- Avoid examples where you played a minor role

## Practice Framework

Build your STAR story bank:
1. List 5-7 significant experiences
2. Write out STAR responses for each
3. Map them to common competencies:
   - Leadership
   - Teamwork
   - Problem-solving
   - Conflict resolution
   - Failure and learning
   - Achievement
4. Practice saying them aloud
5. Time yourself (aim for 90-120 seconds total)

## Quick Tips

- **Prepare stories, not scripts:** Memorize key points, not exact words
- **Be honest:** Interviewers can spot fake stories
- **Stay positive:** Even failure stories should end with learning
- **Practice out loud:** Use our AI interviewer for real-time feedback
- **Have backup stories:** In case your first choice doesn't fit

Master the STAR method, and you'll never be caught off-guard by behavioral questions again.
    `
  },
  {
    slug: 'resume-tips-for-fresh-graduates',
    title: 'Resume Tips for Fresh Graduates',
    excerpt: 'Create a standout resume that gets you interviews, even with limited work experience. Learn formatting, content, and optimization strategies.',
    category: 'Resume Tips',
    readTime: 12,
    publishedAt: '2026-01-08',
    author: 'Internship.sg Team',
    relatedSlugs: ['building-your-linkedin-profile', 'how-to-research-company-before-interview', 'networking-tips-for-students'],
    content: `
# Resume Tips for Fresh Graduates

As a fresh graduate or student, you might feel like you don't have enough experience for a compelling resume. The truth is, you have more to offer than you think. Here's how to create a resume that stands out.

## Resume Format and Layout

### Keep It to One Page
Hiring managers spend an average of 7 seconds on initial resume scans. One page is enough for early-career candidates.

### Choose a Clean, Professional Format
- Use a standard font (Arial, Calibri, or Garamond)
- Font size: 10-12pt for body, 14-16pt for headings
- Margins: 0.5-1 inch on all sides
- Consistent spacing throughout
- Avoid tables, graphics, or complex formatting (ATS systems can't read them)

### Recommended Section Order
1. Contact Information
2. Education
3. Relevant Experience (internships, part-time work)
4. Projects
5. Skills
6. Activities/Leadership (optional)

## Contact Information

Include:
- Full name (slightly larger font)
- Phone number (Singapore format: +65 XXXX XXXX)
- Professional email address
- LinkedIn URL (customized if possible)
- GitHub/Portfolio (for tech roles)

**Avoid:**
- Photos (not standard in Singapore)
- Personal details (NRIC, age, address)
- Personal pronouns

## Education Section

For fresh graduates, education goes near the top:

**Format:**
\`\`\`
National University of Singapore
Bachelor of Computing (Computer Science) | Expected May 2026
- GPA: 4.2/5.0 (First Class Honours)
- Relevant Coursework: Data Structures, Algorithms, Database Systems
- Dean's List: AY2024/25 Semester 1
\`\`\`

**Include:**
- University name and degree
- Expected graduation date
- GPA (if 3.5/5.0 or higher, or Second Upper equivalent)
- Relevant coursework (for technical roles)
- Academic achievements

**Skip:**
- High school details (unless very recent or prestigious scholarship)
- All coursework (select relevant ones only)

## Experience Section

Even without internships, you likely have relevant experience:

### Previous Internships
Describe responsibilities and achievements, not just duties.

**Weak:**
\`\`\`
- Assisted with data entry
- Attended meetings
- Helped the marketing team
\`\`\`

**Strong:**
\`\`\`
- Automated weekly reporting using Python scripts, reducing manual processing time from 4 hours to 30 minutes
- Analyzed customer feedback data (n=500+) to identify 3 key pain points, informing product roadmap decisions
- Created social media content that increased engagement rate by 25% over 2 months
\`\`\`

### Part-Time Jobs
Highlight transferable skills like customer service, teamwork, and responsibility.

**Example:**
\`\`\`
Barista | Starbucks | June 2024 - Present
- Handle 150+ customer transactions daily during peak hours while maintaining quality and accuracy
- Train new team members on drink preparation and POS system
- Resolve customer complaints with 95% satisfaction rating
\`\`\`

### Freelance or Gig Work
Include relevant freelance projects:

**Example:**
\`\`\`
Freelance Web Developer | Self-employed | Jan 2024 - Present
- Designed and developed responsive websites for 5 SME clients using React and WordPress
- Managed full project lifecycle from requirement gathering to deployment
- Achieved 100% client satisfaction with repeat business from 3 clients
\`\`\`

## Projects Section

This is gold for fresh graduates. Include:
- Academic projects
- Personal projects
- Hackathon projects
- Open-source contributions

**Format:**
\`\`\`
Food Delivery App | Capstone Project | Jan - May 2025
- Led a team of 4 to build a full-stack mobile app using React Native and Node.js
- Implemented real-time order tracking using WebSocket connections
- Achieved 200+ downloads and 4.5-star rating on beta release
- GitHub: github.com/username/project
\`\`\`

**Tips:**
- Include tech stack for technical projects
- Quantify results when possible
- Link to live demos or repositories
- Highlight your specific role in team projects

## Skills Section

### For Technical Roles
Organize by category:
\`\`\`
Languages: Python, JavaScript, Java, SQL
Frameworks: React, Node.js, Django, Spring Boot
Tools: Git, Docker, AWS, PostgreSQL
\`\`\`

**Avoid:**
- Skill bars or percentages (subjective and unhelpful)
- Soft skills (demonstrate through experience instead)
- Outdated technologies (unless specifically relevant)

### For Business Roles
\`\`\`
Technical: Excel (VLOOKUP, Pivot Tables), SQL, Tableau, Python (basic)
Languages: English (Native), Mandarin (Fluent), Malay (Conversational)
Certifications: Google Analytics, HubSpot Inbound Marketing
\`\`\`

## Activities and Leadership

Include if you have space and they're relevant:
\`\`\`
Vice President | NUS Fintech Society | Aug 2024 - Present
- Lead a committee of 8 to organize fintech workshops reaching 200+ students
- Secured partnerships with 5 fintech companies for speaker events
\`\`\`

## Action Verbs to Use

Start each bullet point with a strong action verb:

**Leadership:** Led, Directed, Coordinated, Managed, Supervised
**Creation:** Built, Designed, Developed, Created, Launched
**Analysis:** Analyzed, Evaluated, Assessed, Researched, Identified
**Achievement:** Achieved, Exceeded, Improved, Increased, Reduced
**Communication:** Presented, Negotiated, Collaborated, Influenced

## ATS Optimization

Most companies use Applicant Tracking Systems:

1. **Use keywords from job description:** Mirror the exact phrases used
2. **Avoid graphics and tables:** Stick to plain text formatting
3. **Standard section headers:** Use "Experience" not "Where I've Worked"
4. **Save as PDF:** Unless specified otherwise
5. **Include both acronyms and full terms:** "Search Engine Optimization (SEO)"

## Common Mistakes

1. **Typos and grammar errors:** Proofread multiple times
2. **Generic objectives:** Skip objectives or make them specific
3. **Including "References available upon request":** Assumed and wastes space
4. **Inconsistent formatting:** Align dates, use same bullet style
5. **Lying or exaggerating:** Will backfire in interviews or background checks

## Quick Checklist

Before submitting:
- [ ] One page, clean formatting
- [ ] No typos or grammatical errors
- [ ] Quantified achievements where possible
- [ ] Customized for the specific role
- [ ] Keywords from job description included
- [ ] Contact information is correct
- [ ] Saved as PDF with professional filename (FirstLast_Resume.pdf)

## Final Tip

Your resume gets you the interview; your interview gets you the job. Focus on crafting a resume that earns you the chance to showcase your full potential in person.

Upload your resume to Internship.sg for instant AI-powered feedback and suggestions for improvement.
    `
  },
  {
    slug: 'how-to-research-company-before-interview',
    title: 'How to Research a Company Before Your Interview',
    excerpt: 'Thorough company research sets you apart from other candidates. Learn what to look for and how to use your findings in the interview.',
    category: 'Career Advice',
    readTime: 7,
    publishedAt: '2026-01-05',
    author: 'Internship.sg Team',
    relatedSlugs: ['top-10-interview-mistakes-to-avoid', 'how-to-answer-tell-me-about-yourself', 'what-to-wear-to-interview'],
    content: `
# How to Research a Company Before Your Interview

Walking into an interview with thorough company knowledge demonstrates genuine interest and separates you from candidates who didn't bother to prepare. Here's your complete research guide.

## Why Company Research Matters

- Shows you're genuinely interested, not just mass-applying
- Helps you ask informed questions
- Enables you to tailor your answers
- Prepares you for "Why this company?" questions
- Helps you evaluate if the company is right for you

## Essential Research Areas

### 1. Company Basics
Start with the fundamentals:

**What to find:**
- What does the company do? (Products/services)
- When was it founded?
- How big is it? (Employees, revenue, market cap)
- Where is it headquartered? Where are offices?
- Who are the founders/CEO/key leaders?

**Where to look:**
- Company website (About, Team pages)
- LinkedIn company page
- Wikipedia
- Crunchbase (for startups)
- Annual reports (for public companies)

### 2. Mission, Vision, and Values
Understanding company culture helps you connect:

**What to find:**
- Mission statement
- Core values
- Company culture
- Diversity and inclusion initiatives

**Where to look:**
- Careers page
- About Us section
- Company blog
- Glassdoor reviews

**How to use it:**
When asked about culture fit, reference specific values:
"I noticed Grab values 'Drive' and 'Heart.' My experience leading volunteer projects shows I combine ambition with empathy, which aligns with those values."

### 3. Recent News and Developments
Show you're up-to-date:

**What to find:**
- Recent product launches
- Funding announcements
- Partnerships or acquisitions
- Leadership changes
- Expansion plans

**Where to look:**
- Google News (search company name)
- TechCrunch, Tech in Asia (for tech companies)
- Business Times, Straits Times (for Singapore focus)
- Company press releases
- Company social media accounts

**How to use it:**
"I read about your recent expansion into Vietnam. I'm curious how that's changing the product strategy for Southeast Asia."

### 4. Products and Services
Understand what they actually do:

**What to find:**
- Main products/services
- Target customers
- Pricing model
- Competitive advantages
- Future product direction

**Where to look:**
- Product pages on website
- App stores (for apps)
- Product Hunt
- YouTube demos and reviews
- Try the product yourself if possible

**How to use it:**
"I've been using the Grab app for years, and I particularly appreciate the SuperCard integration. I'm interested in how you decide which features to add to the super app."

### 5. Competitors and Industry
Show broader market awareness:

**What to find:**
- Main competitors
- Market position
- Industry trends
- Challenges facing the industry

**Where to look:**
- Industry reports (IBISWorld, Statista)
- Business news articles
- Analyst reports
- LinkedIn industry pages

**How to use it:**
"With the rise of buy-now-pay-later services like Atome and Pace, how is DBS approaching the competitive landscape in consumer financing?"

### 6. The Specific Role and Team
Tailor your understanding:

**What to find:**
- What team would you join?
- Who might you work with?
- What projects is the team working on?
- What tech stack or methodologies do they use?

**Where to look:**
- Job description (read carefully!)
- LinkedIn (search for people in similar roles)
- Engineering blog (for tech roles)
- Company tech talks on YouTube
- Glassdoor interview reviews

### 7. Interview Process
Know what to expect:

**What to find:**
- How many rounds?
- What types of interviews?
- What do they typically ask?
- How long does the process take?

**Where to look:**
- Glassdoor interview section
- Company careers page
- Forums (Reddit, HardwareZone)
- Internship.sg company profiles

## Creating Your Research Document

Before each interview, compile your findings:

\`\`\`
COMPANY RESEARCH: [Company Name]

BASICS
- Founded:
- Headquarters:
- Size:
- What they do:

RECENT NEWS (Last 3 months)
1.
2.
3.

MISSION/VALUES
- Mission:
- Values that resonate with me:

PRODUCTS I'VE TRIED
- Product:
- My experience:

QUESTIONS TO ASK
1.
2.
3.

THINGS TO MENTION
- Connection to their value of [X]: [My example]
- Interest in their product [Y]: [Why]
- Relevant to their recent news: [Connection]
\`\`\`

## Red Flags to Watch For

While researching, also look for:
- High turnover (many short tenures on LinkedIn)
- Consistently negative Glassdoor reviews
- Financial troubles or layoffs
- Legal issues or controversies
- Lack of diversity in leadership
- Unclear business model

## Time Investment Guide

**Minimum (30 minutes):**
- Company website scan
- Recent news (last 3 articles)
- Glassdoor quick review
- Job description re-read

**Recommended (1-2 hours):**
- All the above, plus:
- Try their product
- LinkedIn research
- Prepare 5 specific questions
- Create research document

**For Dream Companies (2-3 hours):**
- All the above, plus:
- Read engineering/company blog
- Watch leadership interviews
- Connect research to personal stories
- Practice customized answers

## Turning Research into Answers

### "Why do you want to work here?"
Don't: "Because you're a big company with good opportunities."
Do: "I'm drawn to Shopee's mission to connect buyers and sellers across Southeast Asia. I've been using the app since 2019 and watched it evolve. The recent Shopee Guarantee feature shows how you're building trust in e-commerce. I want to contribute to a product that's shaping how the region shops."

### "What do you know about us?"
Don't: "You're an e-commerce company founded in Singapore."
Do: "Shopee was founded in 2015 and has grown to be the leading e-commerce platform in Southeast Asia and Taiwan. What impresses me is the mobile-first approach and how you've built an ecosystem with ShopeePay and Shopee Mall. I also read about the recent partnership with [X], which shows the expansion strategy I'm excited to be part of."

### Questions to ask based on research:
- "I saw that you recently launched [feature]. What was the biggest challenge in developing it?"
- "Your engineering blog mentioned moving to [technology]. How has that transition been?"
- "I noticed [leader] came from [company]. How has that influenced the team culture?"

## Final Tips

1. **Take notes:** You'll reference these before the interview
2. **Go beyond Google:** Use the product, read the blog, watch interviews
3. **Find personal connections:** What genuinely interests you?
4. **Update before each round:** Things change quickly
5. **Don't memorize, understand:** Speak naturally about your research

Thorough research shows respect for the interviewer's time and genuine interest in the opportunity. It's one of the easiest ways to stand out.
    `
  },
  {
    slug: 'salary-negotiation-tips-for-interns',
    title: 'Salary Negotiation Tips for Interns',
    excerpt: 'Yes, interns can negotiate too! Learn when and how to negotiate your internship compensation professionally and effectively.',
    category: 'Career Advice',
    readTime: 8,
    publishedAt: '2026-01-03',
    author: 'Internship.sg Team',
    relatedSlugs: ['how-to-follow-up-after-interview', 'resume-tips-for-fresh-graduates', 'networking-tips-for-students'],
    content: `
# Salary Negotiation Tips for Interns

Many interns assume compensation is non-negotiable. While internship salaries are often more fixed than full-time roles, there's often more flexibility than you think. Here's how to approach it.

## Should Interns Negotiate?

**When to negotiate:**
- You have competing offers
- The offer is below market rate
- You bring unique skills or experience
- The company has a reputation for negotiating
- You're a returning intern with a strong track record

**When to be cautious:**
- It's a highly structured program (banks, consulting)
- The company explicitly states fixed compensation
- You have no competing offers and limited leverage
- It's your dream company and the offer is fair

## Singapore Internship Salary Benchmarks (2026)

Understanding market rates gives you leverage:

### Tech Companies
- FAANG/Major Tech (Google, Meta, ByteDance): $6,000 - $8,000/month
- Regional Tech (Grab, Shopee, Sea): $3,500 - $5,000/month
- Startups (funded): $2,000 - $3,500/month
- Startups (early-stage): $1,000 - $2,000/month

### Finance
- Investment Banks (Goldman, JPMorgan): $5,000 - $6,500/month
- Local Banks (DBS, OCBC, UOB): $1,500 - $2,500/month
- Asset Management: $2,000 - $4,000/month
- Fintech: $2,000 - $3,500/month

### Consulting
- MBB (McKinsey, BCG, Bain): $5,000 - $6,000/month
- Big 4 (Deloitte, PwC, EY, KPMG): $1,500 - $2,500/month
- Boutique Consulting: $2,000 - $3,500/month

### Other Industries
- FMCG (P&G, Unilever): $1,500 - $2,500/month
- Government (GovTech, statutory boards): $1,200 - $2,000/month
- SMEs: $800 - $1,500/month

## The Negotiation Process

### Step 1: Wait for the Written Offer
Never discuss compensation until you have a formal offer. If asked about salary expectations earlier, deflect:

"I'm focused on finding the right fit and opportunity. I'm confident that if we're a good match, we can find a compensation package that works for both of us."

### Step 2: Express Enthusiasm First
When you receive the offer:

"Thank you so much for the offer! I'm really excited about the opportunity to join the team and work on [specific project]. I'd like to take a few days to review the details carefully."

### Step 3: Research and Prepare
- Check salary benchmarks (Glassdoor, this article, friends)
- Consider your competing offers
- Identify your target (aim higher than what you'll accept)
- Prepare your justification

### Step 4: Make Your Case
Call or email to discuss (call is often better):

"Hi [Recruiter], thank you again for the offer. I'm very excited about joining [Company]. After reviewing the compensation, I was wondering if there's flexibility on the monthly allowance. Based on my research and the specialized skills I bring in [specific area], I was hoping we could discuss a monthly rate closer to [X]."

### Step 5: Listen and Respond
They might:
- **Accept:** Great! Get it in writing.
- **Partially meet you:** Evaluate if it's acceptable.
- **Decline but offer alternatives:** Consider non-monetary benefits.
- **Decline entirely:** Decide if you still want the role.

## What Else Can You Negotiate?

If salary is truly fixed, consider negotiating:

### Start and End Dates
- Align with your exam schedule
- Take a break between internships
- Start earlier for more experience

### Allowances and Benefits
- Transport allowance
- Meal allowance
- Learning budget for courses
- Hardware/equipment

### Work Arrangements
- Hybrid/remote options
- Flexible hours
- Location preference (if multiple offices)

### Experience and Exposure
- Specific team or project placement
- Mentorship with senior leaders
- Cross-functional exposure
- Return offer consideration

### Post-Internship Benefits
- Priority for full-time hiring
- Extended offer timeline
- Referral for graduate programs

## Sample Negotiation Scripts

### Email Template
\`\`\`
Subject: Re: [Company] Internship Offer - [Your Name]

Dear [Recruiter],

Thank you so much for the offer to join [Company] as a [Role] intern. I'm genuinely excited about the opportunity to work with the team and contribute to [specific area/project].

After careful consideration, I would like to discuss the compensation component of the offer. Based on my research and conversations with peers in similar roles, as well as my relevant experience in [specific skill/experience], I was hoping we could explore a monthly allowance closer to $[X].

I want to emphasize that [Company] remains my top choice, and I'm confident we can find an arrangement that works for both sides. I'm happy to discuss this further at your convenience.

Thank you for your consideration.

Best regards,
[Your Name]
\`\`\`

### Phone Script
"Hi [Recruiter], thanks for taking my call. I wanted to follow up on the offer. First, I want to say I'm really excited about this opportunity, and [Company] is definitely my top choice.

I did want to discuss the compensation. Based on the research I've done and considering my background in [relevant experience], I was hoping we could talk about increasing the monthly allowance to around [target]. Is there any flexibility there?"

## Common Mistakes to Avoid

### 1. Negotiating Too Early
Wait for the written offer before discussing numbers.

### 2. Using Other Offers as Threats
Don't: "I have an offer from Google for $8,000, so you need to match it."
Do: "I'm currently evaluating a few opportunities, and compensation is one factor I'm considering."

### 3. Focusing Only on Money
If salary is fixed, ask about other benefits that matter to you.

### 4. Being Unprofessional
Stay polite and professional, even if they decline. You may want a full-time offer later.

### 5. Accepting Immediately
Ask for 2-3 days to consider, even if you're excited. It's expected and professional.

### 6. Not Getting It in Writing
Any agreed changes should be reflected in the updated offer letter.

## If They Say No

If negotiation isn't possible:

1. **Ask why:** Understand if it's policy or budget
2. **Ask what would change things:** "What would justify a higher rate?"
3. **Consider the full picture:** Experience, learning, networking value
4. **Accept gracefully:** "I understand. I'm still very excited about this opportunity."
5. **Revisit later:** Some companies review compensation mid-internship

## Key Takeaways

- Know your market value before negotiating
- Wait for a written offer before discussing numbers
- Express enthusiasm first, then make your case
- Be professional and never threaten or ultimatum
- Consider non-monetary benefits if salary is fixed
- Get any agreed changes in writing

Remember: The worst they can say is no. A professional negotiation rarely loses you an offer, but it might get you more compensation or better terms.
    `
  },
  {
    slug: 'what-to-wear-to-interview',
    title: 'What to Wear to Your Interview',
    excerpt: "First impressions matter. Learn how to dress appropriately for different industries and company cultures in Singapore's professional landscape.",
    category: 'Interview Tips',
    readTime: 5,
    publishedAt: '2026-01-01',
    author: 'Internship.sg Team',
    relatedSlugs: ['top-10-interview-mistakes-to-avoid', 'how-to-research-company-before-interview', 'how-to-follow-up-after-interview'],
    content: `
# What to Wear to Your Interview

Dressing appropriately for an interview shows respect for the opportunity and helps you feel confident. Here's how to navigate Singapore's professional dress codes across different industries.

## The Golden Rule

**When in doubt, dress slightly more formal than you think is necessary.** It's better to be overdressed than underdressed.

## Dress Codes by Industry

### Banking and Finance (Business Formal)

**For Men:**
- Dark suit (navy, charcoal, or black)
- White or light blue dress shirt
- Conservative tie
- Leather dress shoes (black or dark brown)
- Minimal accessories
- Clean-shaven or neatly groomed facial hair

**For Women:**
- Suit (pants or skirt) or professional dress
- Blouse in neutral colors
- Closed-toe heels or flats
- Minimal jewelry
- Natural makeup
- Professional bag

**Companies:** DBS, OCBC, UOB, Goldman Sachs, JPMorgan, McKinsey

### Tech Companies (Smart Casual to Business Casual)

**For Men:**
- Chinos or dress pants
- Button-down shirt or polo
- No tie necessary
- Clean sneakers or loafers
- Optional: blazer for more formal settings

**For Women:**
- Dress pants or skirt
- Blouse or nice top
- Flats, loafers, or clean sneakers
- Light cardigan or blazer optional

**Companies:** Google, Meta, Grab, Shopee, TikTok, Stripe

### Startups (Casual to Smart Casual)

**For Men:**
- Clean jeans or chinos
- T-shirt with a blazer, or button-down shirt
- Clean sneakers

**For Women:**
- Jeans or casual pants
- Nice top or casual blouse
- Sneakers or flats

**Note:** When unsure about a startup, lean smart casual. You can always dress down, but you can't dress up on the spot.

### Government and Statutory Boards (Business Casual)

**For Men:**
- Dress pants or chinos
- Long-sleeve shirt (tie optional)
- Leather shoes

**For Women:**
- Dress pants or knee-length skirt
- Blouse or conservative top
- Closed-toe shoes

**Companies:** GovTech, EDB, MAS, A*STAR

### Creative Industries (Express Yourself... Professionally)

For marketing, design, and media roles, you can show more personality:
- Add a pop of color
- Unique but tasteful accessories
- Well-fitting, stylish pieces
- Still keep it professional

## What to Avoid (All Industries)

- Wrinkled or stained clothing
- Strong perfume or cologne
- Visible underwear
- Flip-flops or beach sandals
- Excessive jewelry or accessories
- Clothing with large logos or graphics
- Shorts (unless explicitly told casual)
- Athletic wear (unless it's that kind of company)

## Singapore-Specific Considerations

### The Weather
Singapore is hot and humid. Consider:
- Light, breathable fabrics
- Carrying a blazer and putting it on before the interview
- Arriving early to cool down
- Anti-perspirant and tissues

### Video Interviews
Even for video calls:
- Dress as you would in person (at least top half)
- Choose solid colors (patterns can be distracting on camera)
- Ensure good lighting on your face
- Test your setup beforehand

### In-Person Tips
- Bring a light layer (offices are often very cold)
- Pack deodorant for freshening up
- Have an umbrella for sudden rain
- Arrive early to visit the restroom and compose yourself

## Grooming Checklist

**Day Before:**
- Iron or steam your outfit
- Polish your shoes
- Prepare your bag with essentials
- Get a good night's sleep

**Day Of:**
- Shower and groom
- Check for loose threads or missing buttons
- Clean, trimmed nails
- Fresh breath (brush, mints)
- Light fragrance (if any)

## What About Cultural Differences?

Singapore's multicultural environment is generally accepting, but:
- Avoid overly religious or political symbols unless relevant
- Conservative is safer for first impressions
- Once you get the job, you can adapt to the culture

## Virtual Interview Extras

For Zoom/video interviews:
- Professional from waist up (but wear pants just in case!)
- Solid colors work better than patterns on camera
- Avoid all-white (can look washed out) or all-black (can look harsh)
- Good lighting is as important as good clothes
- Neutral, uncluttered background

## Quick Reference Card

| Industry | Dress Code | Key Items |
|----------|------------|-----------|
| Banking/Finance | Business Formal | Suit, tie, dress shoes |
| Consulting | Business Formal | Suit, polished look |
| Big Tech | Smart Casual | Button-down, chinos, clean sneakers |
| Startups | Casual/Smart Casual | Jeans, nice shirt, sneakers |
| Government | Business Casual | Dress pants, long-sleeve shirt |
| Creative | Smart with personality | Express yourself professionally |

## Final Thoughts

Your outfit should make you feel confident, not distracted. When you're not worried about what you're wearing, you can focus on what matters: showing the interviewer why you're the right person for the role.

If you're still unsure, it's perfectly acceptable to ask the recruiter: "What's the typical dress code for interviews?" It shows you care about making the right impression.

Good luck!
    `
  },
  {
    slug: 'how-to-follow-up-after-interview',
    title: 'How to Follow Up After an Interview',
    excerpt: 'Learn the art of post-interview follow-up that keeps you top of mind without being pushy. Includes email templates and timing guidelines.',
    category: 'Interview Tips',
    readTime: 6,
    publishedAt: '2025-12-28',
    author: 'Internship.sg Team',
    relatedSlugs: ['top-10-interview-mistakes-to-avoid', 'what-to-wear-to-interview', 'how-to-research-company-before-interview'],
    content: `
# How to Follow Up After an Interview

The interview isn't over when you walk out the door. A thoughtful follow-up can reinforce your candidacy and keep you top of mind. Here's how to do it right.

## The Thank-You Email (Mandatory)

### Timing
Send within 24 hours of your interview. Same day is ideal.

### Format
- Subject line: "Thank you for the [Role] interview"
- Keep it to 3-4 short paragraphs
- Personalize it to the specific conversation

### What to Include
1. Express gratitude for their time
2. Reference something specific from the conversation
3. Reiterate your interest and fit
4. Mention anything you forgot to say
5. Clear sign-off

### Sample Thank-You Email

\`\`\`
Subject: Thank you for the Software Engineering Intern interview

Dear [Interviewer's Name],

Thank you so much for taking the time to speak with me today about the Software Engineering Intern position at [Company]. I really enjoyed learning more about the team and the exciting projects you're working on.

Our conversation about the real-time data pipeline you're building particularly resonated with me. The technical challenges around scaling to millions of events per second align perfectly with my coursework in distributed systems and my personal project building a real-time notification system.

I'm even more excited about the opportunity after our discussion. I believe my experience with [specific skill] and my enthusiasm for [specific area] would allow me to contribute meaningfully to your team from day one.

Thank you again for the opportunity. Please don't hesitate to reach out if you need any additional information from me. I look forward to hearing from you.

Best regards,
[Your Name]
[Phone Number]
[LinkedIn URL]
\`\`\`

### If You Interviewed with Multiple People
Send individual, personalized emails to each interviewer. Reference something unique from each conversation.

## Follow-Up Timeline

### Week 1: Thank-You Email
Send within 24 hours.

### After Expected Response Date
If they gave you a timeline and it's passed:
- Wait 2-3 business days after the deadline
- Send a polite check-in email

### No Timeline Given
If they didn't specify when you'd hear back:
- Wait 1 week after the interview
- Send a brief follow-up

### After First Follow-Up
If you don't hear back:
- Wait another 1-2 weeks
- Send a final follow-up
- After that, consider moving on

## Follow-Up Email Templates

### Checking In (After Expected Date)

\`\`\`
Subject: Following up - [Role] Interview

Dear [Recruiter's Name],

I hope this email finds you well. I wanted to follow up on my interview for the [Role] position on [Date]. I remain very enthusiastic about the opportunity to join [Company].

I understand the hiring process takes time, and I'm happy to provide any additional information that might be helpful for your decision.

Thank you again for considering my application. I look forward to hearing from you.

Best regards,
[Your Name]
\`\`\`

### Second Follow-Up (1-2 Weeks Later)

\`\`\`
Subject: Re: Following up - [Role] Interview

Dear [Recruiter's Name],

I hope you're doing well. I wanted to touch base once more regarding the [Role] position I interviewed for on [Date].

I'm still very interested in the opportunity and excited about the possibility of contributing to [Company]'s work in [specific area].

If there's any update on the hiring timeline or if you need anything further from me, please let me know. I'm happy to jump on a quick call if that would be helpful.

Thank you for your time.

Best regards,
[Your Name]
\`\`\`

### After Rejection (Optional, for Networking)

\`\`\`
Subject: Thank you - [Role] Application

Dear [Recruiter/Interviewer's Name],

Thank you for letting me know about the decision regarding the [Role] position. While I'm disappointed, I appreciate the opportunity to interview and learn more about [Company].

The team and culture seem fantastic, and I remain interested in [Company] for future opportunities. If you're open to it, I'd love to stay connected for any suitable roles that may come up.

Thank you again for your time and consideration. I wish you and the team continued success.

Best regards,
[Your Name]
\`\`\`

## What NOT to Do

### Don't Be Pushy
- Following up every few days is too much
- Let them work through their process
- One or two follow-ups is enough

### Don't Send Generic Emails
- Reference specific conversation points
- Show you were paying attention
- Personalize each email

### Don't Call Unless Invited
- Email is the standard
- Only call if they gave you their number for follow-up
- Never show up unannounced

### Don't Connect on Personal Social Media
- LinkedIn is appropriate
- Instagram, Facebook are not professional
- Wait until you're colleagues, then consider it

### Don't Get Emotional
- Stay professional even if frustrated
- Never send angry or desperate emails
- This industry is small; reputation matters

## LinkedIn Follow-Up

### When to Connect
- After the interview (not before, usually)
- Include a personalized note

### Connection Note Template
\`\`\`
Hi [Name], it was great speaking with you during my interview for the [Role] position at [Company] today. I enjoyed our conversation about [specific topic] and would love to stay connected. Best regards, [Your Name]
\`\`\`

## Handling Different Scenarios

### They Asked for Additional Materials
- Send promptly (within 24-48 hours)
- Keep the email brief
- Attach clearly labeled files
- Use PDF format unless specified otherwise

### You Forgot to Mention Something Important
Include it in your thank-you email:
"I also wanted to mention that during my previous internship, I [relevant experience]. I think this would be directly applicable to [what you discussed]."

### They Mentioned a Delay
Acknowledge and be patient:
"I completely understand that the process may take longer than initially expected. I'm happy to wait and remain very interested in the opportunity."

## Key Takeaways

1. **Always send a thank-you email** within 24 hours
2. **Personalize** every follow-up with specific details
3. **Be patient** - hiring takes time
4. **Stay professional** regardless of the outcome
5. **Know when to move on** after 2-3 follow-ups

A good follow-up won't save a bad interview, but a missing follow-up can hurt an otherwise good candidacy. Take the few minutes to do it right.

Good luck!
    `
  },
  {
    slug: 'building-your-linkedin-profile',
    title: 'Building Your LinkedIn Profile',
    excerpt: 'A strong LinkedIn profile is essential for internship hunting. Learn how to optimize every section to attract recruiters and opportunities.',
    category: 'Career Advice',
    readTime: 10,
    publishedAt: '2025-12-25',
    author: 'Internship.sg Team',
    relatedSlugs: ['resume-tips-for-fresh-graduates', 'networking-tips-for-students', 'how-to-research-company-before-interview'],
    content: `
# Building Your LinkedIn Profile

LinkedIn is where recruiters find candidates and where opportunities come to you. A well-crafted profile can open doors you didn't even know existed. Here's how to build one that stands out.

## Why LinkedIn Matters for Internship Seekers

- 95% of recruiters use LinkedIn to find candidates
- Many companies source directly from LinkedIn before posting jobs
- Your profile appears in Google searches of your name
- It's a living portfolio that complements your resume
- Networking opportunities with alumni and industry professionals

## Profile Photo

Your photo is 14x more likely to be viewed than profiles without one.

### Do:
- Use a high-quality, recent headshot
- Dress professionally (business casual minimum)
- Have good lighting (natural light works best)
- Smile and look approachable
- Use a simple, uncluttered background
- Make sure your face takes up 60% of the frame

### Don't:
- Use selfies, party photos, or group shots
- Include other people (even cropped out)
- Use photos with filters
- Have a distracting background
- Use photos that don't look like you

**Pro tip:** You can use AI headshot generators like Remini or professional photo booths, but natural photos work just fine.

## Banner Image

The banner is free real estate. Use it wisely.

Ideas:
- City skyline (Singapore Marina Bay)
- Your university campus
- Relevant industry imagery
- A professional design with your tagline
- Keep it simple and clean

Free resources: Canva has LinkedIn banner templates.

## Headline (120 characters)

This is prime real estate that appears in search results. Don't just use your job title.

### Weak Headlines:
- "Student at NUS"
- "Aspiring professional"
- "Looking for opportunities"

### Strong Headlines:
- "Computer Science Student at NUS | Aspiring Software Engineer | Python, Java, React"
- "NTU Business Analytics | Data Science Intern at DBS | Passionate about FinTech"
- "Final Year SMU Marketing Student | Digital Marketing | Content Strategy | SEO"

**Formula:** [Your Status] | [Target Role/Specialization] | [Key Skills/Interests]

## About Section (2,000 characters)

This is your story. Make it count.

### Structure:
1. **Hook:** Open with something engaging
2. **Background:** Your education and experience snapshot
3. **Skills & Interests:** What you're good at and passionate about
4. **Goals:** What you're looking for
5. **Call to Action:** How to reach you

### Sample About Section:

\`\`\`
As a Computer Science student at NUS, I'm fascinated by how technology can solve real-world problems. Currently, I'm exploring machine learning applications in healthcare through my final year project, where I'm building a model to predict patient readmission rates.

My journey into tech started in secondary school when I built my first website for my school's CCA. Since then, I've completed internships at a local startup (where I built APIs serving 10,000+ users) and DBS (where I worked on internal automation tools). These experiences taught me to write clean code, collaborate effectively, and always keep the end user in mind.

What I bring to the table:
- Strong foundation in Python, Java, and JavaScript
- Experience with cloud services (AWS, GCP)
- A curious mind that loves learning new technologies
- The ability to communicate technical concepts to non-technical stakeholders

I'm currently seeking software engineering internship opportunities for Summer 2026, particularly in companies working on products that impact millions of users.

Let's connect! Feel free to reach out at [email] or send me a message here.
\`\`\`

## Experience Section

### Format Each Entry Like Your Resume:
- Company name and your role
- Employment type (Internship, Part-time)
- Dates and location
- Bullet points describing achievements

### Tips:
- Start bullets with action verbs
- Quantify achievements when possible
- Include relevant projects and responsibilities
- Add media (presentations, projects) when available

### Example:
\`\`\`
Software Engineering Intern
Grab | Internship
Jun 2025 - Aug 2025 | Singapore

- Developed and deployed 3 microservices handling 100K+ requests daily using Go and Kubernetes
- Reduced API response time by 40% through database query optimization
- Collaborated with product managers and designers in an agile team of 8
- Built internal documentation site that improved onboarding efficiency
\`\`\`

## Education Section

Include:
- University name
- Degree and major
- Expected graduation date
- GPA (if strong)
- Relevant activities and societies
- Relevant coursework
- Awards and honors

### Example:
\`\`\`
National University of Singapore
Bachelor of Computing (Computer Science)
Aug 2023 - May 2027

GPA: 4.2/5.0

Activities: NUS Hackers, Google Developer Student Clubs, Teaching Assistant for CS2030S

Relevant Coursework: Data Structures and Algorithms, Database Systems, Software Engineering, Machine Learning

Dean's List: AY2024/25 Semester 1 & 2
\`\`\`

## Skills Section

### Be Strategic:
- Add 10-15 most relevant skills
- Put your strongest skills first
- Get endorsements from classmates and colleagues
- Include a mix of technical and soft skills

### For Tech Roles:
Python, Java, JavaScript, SQL, Git, AWS, React, Node.js, Agile, Problem Solving

### For Business Roles:
Data Analysis, Excel, PowerPoint, Market Research, Project Management, Financial Modeling, Communication

### Take LinkedIn Skill Assessments:
- They're free and add credibility
- You get a badge showing "Verified Skills"
- Only display if you score well

## Featured Section

Showcase your best work:
- Link to portfolio website
- GitHub projects
- Published articles
- Presentations
- Certifications
- Videos of talks or projects

## Recommendations

Ask for recommendations from:
- Internship supervisors
- Professors who know your work
- Project teammates (peer recommendations)
- CCA advisors or mentors

### How to Ask:
\`\`\`
Hi [Name], I hope you're doing well! I'm building out my LinkedIn profile as I search for internship opportunities. Would you be open to writing a brief recommendation about our work together on [project/internship]? I'd be happy to draft some bullet points if that would help. Thank you for considering!
\`\`\`

## Activity and Engagement

LinkedIn rewards active users:

### Do:
- Post about projects or learnings occasionally
- Share relevant industry articles with your thoughts
- Congratulate connections on new roles/achievements
- Comment thoughtfully on others' posts
- Write articles about your expertise or experiences

### Don't:
- Over-post or spam your network
- Be controversial or negative
- Share without adding value
- Engage just for the sake of engagement

## Custom URL

Customize your LinkedIn URL for a cleaner look:

- Go to Edit Public Profile
- Create a custom URL: linkedin.com/in/yourname
- Use this on your resume and email signature

## Networking on LinkedIn

### Who to Connect With:
- University alumni
- Recruiters at target companies
- People you've met at events
- Classmates and colleagues
- Industry professionals you admire

### Connection Request Template:
\`\`\`
Hi [Name], I'm a [Your Year] [Major] student at [University]. I came across your profile and was impressed by your work at [Company]. I'd love to connect and learn more about your experience in [industry/role]. Thank you!
\`\`\`

## Profile Checklist

Before your internship search:

- [ ] Professional photo
- [ ] Compelling headline with keywords
- [ ] Detailed About section with personality
- [ ] All relevant experience added
- [ ] Education with activities and coursework
- [ ] 10+ relevant skills added
- [ ] Featured section with projects
- [ ] At least 2-3 recommendations
- [ ] Custom URL set
- [ ] Privacy settings reviewed
- [ ] Open to Work setting enabled (optional)

## "Open to Work" Feature

### How to Enable:
Settings > Job Seeking Preferences > Open to Work

### Options:
- **Visible to all:** Shows a green banner (can be seen as desperate by some)
- **Visible to recruiters only:** More discreet, recommended

### What to Include:
- Target job titles
- Job types (Internship)
- Locations (Singapore, Remote)
- Start date preferences

## Final Tips

1. **Keep it updated:** Review quarterly
2. **Be authentic:** Let your personality show
3. **Keywords matter:** Use terms recruiters search for
4. **Quality over quantity:** Better to have fewer, detailed entries
5. **Proofread:** Typos look unprofessional

Your LinkedIn profile is often the first impression recruiters have of you. Make it count.
    `
  },
  {
    slug: 'networking-tips-for-students',
    title: 'Networking Tips for Students',
    excerpt: 'Networking does not have to be awkward. Learn practical strategies to build genuine professional relationships that can help your career.',
    category: 'Career Advice',
    readTime: 9,
    publishedAt: '2025-12-20',
    author: 'Internship.sg Team',
    relatedSlugs: ['building-your-linkedin-profile', 'resume-tips-for-fresh-graduates', 'salary-negotiation-tips-for-interns'],
    content: `
# Networking Tips for Students

"It's not what you know, it's who you know." While skills matter tremendously, networking opens doors that cold applications can't. Here's how to build meaningful professional connections without feeling awkward.

## Why Networking Matters for Internships

- 70% of jobs are never publicly advertised (hidden job market)
- Referrals are 5x more likely to be hired than cold applicants
- Networking provides industry insights you can't get from websites
- It builds relationships that support your entire career, not just one job
- Alumni connections are particularly valuable in Singapore's small market

## Mindset Shift: From Networking to Connecting

Stop thinking of networking as:
- Collecting business cards
- Asking strangers for jobs
- Awkward small talk at events
- Using people for opportunities

Start thinking of it as:
- Building genuine relationships
- Learning from others' experiences
- Offering value and support
- Connecting with interesting people

## Where to Network

### On-Campus Opportunities

**Career Fairs**
- Research attending companies beforehand
- Prepare your 30-second pitch
- Ask thoughtful questions
- Collect business cards and follow up

**Alumni Events**
- Your university's alumni network is gold
- Alumni are generally willing to help students from their school
- Many universities have formal mentorship programs

**Guest Lectures and Workshops**
- Attend talks by industry professionals
- Ask questions during Q&A
- Approach speakers afterward (briefly)
- Follow up on LinkedIn

**Student Organizations**
- Join clubs related to your career interests
- Take leadership roles (visibility matters)
- Participate in inter-university events

### Online Networking

**LinkedIn**
- Connect with alumni in your target industry
- Engage with their content thoughtfully
- Send personalized connection requests
- Join relevant LinkedIn groups

**Twitter/X**
- Follow industry leaders and companies
- Engage with their content
- Share your own insights and projects
- Participate in Twitter Spaces and discussions

**Industry Slack/Discord Communities**
- Many industries have free communities
- Be helpful and contribute
- Build reputation before asking for favors

### Events and Meetups

**Industry Conferences**
- Many offer student discounts
- Great for meeting professionals and learning
- Prepare questions for speakers

**Meetup Groups**
- Tech, design, finance meetups are active in Singapore
- Regular attendees build relationships over time
- Present or lead discussions when possible

**Hackathons and Case Competitions**
- Network with participants, judges, and sponsors
- Team up with people you'd like to stay connected with
- Judges are often hiring managers or recruiters

## The Art of Cold Outreach

### Who to Reach Out To
- Alumni from your university working in target companies
- Professionals in roles you aspire to
- Second-degree connections (get introduced)
- Recruiters at companies you're interested in

### The Cold Email/Message Template

\`\`\`
Subject: NUS Student - Quick Question About [Company/Role]

Hi [Name],

I came across your profile while researching careers in [industry]. As a [Year] [Major] student at [University], I'm really interested in [specific area], and I noticed your impressive experience at [Company].

I'm reaching out because I'm curious about [specific aspect of their work/career path]. Would you be open to a 15-20 minute virtual coffee chat sometime in the next few weeks? I'd love to learn from your experience.

I completely understand if you're too busy, and I appreciate you reading this either way.

Thank you!
[Your Name]
[Your LinkedIn]
\`\`\`

### Why This Works:
- Shows you've done research
- Specific reason for reaching out
- Low time commitment ask
- No pressure
- Easy to say yes or no

### Response Rate Tips:
- Expect 10-20% response rate (that's normal!)
- Follow up once after 1 week if no response
- Don't take non-responses personally
- Cast a wide net

## The Informational Interview

When someone agrees to meet, make it count:

### Before the Meeting:
- Research them thoroughly (LinkedIn, company website, articles)
- Prepare 5-7 thoughtful questions
- Have a clear understanding of what you want to learn
- Be on time (or 2 minutes early for video calls)

### Questions to Ask:
1. "How did you get into [industry/role]? Was it what you expected?"
2. "What does a typical day/week look like in your role?"
3. "What skills are most important for success in this field?"
4. "What do you wish you knew when you were starting out?"
5. "Are there any resources (books, courses, communities) you'd recommend?"
6. "What's the most challenging part of your job?"
7. "How do you see the industry evolving in the next few years?"

### Don'ts for Informational Interviews:
- Don't ask for a job directly
- Don't go over time (respect the 15-20 minute commitment)
- Don't ask questions you could easily Google
- Don't dominate the conversation
- Don't forget to follow up

### After the Meeting:
- Send a thank-you email within 24 hours
- Connect on LinkedIn if you haven't already
- Keep them updated on your progress occasionally
- Be a resource to them if you can

## Networking at Events

### Before the Event:
- Research who'll be there (speakers, sponsors)
- Set a goal (e.g., have 3 meaningful conversations)
- Prepare your personal pitch
- Bring business cards if you have them

### During the Event:
- Arrive on time or slightly early
- Start with approachable people (smaller groups, people standing alone)
- Ask open-ended questions: "What brings you here?" "What's been the highlight of the conference?"
- Listen more than you talk
- Exchange contact information before parting
- Don't spend too long with one person (it's okay to move on)

### Conversation Starters:
- "I really enjoyed the speaker's point about [X]. What did you think?"
- "I noticed your company is working on [project]. How has that been?"
- "What's been keeping you busy at work lately?"

### Graceful Exits:
- "It was really nice meeting you. I should mingle a bit more, but let's connect on LinkedIn!"
- "I'm going to grab some food, but I'd love to continue this conversation. Can I get your card?"
- "I see someone I need to say hi to. Great chatting with you!"

## Maintaining Relationships

Networking is not a one-time activity. Maintain relationships:

### Stay in Touch:
- Share relevant articles or resources occasionally
- Congratulate them on LinkedIn updates
- Send holiday/new year messages
- Update them when you land the internship or have career news

### Be a Resource:
- Make introductions when you can
- Share opportunities that might interest them
- Offer to help with student perspectives or research

### Don't:
- Only reach out when you need something
- Spam with too-frequent messages
- Forget about people once you get what you wanted

## Networking Mistakes to Avoid

### Being Transactional
People can sense when you're only interested in what you can get. Build genuine relationships.

### Not Following Up
Meeting someone is just the beginning. The follow-up is where relationships are built.

### Only Networking Up
Connect with peers too. Your classmates today are future industry leaders tomorrow.

### Being Unprepared
Know who you're talking to and what you want to ask. Respect their time.

### Overselling Yourself
Let conversations flow naturally. Share your story when relevant, not in a pitch.

### Burning Bridges
Singapore is small. Never leave on bad terms. You never know who knows whom.

## For Introverts

Networking can be draining for introverts. Some tips:

- **Quality over quantity:** Focus on a few deep conversations
- **Use online networking:** LinkedIn outreach can be easier than events
- **Prepare talking points:** Having things to say reduces anxiety
- **Take breaks:** Step outside or to the bathroom to recharge
- **Follow up in writing:** You might express yourself better in email
- **Play to your strengths:** Listening is a networking superpower

## Key Takeaways

1. **Start early:** Don't wait until you need a job
2. **Be genuine:** People can tell when you're authentic
3. **Add value:** Ask how you can help, not just what you can get
4. **Follow up:** The fortune is in the follow-up
5. **Stay in touch:** Nurture relationships over time
6. **Be patient:** Networking is a long game

The best time to network is before you need it. Start building relationships today, and when opportunities arise, you'll have a community ready to support you.
    `
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find(article => article.slug === slug);
}

export function getAllArticles(): Article[] {
  return ARTICLES;
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter(article => article.category === category);
}

export function getRelatedArticles(slug: string): Article[] {
  const article = getArticleBySlug(slug);
  if (!article) return [];
  return article.relatedSlugs
    .map(relatedSlug => getArticleBySlug(relatedSlug))
    .filter((a): a is Article => a !== undefined);
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Interview Tips',
  'Resume Tips',
  'Career Advice',
  'Industry Insights'
];
