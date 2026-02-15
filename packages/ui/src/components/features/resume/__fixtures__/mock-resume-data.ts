import type { ResumeData, ResumeSummary } from "../resume-card"

// ─── Resume Summaries ────────────────────────────────────────────────

export const mockResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Marcus_Chen_EM_2026.pdf" },
  { id: "resume-3", fileName: "Jenna_Morales_Resume.pdf" },
]

export const fiveResumes: ResumeSummary[] = [
  { id: "resume-1", fileName: "Marcus_Chen_SWE_2026.pdf" },
  { id: "resume-2", fileName: "Marcus_Chen_EM_2026.pdf" },
  { id: "resume-3", fileName: "Jenna_Morales_Resume.pdf" },
  { id: "resume-4", fileName: "David_Okonkwo_VP_Eng.pdf" },
  { id: "resume-5", fileName: "Aisha_Patel_Marketing.pdf" },
]

// ─── Full Resume Data ────────────────────────────────────────────────

export const fullResumeData: ResumeData = {
  id: "resume-1",
  fileName: "Marcus_Chen_SWE_2026.pdf",
  personalInfo: {
    fullName: "Marcus Chen",
    email: "marcus.chen@email.com",
    phone: "+1 (415) 555-0192",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/marcuschen",
    website: "marcuschen.dev",
  },
  skills: [
    "TypeScript", "React", "Node.js", "Python", "PostgreSQL", "AWS",
    "Docker", "Kubernetes", "GraphQL", "Redis", "CI/CD", "System Design",
    "Team Leadership", "Agile", "Next.js", "FastAPI", "Tailwind CSS",
  ],
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      startDate: "Jan 2023",
      endDate: "Present",
      description:
        "Led development of the core platform serving 2M+ daily active users. Managed a team of 5 engineers and drove architecture decisions for the microservices migration. Implemented comprehensive monitoring and alerting that reduced incident response time by 40%.",
      highlights: [
        "Reduced API response time by 60% through Redis caching and query optimization",
        "Led migration from monolith to microservices, improving deployment frequency 4x",
        "Mentored 3 junior developers, 2 of whom were promoted to mid-level",
        "Architected event-driven notification system handling 10M+ daily events",
        "Introduced automated integration testing pipeline reducing QA cycle from 3 days to 4 hours",
        "Led cross-team initiative to standardize API contracts across 12 microservices",
      ],
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      startDate: "Jun 2020",
      endDate: "Dec 2022",
      description:
        "Full-stack engineer on the payments platform team.",
      highlights: [
        "Built payment reconciliation system handling 100K+ daily transactions",
        "Designed and implemented PCI-compliant checkout flow",
      ],
    },
    {
      title: "Junior Developer",
      company: "WebAgency Co",
      startDate: "Aug 2018",
      endDate: "May 2020",
      description:
        "Developed responsive web applications for clients across finance and e-commerce.",
      highlights: [
        "Delivered 12+ client projects on time and within budget",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of California, Berkeley",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  certifications: [
    { name: "AWS Solutions Architect Professional", issuer: "Amazon Web Services", date: "2024" },
    { name: "Kubernetes Administrator (CKA)", issuer: "CNCF", date: "2023" },
  ],
  projects: [
    {
      name: "OpenTrace",
      description:
        "Open-source distributed tracing library for Node.js microservices.",
      techStack: ["TypeScript", "Node.js", "OpenTelemetry", "Grafana", "Docker"],
      url: "github.com/marcuschen/opentrace",
    },
    {
      name: "JobFlow CLI",
      description:
        "Command-line tool for automating job application tracking.",
      techStack: ["Python", "Click", "SQLite", "Rich"],
    },
  ],
}

// ─── Minimal Resume Data ─────────────────────────────────────────────

export const minimalResumeData: ResumeData = {
  id: "resume-3",
  fileName: "Jenna_Morales_Resume.pdf",
  personalInfo: {
    fullName: "Jenna Morales",
    email: "jenna.m@university.edu",
    phone: "+1 (555) 123-4567",
    location: "Austin, TX",
  },
  skills: ["Python", "Java", "SQL", "Git", "React"],
  experience: [
    {
      title: "Software Engineering Intern",
      company: "FinTech Solutions",
      startDate: "Jun 2025",
      endDate: "Aug 2025",
      description:
        "Developed features for the mobile banking application used by 500K+ users.",
      highlights: [
        "Built peer-to-peer payment simulator as capstone project",
        "Implemented unit tests achieving 85% code coverage",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      school: "University of Texas at Austin",
      startDate: "2022",
      endDate: "2026",
    },
  ],
}
