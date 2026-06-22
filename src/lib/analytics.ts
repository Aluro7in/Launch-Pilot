export type AnalyticsEvent =
  | { name: 'homepage_viewed' }
  | { name: 'example_brief_used'; properties: { briefId: number; title: string } }
  | { name: 'launch_pack_generation_started'; properties: Record<string, any> }
  | { name: 'launch_pack_generation_completed'; properties: { durationMs: number; success: boolean } }
  | { name: 'section_regenerated'; properties: { sectionId: string } }
  | { name: 'section_copied'; properties: { sectionId: string } }
  | { name: 'export_clicked'; properties: { format: string } }
  | { name: 'assistant_opened' }
  | { name: 'assistant_message_sent'; properties: { messageLength: number; hasDocContext: boolean } }
  | { name: 'assistant_response_received'; properties: { durationMs: number; success: boolean } }
  | { name: 'assistant_file_uploaded'; properties: { fileType: string; fileSizeKb: number } }
  | { name: 'assistant_voice_used' }
  | { name: 'assistant_inserted_into_brief'; properties: { textLength: number } };

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window !== 'undefined') {
    // Log to console for dev validation as requested
    console.log(`[Novus Analytics] Event: ${event.name}`, 'properties' in event ? event.properties : {});

    const novus = (window as any).novus || (window as any).Novus;
    if (novus && typeof novus.track === 'function') {
      try {
        novus.track(event.name, 'properties' in event ? event.properties : {});
      } catch (err) {
        console.error('Error tracking Novus event', err);
      }
    }
  }
}
