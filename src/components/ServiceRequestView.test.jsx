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
        complaintIntelligence={null}
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
        customer={{
          customerName: "Pat Smith",
          subject: "Dryer no heat",
          reference: "SR-200",
          statusMeta: {
            categoryLabel: "Parts",
            primarySurface: "partsdesk",
            blocksScheduling: true,
            schedulingReleaseCondition: "ETA is confirmed.",
            actionRequired: "PartsDesk should confirm ETA before scheduling.",
          },
        }}
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
        complaintIntelligence={{
          available: true,
          request: {
            modelNumber: "RF1",
            brand: "Samsung",
            applianceType: "refrigerator",
            complaintText: "not cooling",
          },
          complaintTags: [{ tag: "no_cool", confidence: 1, source: "rules" }],
          similarRequestCount: 2,
          recommendations: [{ item: "FAN-1", itemType: "part", matchingRequestCount: 2, score: 1 }],
          commonResolutions: ["Replaced evaporator fan"],
          evidencePacket: {
            classification: { matchScope: "exact_model" },
            confidence: "limited",
            diagnosticQuestions: ["Is the evaporator fan running?"],
          },
        }}
        smsCapabilities={{
          provider: "dry_run",
          enabled: true,
          toNumber: "555-0100",
          fromLabel: "OpsHub",
          intents: [{ key: "dispatch_follow_up", label: "General follow-up", recommended: "true" }],
        }}
        smsHistory={[]}
        smsPreview={{ provider: "dry_run", toNumber: "555-0100", message: "OpsHub: Test", segments: 1 }}
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
    expect(screen.getByText("Review status")).toBeInTheDocument();
    expect(screen.getByText("Surface: PartsDesk")).toBeInTheDocument();
    expect(screen.getByText("Workflow ownership")).toBeInTheDocument();
    expect(screen.getByText("Primary surface")).toBeInTheDocument();
    expect(screen.getByText("PartsDesk")).toBeInTheDocument();
    expect(screen.getByText("Schedule gate")).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Owner surface")).toBeInTheDocument();
    expect(screen.getByText("partsdesk")).toBeInTheDocument();
    expect(screen.getByText("Release condition: ETA is confirmed.")).toBeInTheDocument();
    expect(screen.getAllByText("Call landlord").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Track ETA").length).toBeGreaterThan(0);
    expect(screen.getByText("Customer SMS")).toBeInTheDocument();
    expect(screen.getByText("Complaint Intelligence")).toBeInTheDocument();
    expect(screen.getAllByText("FAN-1").length).toBeGreaterThan(0);
    expect(screen.getByText("no_cool")).toBeInTheDocument();
    expect(screen.getByText("exact model • limited")).toBeInTheDocument();
    expect(screen.getByText("Triage questions")).toBeInTheDocument();
    expect(screen.getByLabelText("Feedback note")).toBeInTheDocument();
    expect(screen.getAllByText("Is the evaporator fan running?").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Preview SMS"));
    expect(onPreviewSms).toHaveBeenCalledWith("dispatch_follow_up", "");
    fireEvent.click(screen.getByText("Send SMS"));
    expect(onSendSms).toHaveBeenCalledWith("dispatch_follow_up", "");
    fireEvent.click(screen.getByText("Open technician route"));
    expect(onOpenRoutes).toHaveBeenCalledWith(9001);
  });
});
