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
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    expect(screen.getByText("Triage disposition")).toBeInTheDocument();
    expect(screen.getByText("Apply triage")).toBeInTheDocument();
  });

  it("supports acknowledging selected items", () => {
    const onAction = vi.fn();
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
        onAction={onAction}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Ack selected"));

    expect(onAction).toHaveBeenCalledWith("dispatch:SR-100:quote_needed", "ack");
  });
});
