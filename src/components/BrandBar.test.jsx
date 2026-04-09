import { render, screen } from "@testing-library/react";
import BrandBar from "./BrandBar";

describe("BrandBar", () => {
  it("renders only safe ecosystem links and marks the current app", () => {
    render(
      <BrandBar
        currentApp="routeDesk"
        workspaceLinks={{
          opsHubUrl: "ops.example.com",
          routeDeskUrl: "https://route.example.com",
          partsAppUrl: "https://parts.example.com",
          fieldDeskUrl: "javascript:alert(1)",
        }}
      />
    );

    expect(screen.getByText("RouteDesk")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open OpsHub" })).toHaveAttribute("href", "https://ops.example.com/");
    expect(screen.getByRole("link", { name: "Open PartsApp" })).toHaveAttribute("href", "https://parts.example.com/");
    expect(screen.queryByRole("link", { name: "Open FieldDesk" })).not.toBeInTheDocument();
  });
});
