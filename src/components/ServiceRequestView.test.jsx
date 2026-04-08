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
        smsCapabilities={null}
        smsHistory={[]}
        smsPreview={null}
        smsActionState={null}
        loading={false}
        error=""
        onChange={vi.fn()}
        onOpenRoutes={vi.fn()}
        onPreviewSms={vi.fn()}
        onSendSms={vi.fn()}
        onOpenAttentionItem={vi.fn()}
        technicianOptions={[]}
      />
    );

    expect(screen.getByText("Choose an SR to load dispatch context.")).toBeInTheDocument();
  });

  it("renders work panel with linked attention and parts context", () => {
    const onOpenRoutes = vi.fn();
    const onOpenAttentionItem = vi.fn();
    const onPreviewSms = vi.fn();
    const onSendSms = vi.fn();

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
        smsCapabilities={{
          provider: "dry_run",
          enabled: true,
          toNumber: "555-0100",
          fromLabel: "ARCoM Ops",
          intents: [{ key: "dispatch_follow_up", label: "General follow-up", recommended: "true" }],
        }}
        smsHistory={[]}
        smsPreview={{ provider: "dry_run", toNumber: "555-0100", message: "ARCoM Ops: Test", segments: 1 }}
        smsActionState={null}
        loading={false}
        error=""
        onChange={vi.fn()}
        onOpenRoutes={onOpenRoutes}
        onPreviewSms={onPreviewSms}
        onSendSms={onSendSms}
        onOpenAttentionItem={onOpenAttentionItem}
        technicianOptions={[{ value: "9001", label: "Pat Tech", bluefolderUserId: 9001, discordUserId: 7001 }]}
      />
    );

    expect(screen.getByText("Work panel")).toBeInTheDocument();
    expect(screen.getByText("Call landlord")).toBeInTheDocument();
    expect(screen.getByText("Track ETA")).toBeInTheDocument();
    expect(screen.getByText("Customer SMS")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Preview SMS"));
    expect(onPreviewSms).toHaveBeenCalledWith("dispatch_follow_up", "");
    fireEvent.click(screen.getByText("Send SMS"));
    expect(onSendSms).toHaveBeenCalledWith("dispatch_follow_up", "");
    fireEvent.click(screen.getByText("Open technician route"));
    expect(onOpenRoutes).toHaveBeenCalledWith(9001);
  });
});
