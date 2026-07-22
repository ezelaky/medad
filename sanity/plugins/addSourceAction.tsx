import { useCallback, useEffect, useState } from 'react';
import type { LayoutProps } from 'sanity';
import { useClient } from 'sanity';
import { Box, Button, Card, Dialog, Flex, Select, Stack, Text, TextInput, useToast } from '@sanity/ui';
import sourcesConfig from '../../sources.config.json';

// Structure Builder's menuItem() callbacks (see structure.ts) run outside
// any React tree — they're plain functions on a config builder, not
// components — so they can't hold dialog-open state themselves. This is a
// minimal pub-sub letting that callback signal AddSourceStudioLayout
// (mounted once, always, via sanity.config.ts's studio.components.layout)
// to open the dialog. No extra dependency: this is the same shape as any
// hand-rolled event emitter.
type Listener = () => void;
const listeners = new Set<Listener>();

export function openAddSourceDialog() {
  listeners.forEach((listener) => listener());
}

function useDialogOpenSignal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const listener = () => setOpen(true);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return [open, setOpen] as const;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Section options sourced from sources.config.json's `sections` map, same
// as contentInboxItem.ts's field options — keeps this dropdown in sync
// with that single config file automatically instead of hardcoding it here.
const SECTION_OPTIONS = Object.entries(sourcesConfig.sections).map(([value, section]) => ({
  value,
  title: (section as { label: string }).label,
}));

function AddSourceDialog({ onClose }: { onClose: () => void }) {
  const client = useClient({ apiVersion: '2026-01-01' });
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [section, setSection] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('أدخل رابط المقال');
      return;
    }
    if (!section) {
      setError('اختر القسم');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const domain = extractDomain(trimmedUrl);
      const resolvedSourceName = sourceName.trim() || domain;
      await client.create({
        _type: 'contentInboxItem',
        title: resolvedSourceName,
        sourceUrl: trimmedUrl,
        section,
        sourceName: resolvedSourceName,
        excerpt: '',
        guid: trimmedUrl,
        fetchedAt: new Date().toISOString(),
        // Skips triage entirely — the existing Sanity webhook fires on
        // status == "approved" the same way it does for a pipeline item an
        // editor approves manually, so phase2-enrich.yml picks this up
        // with no extra wiring.
        status: 'approved',
      });
      toast.push({ status: 'success', title: 'تمت الإضافة — جارٍ معالجة المقال' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }, [url, section, sourceName, client, toast, onClose]);

  return (
    <Dialog id="add-source-dialog" header="إضافة مصدر جديد" onClose={onClose} width={1}>
      <Box padding={4}>
        <Stack space={4}>
          <Stack space={2}>
            <Text size={1} weight="medium">رابط المقال</Text>
            <TextInput value={url} onChange={(e) => setUrl(e.currentTarget.value)} placeholder="https://..." autoFocus />
          </Stack>
          <Stack space={2}>
            <Text size={1} weight="medium">القسم</Text>
            <Select value={section} onChange={(e) => setSection(e.currentTarget.value)}>
              <option value="">اختر القسم</option>
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.title}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack space={2}>
            <Text size={1} weight="medium">المصدر</Text>
            <TextInput
              value={sourceName}
              onChange={(e) => setSourceName(e.currentTarget.value)}
              placeholder="مثال: Literary Hub"
            />
          </Stack>
          {error && (
            <Card padding={3} radius={2} tone="critical">
              <Text size={1}>{error}</Text>
            </Card>
          )}
          <Flex justify="flex-end" gap={2}>
            <Button mode="ghost" text="إلغاء" onClick={onClose} disabled={submitting} />
            <Button tone="primary" text={submitting ? 'جارٍ الإضافة...' : 'إضافة'} onClick={handleSubmit} disabled={submitting} />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  );
}

// Registered as studio.components.layout in sanity.config.ts — this wraps
// every Studio screen, so the dialog is available regardless of which
// pane is open when the "إضافة مصدر جديد" button (in the صندوق الوارد
// list, see structure.ts) is clicked.
export function AddSourceStudioLayout(props: LayoutProps) {
  const [open, setOpen] = useDialogOpenSignal();
  return (
    <>
      {props.renderDefault(props)}
      {open && <AddSourceDialog onClose={() => setOpen(false)} />}
    </>
  );
}
