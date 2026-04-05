import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ServiceRequestView from "./ServiceRequestView";

describe("ServiceRequestView", () => {
  it("renders an explicit empty state when no SR is selected", () => {
    render(
      <ServiceRequestView
        srId=""
        customer={null}
        timeline={[]}
        work={null}
        loading={false}
        error=""
        onChange={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenAttentionItem={vi.fn()}
        technicianOptions={[]}
      />
    );

    expect(screen.getByText("Choose an SR to load dispatch context.")).toBeInTheDocument();
  });

  it("renders work panel with linked attention and parts context", () => {
    const onOpenRoutes = vi.fn();
    const onOpenAttentionItem = vi.fn();

    render(
      <ServiceRequestView
        srId="200"
        customer={{ customerName: "Pat Smith", subject: "Dryer no heat", reference: "SR-200" }}
        timeline={{ entries: [] }}
        work={{
          urgentCount: 1,
          ownerGapCount: 1,
          attentionItems: [
            {
              itemId: "dispatch:SR-200:quote_needed",
              reference: "SR-200",
              stageLabel: "Quote Needed",
              nextAction: "Call landlord",
              assignedOwnerLabel: null,
              ageBucket: "urgent",
              ownerBluefolderUserId: 9001,
            },
          ],
          partsCase: {
            reference: "SR-200",
            stageLabel: "Ordered",
            nextAction: "Track ETA",
            assignedPartsLabel: "Parts 1",
            ageBucket: "warm",
          },
          nextActions: ["Call landlord", "Track ETA"],
        }}
        loading={false}
        error=""
        onChange={vi.fn()}
        onOpenRoutes={onOpenRoutes}
        onOpenAttentionItem={onOpenAttentionItem}
        technicianOptions={[{ value: "9001", label: "Pat Tech", bluefolderUserId: 9001, discordUserId: 7001 }]}
      />
    );

    expect(screen.getByText("Work panel")).toBeInTheDocument();
    expect(screen.getByText("Call landlord")).toBeInTheDocument();
    expect(screen.getByText("Track ETA")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open technician route"));
    expect(onOpenRoutes).toHaveBeenCalledWith(9001);
  });
});
