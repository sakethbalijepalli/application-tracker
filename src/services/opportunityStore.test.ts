import { describe, expect, it } from "vitest";
import { FakeOpportunityRepository } from "./opportunityRepository.fake";
import { OpportunityStore } from "./opportunityStore";

describe("OpportunityStore", () => {
  it("load fetches opportunities from the repository and exposes them", async () => {
    const repository = new FakeOpportunityRepository();
    await repository.create({ instagramUrl: "https://instagram.com/p/abc" });
    const store = new OpportunityStore(repository);

    const loaded = await store.load();

    expect(loaded).toHaveLength(1);
    expect(store.all).toEqual(loaded);
  });

  it("add creates an opportunity via the repository and appends it to the list", async () => {
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    await store.load();

    const created = await store.add({ instagramUrl: "https://instagram.com/p/xyz" });

    expect(created.instagramUrl).toBe("https://instagram.com/p/xyz");
    expect(store.all).toEqual([created]);
  });

  it("updateStatus updates the opportunity via the repository and reflects it in the list", async () => {
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    const created = await store.add({ instagramUrl: "https://instagram.com/p/abc" });

    const updated = await store.updateStatus(created.id, "applied");

    expect(updated.status).toBe("applied");
    expect(store.all).toEqual([updated]);
  });
});
