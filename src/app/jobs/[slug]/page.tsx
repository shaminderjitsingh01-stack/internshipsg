import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components';
import { getJobBySlug, getJobs } from '@/lib/mockData';
import ShareButton from './ShareButton';
import JobDetailClient from './JobDetailClient';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);

  if (!job) {
    return {
      title: 'Job Not Found | internship.sg',
      description: 'The internship you are looking for could not be found.',
    };
  }

  const salaryRange = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}/month`
    : null;

  return {
    title: `${job.title} at ${job.company?.name} | internship.sg`,
    description: `${job.title} internship at ${job.company?.name} in ${job.location}. ${job.duration ? `Duration: ${job.duration}.` : ''} ${salaryRange ? `Salary: ${salaryRange}.` : ''} Apply now on internship.sg`,
    openGraph: {
      title: `${job.title} at ${job.company?.name}`,
      description: job.description?.substring(0, 200) || `Internship opportunity at ${job.company?.name}`,
      type: 'website',
    },
  };
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  // Get similar jobs (same company or similar title keywords)
  const allJobs = getJobs();
  const similarJobs = allJobs
    .filter(j => j.id !== job.id && (
      j.company_id === job.company_id ||
      j.title.toLowerCase().includes(job.title.split(' ')[0].toLowerCase())
    ))
    .slice(0, 3);

  const salaryRange = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
    : job.salary_min
    ? `From $${job.salary_min.toLocaleString()}`
    : job.salary_max
    ? `Up to $${job.salary_max.toLocaleString()}`
    : null;

  const postedDate = getRelativeTime(job.posted_at);

  // Nice to have items (simulated - in real app would come from data)
  const niceToHave = [
    'Previous internship experience',
    'Portfolio or GitHub profile',
    'Strong passion for the industry',
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Button */}
          <JobDetailClient
            job={job}
            salaryRange={salaryRange}
            postedDate={postedDate}
            niceToHave={niceToHave}
            similarJobs={similarJobs}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
