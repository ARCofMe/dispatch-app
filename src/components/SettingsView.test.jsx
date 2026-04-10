import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsView from "./SettingsView";

describe("SettingsView", () => {
  it("shows ecosystem readiness and quick links", () => {
    render(
      <SettingsView
        themeMode="dark"
        onThemeModeChange={vi.fn()}
        technicianOptions={[]}
        defaultRouteTechnicianId=""
        onDefaultRouteTechnicianChange={vi.fn()}
        autoLoadDefaultRouteTech
        onAutoLoadDefaultRouteTechChange={vi.fn()}
        routeOptimizeByDefault={false}
        onRouteOptimizeByDefaultChange={vi.fn()}
        rememberLastSr
        onRememberLastSrChange={vi.fn()}
        restoreLastSrOnLaunch={false}
        onRestoreLastSrOnLaunchChange={vi.fn()}
        openSrOnAttentionSelect={false}
        onOpenSrOnAttentionSelectChange={vi.fn()}
        dispatcherId="42"
        apiBase="https://api.example.com"
        onClearRouteDraft={vi.fn()}
        onClearIntakeDraft={vi.fn()}
        workspaceLinks={{
          routeDeskUrl: "",
          partsAppUrl: "parts.example.com",
          fieldDeskUrl: "",
        }}
        onWorkspaceLinksChange={vi.fn()}
      />,
    );

    expect(screen.getByText("1 of 3 workspaces configured.")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 linked")).toBeInTheDocument();
    expect(screen.getByText("Current app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open PartsDesk" })).toHaveAttribute("href", "https://parts.example.com/");
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("4 / 6")).toBeInTheDocument();
    expect(screen.getByText("FieldDesk launcher ready")).toBeInTheDocument();
    expect(screen.getByText("Next fixes: Default technician selected, FieldDesk launcher ready")).toBeInTheDocument();
    expect(screen.getAllByText("Missing").length).toBeGreaterThan(0);
  });
});
