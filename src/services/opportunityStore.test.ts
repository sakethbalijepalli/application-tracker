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

  it("updateStatus never touches the application link, even when moving to accepted", async () => {
    // Hiding the link once accepted is a display concern (see OpportunityList), not a
    // data-mutation one — destroying it here made it unrecoverable if status moved away
    // from "accepted" again.
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    const created = await store.add({
      instagramUrl: "https://instagram.com/p/abc",
      applicationLink: "https://example.com/apply",
    });

    const updated = await store.updateStatus(created.id, "accepted");

    expect(updated.applicationLink).toBe("https://example.com/apply");
  });

  it("update patches arbitrary fields via the repository and reflects them in the list", async () => {
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    const created = await store.add({ instagramUrl: "https://instagram.com/p/abc" });

    const updated = await store.update(created.id, { deadlineEventId: "event-1" });

    expect(updated.deadlineEventId).toBe("event-1");
    expect(store.all).toEqual([updated]);
  });

  it("update can explicitly clear one event id field with null while leaving an omitted field untouched", async () => {
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    const created = await store.add({ instagramUrl: "https://instagram.com/p/abc" });
    await store.update(created.id, { deadlineEventId: "event-1", performanceEventId: "event-2" });

    const updated = await store.update(created.id, { deadlineEventId: null });

    expect(updated.deadlineEventId).toBeUndefined();
    expect(updated.performanceEventId).toBe("event-2");
  });

  it("remove deletes the opportunity via the repository and drops it from the list", async () => {
    const repository = new FakeOpportunityRepository();
    const store = new OpportunityStore(repository);
    const kept = await store.add({ instagramUrl: "https://instagram.com/p/keep" });
    const removed = await store.add({ instagramUrl: "https://instagram.com/p/remove" });

    await store.remove(removed.id);

    expect(store.all).toEqual([kept]);
    expect(await repository.list()).toEqual([kept]);
  });
});
