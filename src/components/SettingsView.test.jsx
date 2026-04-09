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
          opsHubUrl: "ops.example.com",
          routeDeskUrl: "",
          partsAppUrl: "parts.example.com",
          fieldDeskUrl: "",
        }}
        onWorkspaceLinksChange={vi.fn()}
      />,
    );

    expect(screen.getByText("2 of 4 workspaces configured.")).toBeInTheDocument();
    expect(screen.getByText("Current app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open OpsHub" })).toHaveAttribute("href", "https://ops.example.com/");
    expect(screen.getByRole("link", { name: "Open PartsApp" })).toHaveAttribute("href", "https://parts.example.com/");
  });
});
