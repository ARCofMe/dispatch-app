import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import TriageView from "./TriageView";

describe("TriageView", () => {
  it("shows only triage-stage items and triage metrics", () => {
    render(
      <TriageView
        items={[
          {
            itemId: "dispatch:SR-100:new_sr_triage",
            reference: "SR-100",
            stage: "new_sr_triage",
            stageLabel: "New SR Triage",
            nextAction: "Review symptoms",
            status: "open",
            ageBucket: "urgent",
          },
          {
            itemId: "dispatch:SR-101:quote_needed",
            reference: "SR-101",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Call landlord",
            status: "open",
            ageBucket: "warm",
          },
        ]}
        ownerOptions={[]}
        loading={false}
        error=""
        onPreferencesChange={vi.fn()}
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={null}
        selectedItemDetail={null}
        actionState={null}
        onAction={vi.fn()}
        onBulkAction={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Triage" })).toBeInTheDocument();
    expect(screen.getByText("Triage items").closest(".metric-card")).toHaveTextContent("Triage items1");
    expect(screen.getByText("Urgent triage").closest(".metric-card")).toHaveTextContent("Urgent triage1");
    expect(screen.getByText("Owner gaps").closest(".metric-card")).toHaveTextContent("Owner gaps1");
    expect(screen.getByText("New SR Triage: 1")).toBeInTheDocument();
    expect(screen.getByText("SR-100")).toBeInTheDocument();
    expect(screen.queryByText("SR-101")).not.toBeInTheDocument();
  });
});
