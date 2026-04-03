import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import ServiceRequestView from "./ServiceRequestView";

describe("ServiceRequestView", () => {
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
      />
    );

    expect(screen.getByText("Work panel")).toBeInTheDocument();
    expect(screen.getByText("Call landlord")).toBeInTheDocument();
    expect(screen.getByText("Track ETA")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Open technician route"));
    expect(onOpenRoutes).toHaveBeenCalledWith(9001);
  });
});
