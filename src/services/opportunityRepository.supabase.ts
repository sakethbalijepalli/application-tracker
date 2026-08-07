import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewOpportunityInput, Opportunity, OpportunityPatch, OpportunityStatus } from "../models/opportunity";
import type { OpportunityRepository } from "./opportunityRepository";

interface OpportunityRow {
  id: string;
  user_id: string;
  instagram_url: string;
  caption_text: string;
  application_link: string;
  organization_name: string;
  deadline: string | null;
  performance_date: string | null;
  deadline_event_id: string | null;
  performance_event_id: string | null;
  status: OpportunityStatus;
  created_at: string;
}

export function rowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    instagramUrl: row.instagram_url,
    captionText: row.caption_text,
    applicationLink: row.application_link,
    organizationName: row.organization_name,
    deadline: row.deadline ?? undefined,
    performanceDate: row.performance_date ?? undefined,
    deadlineEventId: row.deadline_event_id ?? undefined,
    performanceEventId: row.performance_event_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function newOpportunityToRow(input: NewOpportunityInput, userId: string) {
  return {
    user_id: userId,
    instagram_url: input.instagramUrl,
    caption_text: input.captionText ?? "",
    application_link: input.applicationLink ?? "",
    organization_name: input.organizationName ?? "",
    deadline: input.deadline ?? null,
    performance_date: input.performanceDate ?? null,
  };
}

export function opportunityPatchToRow(patch: OpportunityPatch) {
  const row: Record<string, unknown> = {};
  if (patch.instagramUrl !== undefined) row.instagram_url = patch.instagramUrl;
  if (patch.captionText !== undefined) row.caption_text = patch.captionText;
  if (patch.applicationLink !== undefined) row.application_link = patch.applicationLink;
  if (patch.organizationName !== undefined) row.organization_name = patch.organizationName;
  if (patch.deadline !== undefined) row.deadline = patch.deadline ?? null;
  if (patch.performanceDate !== undefined) row.performance_date = patch.performanceDate ?? null;
  // null here means "clear this column" (an explicit patch action); undefined means "leave it
  // untouched" and is filtered out by the guard above — passing it straight through preserves
  // that distinction instead of collapsing null and undefined into the same null write.
  if (patch.deadlineEventId !== undefined) row.deadline_event_id = patch.deadlineEventId;
  if (patch.performanceEventId !== undefined) row.performance_event_id = patch.performanceEventId;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

const TABLE = "opportunities";

export class SupabaseOpportunityRepository implements OpportunityRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async list(): Promise<Opportunity[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as OpportunityRow[]).map(rowToOpportunity);
  }

  async create(input: NewOpportunityInput): Promise<Opportunity> {
    const {
      data: { user },
      error: userError,
    } = await this.client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Cannot create an opportunity while signed out.");

    const { data, error } = await this.client
      .from(TABLE)
      .insert(newOpportunityToRow(input, user.id))
      .select("*")
      .single();
    if (error) throw error;
    return rowToOpportunity(data as OpportunityRow);
  }

  async update(id: string, patch: OpportunityPatch): Promise<Opportunity> {
    const { data, error } = await this.client
      .from(TABLE)
      .update(opportunityPatchToRow(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToOpportunity(data as OpportunityRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }
}
