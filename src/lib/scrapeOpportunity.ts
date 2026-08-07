import { supabase } from "./supabaseClient";

export interface ScrapedOpportunityDetails {
  captionText: string;
  organizationName: string;
  applicationLink: string;
  deadline?: string;
  performanceDate?: string;
}

export async function scrapeOpportunityDetails(instagramUrl: string): Promise<ScrapedOpportunityDetails> {
  const { data, error } = await supabase.functions.invoke<ScrapedOpportunityDetails>("scrape-opportunity", {
    body: { instagramUrl },
  });
  if (error) throw error;
  if (!data) throw new Error("No data returned from scrape-opportunity.");
  return data;
}
