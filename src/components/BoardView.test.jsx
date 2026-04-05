import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import BoardView from "./BoardView";
import { buildTechnicianOptions } from "./labelUtils";

describe("BoardView", () => {
  it("renders key dispatch board metrics and top attention items", () => {
    const board = {
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
          discordUserId: 7001,
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
          ownerBluefolderUserId: 9001,
          assignedOwnerLabel: "<@7001>",
        },
      ],
      openPartsCaseItems: [],
    };

    render(
      <BoardView
        board={board}
        loading={false}
        error=""
        technicianOptions={buildTechnicianOptions(board)}
        onOpenAttention={vi.fn()}
        onOpenAttentionItem={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
      />
    );

    expect(screen.getByText("Mapped techs")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("quote needed: 2")).toBeInTheDocument();
    expect(screen.getAllByText("Pat Tech").length).toBeGreaterThan(0);
    expect(screen.getByText("SR-100")).toBeInTheDocument();
    expect(screen.getByText("Fast jumps")).toBeInTheDocument();
  });

  it("renders an explicit idle-day message when technicians have no calls yet", () => {
    const board = {
      mappedTechs: 1,
      activeTechs: 0,
      totalVisibleAssignments: 0,
      attentionJobs: 0,
      openPartsCases: 0,
      scannedJobs: 0,
      attentionMetrics: { queueCounts: {} },
      technicianLoad: [
        {
          bluefolderUserId: 9001,
          discordUserId: 7001,
          technicianLabel: "Pat Tech",
          assignmentCount: 0,
          originAddress: "Lewiston, ME",
          nextJob: null,
        },
      ],
      topAttention: [],
      openPartsCaseItems: [],
    };

    render(
      <BoardView
        board={board}
        loading={false}
        error=""
        technicianOptions={buildTechnicianOptions(board)}
        onOpenAttention={vi.fn()}
        onOpenAttentionItem={vi.fn()}
        onOpenServiceRequest={vi.fn()}
        onOpenRoutes={vi.fn()}
      />
    );

    expect(screen.getByText("No calls assigned yet for the current day. Routes can wait until the board fills in.")).toBeInTheDocument();
    expect(screen.getByText("No calls on deck")).toBeInTheDocument();
  });
});
