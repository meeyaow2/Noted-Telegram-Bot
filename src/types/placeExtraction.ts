/**
 * Contract for the future AI place-extraction step. Nothing implements this
 * yet; it exists so an `aiService` can be added later without reshaping the
 * rest of the codebase.
 *
 * Planned flow: messageHandler saves the link (as today), then calls
 * `extractPlace(...)` in the background and updates the saved row with the
 * result.
 */
export interface PlaceExtractionInput {
  url: string;
  messageText: string | null;
  pageMetadata?: {
    title?: string;
    description?: string;
    siteName?: string;
    imageUrl?: string;
  };
  videoCaption?: string;
}

export interface PlaceExtractionResult {
  place_name: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  tags: string[];
  confidence: number;
}

export type PlaceExtractor = (input: PlaceExtractionInput) => Promise<PlaceExtractionResult>;
