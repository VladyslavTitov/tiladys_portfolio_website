'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';

const locales = ['en', 'de', 'uk', 'ru', 'sk', 'fr'] as const;
type Locale = (typeof locales)[number];
type Localized = Record<Locale, string>;
type ImageInfo = { id: string; filename: string; size: number; sortOrder: number; url: string };
type Project = {
  id?: string;
  slug: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  sortOrder: number;
  title: Localized;
  summary: Localized;
  description: Localized;
  type: Localized;
  role: Localized;
  workItems: Record<Locale, string[]>;
  websiteUrl: string;
  githubUrl: string;
  coverImage: string;
  technologies: string[];
  projectDate: string | null;
  images: ImageInfo[];
};

const MAX_IMAGES = 10;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const emptyLocalized = (): Localized => ({ en: '', de: '', uk: '', ru: '', sk: '', fr: '' });
const emptyWork = (): Record<Locale, string[]> => ({ en: [], de: [], uk: [], ru: [], sk: [], fr: [] });

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function normalizeOptionalHttpUrl(value: string, label: string, allowRelative = false) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid HTTP or HTTPS address.`);
  }
}

function projectApiError(payload: Record<string, unknown>, status: number) {
  if (payload.error === 'PROJECT_SLUG_EXISTS') return 'This slug is already used. Choose a different slug.';
  if (payload.error === 'UNAUTHORIZED') return 'Your admin session expired. Sign in again and retry.';
  if (payload.error === 'INVALID_ORIGIN') return 'The admin URL does not match CONTROL_URL in apps/control/.env.local.';

  const details = asRecord(payload.details);
  if (Array.isArray(details.issues)) {
    const issues = details.issues
      .map((value) => {
        const issue = asRecord(value);
        const path = typeof issue.path === 'string' && issue.path ? `${issue.path}: ` : '';
        return typeof issue.message === 'string' ? `${path}${issue.message}` : '';
      })
      .filter(Boolean);
    if (issues.length) return issues.join(' ');
  }

  const fieldErrors = asRecord(details.fieldErrors);
  const errors = Object.entries(fieldErrors).flatMap(([field, value]) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => `${field}: ${item}`) : [],
  );
  if (errors.length) return errors.join(' ');
  if (typeof payload.error === 'string') return payload.error;
  return `The server returned HTTP ${status}.`;
}

function emptyProject(): Project {
  return {
    slug: '', category: 'web-development', status: 'DRAFT', featured: false, sortOrder: 0,
    title: emptyLocalized(), summary: emptyLocalized(), description: emptyLocalized(), type: emptyLocalized(), role: emptyLocalized(), workItems: emptyWork(),
    websiteUrl: '', githubUrl: '', coverImage: '', technologies: [], projectDate: null, images: [],
  };
}

function localized(value: unknown): Localized {
  const data = value && typeof value === 'object' ? value as Partial<Localized> : {};
  return { en: data.en ?? '', de: data.de ?? '', uk: data.uk ?? '', ru: data.ru ?? '', sk: data.sk ?? '', fr: data.fr ?? '' };
}

function normalize(project: Record<string, unknown>): Project {
  const base = emptyProject();
  const work = project.workItems && typeof project.workItems === 'object' ? project.workItems as Partial<Record<Locale, string[]>> : {};
  return {
    ...base,
    ...project,
    title: localized(project.title),
    summary: localized(project.summary),
    description: localized(project.description),
    type: localized(project.type),
    role: localized(project.role),
    workItems: { ...emptyWork(), ...work },
    technologies: Array.isArray(project.technologies) ? project.technologies.filter((item): item is string => typeof item === 'string') : [],
    websiteUrl: typeof project.websiteUrl === 'string' ? project.websiteUrl : '',
    githubUrl: typeof project.githubUrl === 'string' ? project.githubUrl : '',
    coverImage: typeof project.coverImage === 'string' ? project.coverImage : '',
    projectDate: typeof project.projectDate === 'string' ? project.projectDate : null,
    images: Array.isArray(project.images) ? project.images as ImageInfo[] : [],
  } as Project;
}

function PendingImage({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <figure>{url ? <img src={url} alt={file.name} /> : null}<figcaption>{file.name}<button type="button" title="Remove new image" onClick={onRemove}><X size={16} /></button></figcaption></figure>;
}

export function ProjectManager({ initialProjects }: { initialProjects: Array<Record<string, unknown>> }) {
  const normalizedInitial = useMemo(() => initialProjects.map(normalize), [initialProjects]);
  const [projects, setProjects] = useState<Project[]>(normalizedInitial);
  const [selectedId, setSelectedId] = useState<string | 'new'>(normalizedInitial[0]?.id ?? 'new');
  const [draft, setDraft] = useState<Project>(() => normalizedInitial[0] ?? emptyProject());
  const [language, setLanguage] = useState<Locale>('en');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const visibleImages = useMemo(() => draft.images.filter((image) => !removeImageIds.includes(image.id)), [draft.images, removeImageIds]);

  function select(project?: Project) {
    setSelectedId(project?.id ?? 'new');
    setDraft(project ? normalize(project as unknown as Record<string, unknown>) : emptyProject());
    setNewImages([]);
    setRemoveImageIds([]);
    setMessage('');
  }

  function setLocalized(field: 'title' | 'summary' | 'description' | 'type' | 'role', value: string) {
    setDraft((current) => ({ ...current, [field]: { ...current[field], [language]: value } }));
  }

  function updateWork(value: string) {
    setDraft((current) => ({ ...current, workItems: { ...current.workItems, [language]: value.split('\n').map((line) => line.trim()).filter(Boolean) } }));
  }

  function addImages(files: File[]) {
    const accepted: File[] = [];
    for (const file of files) {
      if (!acceptedTypes.has(file.type)) {
        setMessage(`${file.name}: only JPG, PNG, WebP and AVIF are supported.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setMessage(`${file.name}: the file is larger than 4 MB.`);
        continue;
      }
      accepted.push(file);
    }
    const remaining = Math.max(0, MAX_IMAGES - visibleImages.length - newImages.length);
    setNewImages((current) => [...current, ...accepted.slice(0, remaining)]);
    if (accepted.length > remaining) setMessage(`Only ${MAX_IMAGES} images can be stored for one project.`);
  }

  async function save() {
    if (!draft.slug.trim() || !draft.title.en.trim() || !draft.summary.en.trim()) {
      setMessage('Slug, English title and English summary are required.');
      return;
    }
    if (visibleImages.length + newImages.length > MAX_IMAGES) {
      setMessage(`A project can contain no more than ${MAX_IMAGES} images.`);
      return;
    }
    if (draft.status === 'PUBLISHED' && !draft.coverImage.trim() && visibleImages.length + newImages.length < 1) {
      setMessage('A published project needs at least one uploaded image or an external cover image.');
      return;
    }

    let payload: Record<string, unknown>;
    try {
      payload = {
        slug: draft.slug.trim(),
        category: draft.category,
        status: draft.status,
        featured: draft.featured,
        sortOrder: Number(draft.sortOrder) || 0,
        title: draft.title,
        summary: draft.summary,
        description: draft.description,
        type: draft.type,
        role: draft.role,
        workItems: draft.workItems,
        websiteUrl: normalizeOptionalHttpUrl(draft.websiteUrl, 'Website URL'),
        githubUrl: normalizeOptionalHttpUrl(draft.githubUrl, 'GitHub URL'),
        coverImage: normalizeOptionalHttpUrl(draft.coverImage, 'Cover image URL', true),
        technologies: draft.technologies,
        projectDate: draft.projectDate ? new Date(`${draft.projectDate.slice(0, 10)}T12:00:00.000Z`).toISOString() : '',
      };
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please check the project fields.');
      return;
    }

    setBusy(true);
    setMessage('Saving project information…');
    let uploadedCount = 0;
    try {
      const metadataResponse = await fetch(draft.id ? `/api/admin/projects/${draft.id}` : '/api/admin/projects', {
        method: draft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft.id ? { payload, removeImageIds } : payload),
      });
      const metadataResult: unknown = await metadataResponse.json().catch(() => ({}));
      const metadata = asRecord(metadataResult);
      if (!metadataResponse.ok) {
        throw new Error(projectApiError(metadata, metadataResponse.status));
      }
      if (typeof metadata.id !== 'string' || !metadata.id) throw new Error('The server did not return a project ID.');

      const projectId = metadata.id;
      const existing = Array.isArray(metadata.images)
        ? metadata.images.map((value) => {
            const image = asRecord(value);
            const id = typeof image.id === 'string' ? image.id : '';
            return {
              id,
              filename: typeof image.filename === 'string' ? image.filename : 'project-image',
              size: typeof image.size === 'number' ? image.size : 0,
              sortOrder: typeof image.sortOrder === 'number' ? image.sortOrder : 0,
              url: typeof image.url === 'string' ? image.url : `/api/public/media/${id}`,
            } satisfies ImageInfo;
          }).filter((image) => image.id)
        : [];

      let updated = normalize({ ...draft, ...metadata, id: projectId, images: existing });
      const storeProject = (project: Project) => {
        setProjects((current) => current.some((item) => item.id === projectId)
          ? current.map((item) => item.id === projectId ? project : item)
          : [...current, project]);
        setDraft(project);
        setSelectedId(projectId);
      };

      // Store metadata immediately so a later image-upload error never leaves a new project as an unsaved draft.
      storeProject(updated);
      setRemoveImageIds([]);

      const uploaded: ImageInfo[] = [];
      for (let index = 0; index < newImages.length; index += 1) {
        setMessage(`Uploading image ${index + 1} of ${newImages.length}…`);
        const form = new FormData();
        form.set('image', newImages[index]);
        const uploadResponse = await fetch(`/api/admin/projects/${projectId}/images`, { method: 'POST', body: form });
        const imageResult: unknown = await uploadResponse.json().catch(() => ({}));
        const image = asRecord(imageResult);
        if (!uploadResponse.ok) throw new Error(`${newImages[index].name}: ${typeof image.error === 'string' ? image.error : uploadResponse.status}`);
        if (typeof image.id !== 'string' || typeof image.url !== 'string') throw new Error(`${newImages[index].name}: unexpected upload response`);
        uploaded.push({
          id: image.id,
          url: image.url,
          filename: typeof image.filename === 'string' ? image.filename : newImages[index].name,
          size: typeof image.size === 'number' ? image.size : newImages[index].size,
          sortOrder: typeof image.sortOrder === 'number' ? image.sortOrder : existing.length + uploaded.length,
        });
        uploadedCount = index + 1;
        updated = normalize({ ...updated, images: [...existing, ...uploaded] });
        storeProject(updated);
      }

      setNewImages([]);
      setMessage('Project saved. Public pages update immediately when the status is Published.');
    } catch (error) {
      if (uploadedCount > 0) setNewImages((files) => files.slice(uploadedCount));
      setMessage(`Could not finish saving: ${error instanceof Error ? error.message : 'Unknown error'}. Any images already uploaded were kept.`);
    } finally {
      setBusy(false);
    }
  }

  async function removeProject() {
    if (!draft.id || !window.confirm(`Delete “${draft.title.en || draft.slug}”? This also deletes all project images.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/projects/${draft.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const remaining = projects.filter((project) => project.id !== draft.id);
      setProjects(remaining);
      const next = remaining[0];
      setSelectedId(next?.id ?? 'new');
      setDraft(next ? normalize(next as unknown as Record<string, unknown>) : emptyProject());
      setNewImages([]);
      setRemoveImageIds([]);
      setMessage('Project deleted.');
    } catch {
      setMessage('Could not delete project.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="project-admin-layout">
      <aside className="project-admin-list panel">
        <button className="admin-primary" type="button" onClick={() => select()}><Plus size={18} />New project</button>
        {projects.map((project) => <button key={project.id} className={selectedId === project.id ? 'is-active' : ''} type="button" onClick={() => select(project)}><strong>{project.title.en || project.slug}</strong><span>{project.category} · {project.status}</span></button>)}
      </aside>

      <section className="panel project-editor">
        <div className="project-editor__toolbar"><h2>{draft.id ? 'Edit project' : 'New project'}</h2><div><button type="button" className="admin-secondary" onClick={removeProject} disabled={!draft.id || busy}><Trash2 size={17} />Delete</button><button type="button" className="admin-primary" onClick={save} disabled={busy}><Save size={17} />Save project</button></div></div>
        {message ? <p className="admin-message project-save-message" aria-live="polite">{message}</p> : null}
        <div className="admin-form-grid">
          <label>Slug<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') })} placeholder="business-website-redesign" /></label>
          <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option value="web-development">Web development</option><option value="pc-support">PC support</option><option value="design">Design</option><option value="linux-servers">Linux & servers</option><option value="google-business">Google Business</option><option value="digital-support">Digital support</option><option value="data-protection">Backup & data protection</option><option value="other">Other</option></select></label>
          <label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Project['status'] })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
          <label>Display order<input type="number" min="0" value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} /></label>
          <label>Completed date<input type="date" value={draft.projectDate?.slice(0, 10) ?? ''} onChange={(event) => setDraft({ ...draft, projectDate: event.target.value || null })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Featured project</label>
          <label>Website URL<input type="url" value={draft.websiteUrl} onChange={(event) => setDraft({ ...draft, websiteUrl: event.target.value })} placeholder="https://..." /></label>
          <label>GitHub URL<input type="url" value={draft.githubUrl} onChange={(event) => setDraft({ ...draft, githubUrl: event.target.value })} placeholder="https://github.com/..." /></label>
          <label className="admin-span-2">External cover image URL (optional)<input type="url" value={draft.coverImage} onChange={(event) => setDraft({ ...draft, coverImage: event.target.value })} placeholder="Used only when no uploaded image exists" /></label>
          <label className="admin-span-2">Technologies & tools (comma separated)<input value={draft.technologies.join(', ')} onChange={(event) => setDraft({ ...draft, technologies: event.target.value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 30) })} placeholder="Next.js, React, TypeScript, PostgreSQL" /></label>
        </div>

        <div className="translation-tabs" role="tablist" aria-label="Project translation language">{locales.map((locale) => <button type="button" role="tab" aria-selected={language === locale} key={locale} className={language === locale ? 'is-active' : ''} onClick={() => setLanguage(locale)}>{locale.toUpperCase()}</button>)}</div>
        <div className="admin-form-grid project-translations">
          <label>Title ({language.toUpperCase()})<input value={draft.title[language]} onChange={(event) => setLocalized('title', event.target.value)} /></label>
          <label>Project type ({language.toUpperCase()})<input value={draft.type[language]} onChange={(event) => setLocalized('type', event.target.value)} placeholder="Business website, PC upgrade…" /></label>
          <label className="admin-span-2">Short summary<textarea rows={3} value={draft.summary[language]} onChange={(event) => setLocalized('summary', event.target.value)} /></label>
          <label className="admin-span-2">Full project description<textarea rows={6} value={draft.description[language]} onChange={(event) => setLocalized('description', event.target.value)} /></label>
          <label className="admin-span-2">Your role<textarea rows={2} value={draft.role[language]} onChange={(event) => setLocalized('role', event.target.value)} /></label>
          <label className="admin-span-2">What you did — one item per line<textarea rows={7} value={draft.workItems[language].join('\n')} onChange={(event) => updateWork(event.target.value)} /></label>
        </div>

        <section className="project-images-admin">
          <div className="project-images-admin__heading"><div><h3>Project images</h3><p>Upload JPG, PNG, WebP or AVIF. Maximum 10 images, 4 MB each. Files are uploaded separately to avoid serverless request-size errors. The first image is used as the cover.</p></div><label className="admin-upload"><ImagePlus size={18} />Add images<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => { addImages(Array.from(event.target.files ?? [])); event.currentTarget.value = ''; }} /></label></div>
          <div className="project-images-admin__grid">
            {visibleImages.map((image) => <figure key={image.id}><img src={image.url} alt={image.filename} /><figcaption>{image.filename}<button type="button" title="Remove image" onClick={() => setRemoveImageIds((ids) => ids.includes(image.id) ? ids : [...ids, image.id])}><X size={16} /></button></figcaption></figure>)}
            {newImages.map((file, index) => <PendingImage key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => setNewImages((files) => files.filter((_, itemIndex) => itemIndex !== index))} />)}
          </div>
        </section>
      </section>
    </div>
  );
}
