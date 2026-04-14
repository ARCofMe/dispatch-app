import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import RoutesView from "./RoutesView";

describe("RoutesView", () => {
  it("filters route stops, carries the selected date, and opens service requests", () => {
    const onLoad = vi.fn();
    const onOpenServiceRequestById = vi.fn();

    render(
      <RoutesView
        routePreview={{
          technicianLabel: "Pat Tech",
          assignmentsConsidered: 3,
          skippedWithoutAddress: 1,
          originAddress: "Lewiston, ME",
          destinationAddress: "Auburn, ME",
          optimized: true,
          metrics: { total_distance_miles: 24.5, total_drive_minutes: 61, total_labor_minutes: 120, total_minutes: 181 },
          routeUrl: "https://maps.example/route",
          imageUrl: "https://maps.example/static.png",
          stops: [
            { label: "SR-100", srId: "100", subject: "Dryer no heat", address: "123 Main St, Lewiston, ME 04240" },
            { label: "SR-101", srId: "101", subject: "Dishwasher leak", address: "456 Oak St, Auburn, ME 04210" },
          ],
        }}
        heatmap={{ scannedJobs: 3, uniqueMappedLocations: 2, hotspots: [] }}
        loading={false}
        error=""
        technicianId="9001"
        routeDate="2026-04-05"
        technicianOptions={[{ value: "9001", label: "Pat Tech", bluefolderUserId: 9001, discordUserId: 7001 }]}
        originAddress="Lewiston, ME"
        destinationAddress="Auburn, ME"
        optimize
        onRouteDateChange={vi.fn()}
        onTechnicianIdChange={vi.fn()}
        onOriginAddressChange={vi.fn()}
        onDestinationAddressChange={vi.fn()}
        onOptimizeChange={vi.fn()}
        onLoad={onLoad}
        onOpenServiceRequestById={onOpenServiceRequestById}
      />
    );

    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getByText("24.5")).toBeInTheDocument();
    expect(screen.getByText("Static map fallback")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pat Tech")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-05")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filter stops"), { target: { value: "auburn" } });

    expect(screen.getAllByText("Open SR")).toHaveLength(1);
    expect(screen.getByText("SR-101")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Route date"), { target: { value: "2026-04-08" } });
    fireEvent.click(screen.getByText("Load route context"));
    expect(onLoad).toHaveBeenCalledWith("9001", {
      date: "2026-04-08",
      originAddress: "Lewiston, ME",
      destinationAddress: "Auburn, ME",
      optimize: true,
    });

    fireEvent.click(screen.getByText("Open SR"));
    expect(onOpenServiceRequestById).toHaveBeenCalledWith("101");
  });

  it("reorders stops by drag/drop through route simulation and disables optimization", () => {
    const onSimulateRoute = vi.fn();
    const onOptimizeChange = vi.fn();

    render(
      <RoutesView
        routePreview={{
          technicianLabel: "Pat Tech",
          routeUrl: "https://maps.example/route",
          stops: [
            { id: "a", label: "SR-100", srId: "100", subject: "Dryer no heat", address: "123 Main St, Lewiston, ME 04240" },
            { id: "b", label: "SR-101", srId: "101", subject: "Dishwasher leak", address: "456 Oak St, Auburn, ME 04210" },
          ],
        }}
        heatmap={null}
        loading={false}
        error=""
        technicianId="9001"
        routeDate="2026-04-05"
        technicianOptions={[{ value: "9001", label: "Pat Tech" }]}
        originAddress="Lewiston, ME"
        destinationAddress="Auburn, ME"
        optimize
        onRouteDateChange={vi.fn()}
        onTechnicianIdChange={vi.fn()}
        onOriginAddressChange={vi.fn()}
        onDestinationAddressChange={vi.fn()}
        onOptimizeChange={onOptimizeChange}
        onLoad={vi.fn()}
        onSimulateRoute={onSimulateRoute}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    const source = screen.getAllByText(/SR-100/)[0].closest(".route-stop-row");
    const target = screen.getAllByText(/SR-101/)[0].closest(".route-stop-row");
    fireEvent.dragStart(source);
    fireEvent.dragOver(target);
    fireEvent.drop(target);

    expect(onOptimizeChange).toHaveBeenCalledWith(false);
    expect(onSimulateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        manualOrder: ["b", "a"],
        optimize: false,
      }),
    );
    expect(screen.getByText("Route draft reordered. Optimization disabled for this manual sequence.")).toBeInTheDocument();
  });

  it("edits stop details through route simulation", () => {
    const onSimulateRoute = vi.fn();

    render(
      <RoutesView
        routePreview={{
          technicianLabel: "Pat Tech",
          stops: [
            {
              id: "a",
              label: "SR-100",
              srId: "100",
              subject: "Dryer no heat",
              address: "123 Main St, Lewiston, ME 04240",
              duration_minutes: 30,
              window_start: "08:00",
              window_end: "12:00",
              status: "scheduled",
            },
          ],
        }}
        heatmap={null}
        loading={false}
        error=""
        technicianId="9001"
        routeDate="2026-04-05"
        technicianOptions={[{ value: "9001", label: "Pat Tech" }]}
        originAddress="Lewiston, ME"
        destinationAddress="Auburn, ME"
        optimize={false}
        onRouteDateChange={vi.fn()}
        onTechnicianIdChange={vi.fn()}
        onOriginAddressChange={vi.fn()}
        onDestinationAddressChange={vi.fn()}
        onOptimizeChange={vi.fn()}
        onLoad={vi.fn()}
        onSimulateRoute={onSimulateRoute}
        onOpenServiceRequestById={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Details"));
    fireEvent.change(screen.getAllByLabelText("On-site minutes")[0], { target: { value: "45" } });
    fireEvent.change(screen.getAllByLabelText("Window start")[0], { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "in-progress" } });
    fireEvent.click(screen.getByText("Apply stop edits"));

    expect(onSimulateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        existingStops: [
          expect.objectContaining({
            id: "a",
            duration_minutes: 45,
            window_start: "09:00",
            window_end: "12:00",
            status: "in-progress",
          }),
        ],
        manualOrder: ["a"],
      }),
    );
    expect(screen.getByText("Stop details updated in route draft.")).toBeInTheDocument();
  });
});
