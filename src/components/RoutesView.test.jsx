import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import RoutesView from "./RoutesView";

describe("RoutesView", () => {
  it("filters route stops and opens service requests", () => {
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
          stops: [
            { label: "SR-100", srId: "100", subject: "Dryer no heat", address: "123 Main St, Lewiston, ME 04240" },
            { label: "SR-101", srId: "101", subject: "Dishwasher leak", address: "456 Oak St, Auburn, ME 04210" },
          ],
        }}
        heatmap={{ scannedJobs: 3, uniqueMappedLocations: 2, hotspots: [] }}
        loading={false}
        error=""
        technicianId="9001"
        originAddress="Lewiston, ME"
        destinationAddress="Auburn, ME"
        optimize
        onTechnicianIdChange={vi.fn()}
        onOriginAddressChange={vi.fn()}
        onDestinationAddressChange={vi.fn()}
        onOptimizeChange={vi.fn()}
        onLoad={vi.fn()}
        onOpenServiceRequestById={onOpenServiceRequestById}
      />
    );

    expect(screen.getByText("enabled")).toBeInTheDocument();
    expect(screen.getByText("24.5")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filter stops"), { target: { value: "auburn" } });

    expect(screen.getAllByText("Open SR")).toHaveLength(1);
    expect(screen.getByText("SR-101")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Open SR"));
    expect(onOpenServiceRequestById).toHaveBeenCalledWith("101");
  });
});
