import { useState, useCallback } from "react";
import {
  ChevronLeft,
  Pencil,
  Save,
  Loader2,
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
import type {
  ResumeData,
  ResumePersonalInfo,
  ResumeExperienceEntry,
  ResumeEducationEntry,
  ResumeProjectEntry,
} from "@jobswyft/ui";
import { useResumeStore } from "../stores/resume-store";
import { useAuthStore } from "../stores/auth-store";

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
  const { activeResumeData, saveResumeData } = useResumeStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Full edit data clone (deep clone on enter edit)
  const [editData, setEditData] = useState<ResumeData | null>(null);

  const data = activeResumeData;

  const handleEnterEdit = useCallback(() => {
    if (data) {
      setEditData(JSON.parse(JSON.stringify(data)));
      setSaveError(null);
      setIsEditing(true);
    }
  }, [data]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditData(null);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editData || !accessToken) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveResumeData(accessToken, editData);
      setIsEditing(false);
      setEditData(null);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [editData, accessToken, saveResumeData]);

  // Section-level onChange handlers that update editData
  const handlePersonalInfoChange = useCallback(
    (field: keyof ResumePersonalInfo, value: string) => {
      setEditData((prev) =>
        prev
          ? { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }
          : prev
      );
    },
    []
  );

  const handleSkillsChange = useCallback((skills: string[]) => {
    setEditData((prev) => (prev ? { ...prev, skills } : prev));
  }, []);

  const handleExperienceChange = useCallback(
    (entries: ResumeExperienceEntry[]) => {
      setEditData((prev) => (prev ? { ...prev, experience: entries } : prev));
    },
    []
  );

  const handleEducationChange = useCallback(
    (entries: ResumeEducationEntry[]) => {
      setEditData((prev) => (prev ? { ...prev, education: entries } : prev));
    },
    []
  );

  const handleProjectsChange = useCallback(
    (entries: ResumeProjectEntry[]) => {
      setEditData((prev) => (prev ? { ...prev, projects: entries } : prev));
    },
    []
  );

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No resume data available.
      </div>
    );
  }

  // Use editData when editing, otherwise use store data
  const displayData = isEditing && editData ? editData : data;

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
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="size-3.5 mr-1.5" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleEnterEdit}
            >
              <Pencil className="size-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="mx-4 mt-2 px-3 py-2 bg-destructive/10 text-destructive text-xs rounded-md">
          {saveError}
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto bg-muted/5 scrollbar-hidden">
        <div className="p-4 space-y-6">
          {/* Personal Info */}
          <section>
            <SectionHeader icon={<User className="size-3" />} label="Personal Info" />
            <PersonalInfo
              data={displayData.personalInfo}
              isEditing={isEditing}
              onChange={handlePersonalInfoChange}
            />
          </section>

          <Separator />

          {/* Skills */}
          <section>
            <SectionHeader icon={<Wrench className="size-3" />} label="Skills" />
            <SkillsSection
              skills={displayData.skills}
              isEditing={isEditing}
              onChange={handleSkillsChange}
            />
          </section>

          {displayData.experience.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<Briefcase className="size-3" />}
                  label="Experience"
                />
                <ExperienceSection
                  entries={displayData.experience}
                  isEditing={isEditing}
                  onChange={handleExperienceChange}
                />
              </section>
            </>
          )}

          {displayData.education.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<GraduationCap className="size-3" />}
                  label="Education"
                />
                <EducationSection
                  entries={displayData.education}
                  isEditing={isEditing}
                  onChange={handleEducationChange}
                />
              </section>
            </>
          )}

          {displayData.certifications && displayData.certifications.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<Award className="size-3" />}
                  label="Certifications"
                />
                <CertificationsSection entries={displayData.certifications} />
              </section>
            </>
          )}

          {displayData.projects && displayData.projects.length > 0 && (
            <>
              <Separator />
              <section>
                <SectionHeader
                  icon={<FolderOpen className="size-3" />}
                  label="Projects"
                />
                <ProjectsSection
                  entries={displayData.projects}
                  isEditing={isEditing}
                  onChange={handleProjectsChange}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
