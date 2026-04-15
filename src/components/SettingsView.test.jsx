import { fireEvent, render, screen } from "@testing-library/react";
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
        onDispatcherIdChange={vi.fn()}
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
    expect(screen.getByText("2 / 3 linked")).toBeInTheDocument();
    expect(screen.getByText("Current app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open PartsDesk" })).toHaveAttribute("href", "https://parts.example.com/");
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("5 / 7")).toBeInTheDocument();
    expect(screen.getByText("FieldDesk launcher ready")).toBeInTheDocument();
    expect(screen.getByText("Next fixes: Default technician selected, FieldDesk launcher ready")).toBeInTheDocument();
    expect(screen.getAllByText("Missing").length).toBeGreaterThan(0);
  });

  it("edits the per-browser dispatcher id from settings", () => {
    const onDispatcherIdChange = vi.fn();
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
        dispatcherId=""
        onDispatcherIdChange={onDispatcherIdChange}
        apiBase="https://api.example.com"
        onClearRouteDraft={vi.fn()}
        onClearIntakeDraft={vi.fn()}
        workspaceLinks={{ opsHubUrl: "", routeDeskUrl: "", partsAppUrl: "", fieldDeskUrl: "" }}
        onWorkspaceLinksChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("OpsHub operator ID"), { target: { value: "dispatcher-42" } });

    expect(onDispatcherIdChange).toHaveBeenCalledWith("dispatcher-42");
  });
});
