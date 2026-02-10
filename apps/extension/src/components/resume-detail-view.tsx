import { useState, useCallback } from "react";
import {
  ChevronLeft,
  Pencil,
  Save,
  User,
  Wrench,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
} from "lucide-react";
import {
  Button,
  Badge,
  Separator,
  PersonalInfo,
  SkillsSection,
  ExperienceSection,
  EducationSection,
  CertificationsSection,
  ProjectsSection,
} from "@jobswyft/ui";
import type { ResumePersonalInfo } from "@jobswyft/ui";
import { useResumeStore } from "../stores/resume-store";

interface ResumeDetailViewProps {
  onClose: () => void;
}

/** V4-style section header with icon badge */
function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
      <span className="bg-primary/10 text-primary p-1 rounded">{icon}</span>
      {label}
    </h3>
  );
}

export function ResumeDetailView({ onClose }: ResumeDetailViewProps) {
  const { activeResumeData, updateLocalResumeData } = useResumeStore();
  const [isEditing, setIsEditing] = useState(false);

  // Local edit copies (only PersonalInfo + Skills are editable)
  const [editPersonalInfo, setEditPersonalInfo] =
    useState<ResumePersonalInfo | null>(null);
  const [editSkills, setEditSkills] = useState<string[] | null>(null);

  const data = activeResumeData;

  const handleToggleEdit = useCallback(() => {
    if (isEditing) {
      // Save: merge edits into store
      const updates: Record<string, unknown> = {};
      if (editPersonalInfo) updates.personalInfo = editPersonalInfo;
      if (editSkills) updates.skills = editSkills;
      if (Object.keys(updates).length > 0) {
        updateLocalResumeData(updates);
      }
      setIsEditing(false);
      setEditPersonalInfo(null);
      setEditSkills(null);
    } else {
      // Enter edit: snapshot current data
      if (data) {
        setEditPersonalInfo({ ...data.personalInfo });
        setEditSkills([...data.skills]);
      }
      setIsEditing(true);
    }
  }, [isEditing, data, editPersonalInfo, editSkills, updateLocalResumeData]);

  const handlePersonalInfoChange = useCallback(
    (field: keyof ResumePersonalInfo, value: string) => {
      setEditPersonalInfo((prev) =>
        prev ? { ...prev, [field]: value } : prev
      );
    },
    []
  );

  const handleSkillsChange = useCallback((skills: string[]) => {
    setEditSkills(skills);
  }, []);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No resume data available.
      </div>
    );
  }

  const personalInfo =
    isEditing && editPersonalInfo ? editPersonalInfo : data.personalInfo;
  const skills = isEditing && editSkills ? editSkills : data.skills;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground shrink-0"
            onClick={onClose}
            aria-label="Back"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate flex items-center gap-2">
              {data.fileName ?? "Resume"}
              {!isEditing && (
                <Badge
                  variant="secondary"
                  className="text-micro font-normal bg-muted text-muted-foreground"
                >
                  Read-Only
                </Badge>
              )}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setIsEditing(false);
                  setEditPersonalInfo(null);
                  setEditSkills(null);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={handleToggleEdit}>
                <Save className="size-3.5 mr-1.5" />
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleToggleEdit}
            >
              <Pencil className="size-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto bg-muted/5 scrollbar-hidden">
        <div className="p-4 space-y-6">
          {/* Personal Info */}
          <section>
            <SectionHeader icon={<User className="size-3" />} label="Personal Info" />
            <PersonalInfo
              data={personalInfo}
              isEditing={isEditing}
              onChange={handlePersonalInfoChange}
            />
          </section>

          <Separator />

          {/* Skills */}
          <section>
            <SectionHeader icon={<Wrench className="size-3" />} label="Skills" />
            <SkillsSection
              skills={skills}
              isEditing={isEditing}
              onChange={handleSkillsChange}
            />
          </section>

          {data.experience.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<Briefcase className="size-3" />}
                  label="Experience"
                />
                <ExperienceSection entries={data.experience} />
              </section>
            </>
          )}

          {data.education.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<GraduationCap className="size-3" />}
                  label="Education"
                />
                <EducationSection entries={data.education} />
              </section>
            </>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<Award className="size-3" />}
                  label="Certifications"
                />
                <CertificationsSection entries={data.certifications} />
              </section>
            </>
          )}

          {data.projects && data.projects.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<FolderOpen className="size-3" />}
                  label="Projects"
                />
                <ProjectsSection entries={data.projects} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
