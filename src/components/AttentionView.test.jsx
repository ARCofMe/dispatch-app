import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AttentionView from "./AttentionView";

describe("AttentionView", () => {
  it("filters visible attention items by stage text", () => {
    render(
      <AttentionView
        items={[
          {
            itemId: "dispatch:SR-100:quote_needed",
            reference: "SR-100",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Call landlord",
            status: "open",
            ageBucket: "urgent",
            followUpOwnerLabel: "Dispatch",
          },
          {
            itemId: "dispatch:SR-101:part_ready",
            reference: "SR-101",
            stage: "part_ready",
            stageLabel: "Ready to Schedule",
            nextAction: "Book return visit",
            status: "open",
            ageBucket: "warm",
            followUpOwnerLabel: "Unassigned",
          },
        ]}
        loading={false}
        error=""
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

    fireEvent.change(screen.getByLabelText("Stage"), { target: { value: "quote" } });

    expect(screen.getByText("SR-100")).toBeInTheDocument();
    expect(screen.queryByText("SR-101")).not.toBeInTheDocument();
  });

  it("shows triage controls for triage-stage items", () => {
    render(
      <AttentionView
        items={[
          {
            itemId: "dispatch:SR-200:new_sr_triage",
            srId: 200,
            reference: "SR-200",
            stage: "new_sr_triage",
            stageLabel: "New SR Triage",
            nextAction: "Review symptom and decide path",
            status: "open",
            ageBucket: "fresh",
            followUpOwnerLabel: "Dispatch",
          },
        ]}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={{
          itemId: "dispatch:SR-200:new_sr_triage",
          srId: 200,
          reference: "SR-200",
          stage: "new_sr_triage",
          stageLabel: "New SR Triage",
          nextAction: "Review symptom and decide path",
          status: "open",
          ageBucket: "fresh",
        }}
        selectedItemDetail={null}
        actionState={null}
        onAction={vi.fn()}
        onBulkAction={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByText("Triage disposition")).toBeInTheDocument();
    expect(screen.getByText("Apply triage")).toBeInTheDocument();
  });

  it("shows compact complaint evidence for selected triage items", () => {
    render(
      <AttentionView
        items={[
          {
            itemId: "dispatch:SR-201:new_sr_triage",
            srId: 201,
            reference: "SR-201",
            stage: "new_sr_triage",
            stageLabel: "New SR Triage",
            nextAction: "Decide whether this can be parts-first",
            status: "open",
            ageBucket: "fresh",
          },
        ]}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={{
          itemId: "dispatch:SR-201:new_sr_triage",
          srId: 201,
          reference: "SR-201",
          stage: "new_sr_triage",
          stageLabel: "New SR Triage",
          nextAction: "Decide whether this can be parts-first",
          status: "open",
          ageBucket: "fresh",
        }}
        selectedItemDetail={null}
        complaintIntelligence={{
          available: true,
          complaintTags: [{ tag: "no_drain" }],
          recommendations: [{ item: "PUMP-1", itemType: "part", matchingRequestCount: 3, score: 0.6 }],
          evidencePacket: {
            confidence: "moderate",
            classification: { matchScope: "model_family" },
            diagnosticQuestions: ["Does the pump run or only hum?"],
          },
        }}
        actionState={null}
        onAction={vi.fn()}
        onBulkAction={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByText("Complaint evidence")).toBeInTheDocument();
    expect(screen.getByText("model family")).toBeInTheDocument();
    expect(screen.getByText("moderate")).toBeInTheDocument();
    expect(screen.getByText("PUMP-1")).toBeInTheDocument();
    expect(screen.getByText("Does the pump run or only hum?")).toBeInTheDocument();
  });

  it("supports acknowledging selected items", () => {
    const onBulkAction = vi.fn();
    render(
      <AttentionView
        items={[
          {
            itemId: "dispatch:SR-100:quote_needed",
            reference: "SR-100",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Call landlord",
            status: "open",
            ageBucket: "urgent",
          },
        ]}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={null}
        selectedItemDetail={null}
        actionState={null}
        onAction={vi.fn()}
        onBulkAction={onBulkAction}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Ack selected"));

    expect(onBulkAction).toHaveBeenCalledWith("ack", ["dispatch:SR-100:quote_needed"]);
  });

  it("exposes refresh recovery controls after an error", () => {
    const onRefresh = vi.fn();
    const { rerender } = render(
      <AttentionView
        items={[]}
        loading={false}
        error="Could not reach Ops Hub. Check that ops-hub is running and the API base URL is correct."
        onRefresh={onRefresh}
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

    expect(
      screen.getByText("Could not reach Ops Hub. Check that ops-hub is running and the API base URL is correct.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    rerender(
      <AttentionView
        items={[
          {
            itemId: "dispatch:SR-100:quote_needed",
            reference: "SR-100",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Call landlord",
            status: "open",
            ageBucket: "urgent",
            followUpOwnerLabel: "Dispatch",
          },
        ]}
        loading={false}
        error=""
        onRefresh={onRefresh}
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

    expect(screen.getByText("SR-100")).toBeInTheDocument();
  });

  it("keeps follow-up owner separate from technician in detail", () => {
    render(
      <AttentionView
        items={[]}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={{
          itemId: "dispatch:SR-300:part_received",
          srId: 300,
          reference: "SR-300",
          stage: "part_received",
          stageLabel: "Received",
          nextAction: "Schedule return visit",
          status: "open",
          ageBucket: "warm",
          ownerLabel: "Danny Marquez",
          technicianLabel: "Danny Marquez",
        }}
        selectedItemDetail={null}
        actionState={null}
        onAction={vi.fn()}
        onBulkAction={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByText("unassigned")).toBeInTheDocument();
    expect(screen.getAllByText("Danny Marquez").length).toBeGreaterThan(0);
  });

  it("requires an owner selection before assigning attention ownership", () => {
    const onAction = vi.fn();

    render(
      <AttentionView
        items={[]}
        loading={false}
        error=""
        ownerOptions={[{ bluefolderUserId: 13051, displayName: "Danny Marquez" }]}
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={{
          itemId: "dispatch:SR-301:quote_needed",
          srId: 301,
          reference: "SR-301",
          stage: "quote_needed",
          stageLabel: "Quote Needed",
          nextAction: "Call landlord",
          status: "open",
          ageBucket: "warm",
        }}
        selectedItemDetail={null}
        actionState={null}
        onAction={onAction}
        onBulkAction={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Assign" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Assign owner"), { target: { value: "13051" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    expect(onAction).toHaveBeenCalledWith("dispatch:SR-301:quote_needed", "assign", {
      assignedOwnerBluefolderUserId: 13051,
    });
  });

  it("marks discovery items read-only while leaving SR navigation available", () => {
    const onBulkAction = vi.fn();
    const onAction = vi.fn();
    const onOpenServiceRequest = vi.fn();
    const discoveryItem = {
      itemId: "discovery:SR-400",
      srId: 400,
      reference: "SR-400",
      stage: "bluefolder_discovery",
      stageLabel: "BlueFolder Discovery",
      nextAction: "Review this BlueFolder SR",
      status: "open",
      ageBucket: "fresh",
      readOnly: true,
    };

    render(
      <AttentionView
        items={[discoveryItem]}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSelectItem={vi.fn()}
        selectedItem={discoveryItem}
        selectedItemDetail={{ item: discoveryItem, history: [] }}
        actionState={null}
        onAction={onAction}
        onBulkAction={onBulkAction}
        onOpenServiceRequest={onOpenServiceRequest}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getAllByText("Discovery").length).toBeGreaterThan(0);
    expect(screen.getByText("Read-only discovery candidate. Open the SR to decide the next workflow action.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();

    fireEvent.click(screen.getByText("Ack visible"));
    expect(onBulkAction).not.toHaveBeenCalled();

    expect(screen.getByRole("button", { name: "Ack" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply snooze" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Open SR" }));
    expect(onOpenServiceRequest).toHaveBeenCalledWith(discoveryItem);
  });

  it("surfaces attention health and can jump to discovery-only filtering", () => {
    render(
      <AttentionView
        items={[
          {
            itemId: "discovery:SR-400",
            reference: "SR-400",
            stage: "bluefolder_discovery",
            stageLabel: "BlueFolder Discovery",
            nextAction: "Review this BlueFolder SR",
            status: "open",
            ageBucket: "fresh",
            readOnly: true,
          },
          {
            itemId: "dispatch:SR-401:quote_needed",
            reference: "SR-401",
            stage: "quote_needed",
            stageLabel: "Quote Needed",
            nextAction: "Quote repair",
            status: "open",
            ageBucket: "urgent",
          },
        ]}
        meta={{ scannedJobs: 9, discoveryJobs: 1 }}
        loading={false}
        error=""
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

    expect(screen.getByText("OpsHub scanned 9 jobs for this queue.")).toBeInTheDocument();
    expect(screen.getAllByText("Discovery").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Discovery only"));

    expect(screen.getByText("SR-400")).toBeInTheDocument();
    expect(screen.queryByText("SR-401")).not.toBeInTheDocument();
  });
});
