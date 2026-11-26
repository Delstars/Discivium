import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApiError } from '../../lib/apiClient';
import type { CourseItem } from '../../types/api';
import { formatIsoDateTimeUae } from '../../lib/formatters';
import { EmptyState, ErrorBanner, Field, Modal, SectionCard, inputClass, primaryBtnClass, secondaryBtnClass } from '../ui/Primitives';

export function LecturerResources({ course, active, resOpen, setResOpen }: { course: CourseItem; active: boolean; resOpen: boolean; setResOpen: (value: boolean) => void }) {
  const { executeUpload, executeDownload } = useApp();
  const [resTitle, setResTitle] = useState('');
  const [resFile, setResFile] = useState<File | null>(null);
  const [resBusy, setResBusy] = useState(false);
  const [resProgress, setResProgress] = useState<number | null>(null);
  const [resError, setResError] = useState<string | null>(null);

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resFile) {
      setResError('Provide a resource title and select a PDF or DOCX file.');
      return;
    }
    setResError(null);
    setResBusy(true);
    setResProgress(0);
    try {
      const formData = new FormData();
      formData.append('course_id', String(course.id));
      formData.append('title', resTitle.trim());
      formData.append('file', resFile);
      await executeUpload(
        'resource',
        formData,
        (pct) => setResProgress(pct),
        `Published course resource "${resTitle.trim()}".`
      );
      setResTitle('');
      setResFile(null);
      setResProgress(null);
      setResOpen(false);
    } catch (err) {
      setResError(err instanceof ApiError ? err.message : 'Resource upload failed.');
    } finally {
      setResBusy(false);
    }
  };
  return (<>
      {/* Tab 2: Course Resources */}
      {active && (
        <SectionCard
          title="Published Course Resources"
          subtitle="PDF and DOCX documents available to students enrolled in this course."
          action={
            <button
              type="button"
              onClick={() => {
                setResError(null);
                setResOpen(true);
              }}
              className={primaryBtnClass}
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              Publish Resource
            </button>
          }
        >
          {course.resources.length === 0 ? (
            <EmptyState
              title="No resources published"
              description="Upload PDF or DOCX lecture slides, reading packets, or specifications."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {course.resources.map((res) => (
                <div
                  key={res.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{res.title}</p>
                    <p className="text-xs font-mono text-[var(--ink-muted)] mt-0.5">
                      {res.filename} · {formatIsoDateTimeUae(res.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      executeDownload(`/api/resource-download?id=${res.id}`, res.filename)
                    }
                    className={secondaryBtnClass}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
      {/* Modal: Publish Resource */}
      <Modal
        open={resOpen}
        onClose={() => {
          if (!resBusy) setResOpen(false);
        }}
        title={`Publish Course Resource — ${course.code}`}
        subtitle="Upload a PDF or DOCX document for enrolled students."
      >
        <form onSubmit={handleUploadResource} className="space-y-4">
          {resError && <ErrorBanner message={resError} />}
          <Field id="res-title" label="Resource Title" required>
            <input
              id="res-title"
              type="text"
              maxLength={150}
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="e.g. Week 06 Lecture Notes — Layered Monoliths"
              className={inputClass}
              disabled={resBusy}
            />
          </Field>

          <Field id="res-file" label="PDF or DOCX File (max 100 MB)" required>
            <input
              id="res-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setResFile(e.target.files?.[0] ?? null)}
              disabled={resBusy}
              className="block w-full text-xs text-[var(--ink-secondary)] file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border file:border-[var(--border-strong)] file:bg-[var(--surface-subtle)] file:text-xs file:font-semibold file:text-[var(--ink)]"
            />
          </Field>

          {resBusy && (
            <div className="space-y-1.5" role="status">
              <div className="flex justify-between text-xs text-[var(--ink-secondary)]">
                <span>Uploading resource…</span>
                <span className="font-mono tabular-nums">
                  {resProgress !== null ? `${resProgress}%` : 'Working'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div
                  className={`h-full bg-[var(--accent)] ${
                    resProgress === null ? 'w-1/2 animate-pulse' : ''
                  }`}
                  style={resProgress !== null ? { width: `${resProgress}%` } : undefined}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={resBusy}
              onClick={() => setResOpen(false)}
              className={secondaryBtnClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={resBusy || !resFile} className={primaryBtnClass}>
              {resBusy ? 'Publishing…' : 'Publish Resource'}
            </button>
          </div>
        </form>
      </Modal>
  </>);
}
