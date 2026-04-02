import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import BoardView from "./BoardView";

describe("BoardView", () => {
  it("renders key dispatch board metrics and top attention items", () => {
    render(
      <BoardView
        board={{
          mappedTechs: 4,
          activeTechs: 3,
          totalVisibleAssignments: 11,
          attentionJobs: 5,
          openPartsCases: 2,
          scannedJobs: 14,
          attentionMetrics: { queueCounts: { quote_needed: 2, part_ready: 1 } },
          technicianLoad: [
            {
              bluefolderUserId: 9001,
              technicianLabel: "Pat Tech",
              assignmentCount: 4,
              originAddress: "Lewiston, ME",
              nextJob: { summary: "Dryer no heat" },
            },
          ],
          topAttention: [
            {
              itemId: "dispatch:SR-100:quote_needed",
              reference: "SR-100",
              stageLabel: "Quote Needed",
              ageBucket: "urgent",
              followUpOwnerLabel: "Dispatch",
            },
          ],
          openPartsCaseItems: [],
        }}
        loading={false}
        error=""
        onOpenAttention={vi.fn()}
        onOpenAttentionItem={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
      />
    );

    expect(screen.getByText("Mapped techs")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("quote needed: 2")).toBeInTheDocument();
    expect(screen.getByText("Pat Tech")).toBeInTheDocument();
    expect(screen.getByText("SR-100")).toBeInTheDocument();
    expect(screen.getByText("Fast jumps")).toBeInTheDocument();
  });
});
