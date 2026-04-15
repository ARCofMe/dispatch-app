import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import IntakeView from "./IntakeView";

describe("IntakeView", () => {
  it("renders formats, uploads a spreadsheet, and shows analysis details", async () => {
    const onAnalyze = vi.fn();
    const onUploadSpreadsheet = vi.fn(() =>
      Promise.resolve({
        success: true,
        fileName: "intake.csv",
        spreadsheetPath: "/tmp/dispatch-intake.csv",
        message: "Uploaded intake.csv.",
      })
    );

    render(
      <IntakeView
        formats={{
          items: [
            { name: "default", description: "Preferred template." },
            { name: "vendor_a", description: "Vendor adapter." },
          ],
        }}
        formatsLoading={false}
        formatsError=""
        profiles={{ items: [{ name: "vendor-a", formatName: "vendor_a" }] }}
        profilesLoading={false}
        profilesError=""
        onRefreshProfiles={vi.fn()}
        analysis={{
          selectedAdapter: { name: "default" },
          rowCount: 2,
          headerAnalysis: { matchedCount: 7, missingCount: 1, missingHeaders: ["Zip"], unexpectedHeaders: ["Unused"] },
          adapterMatches: [{ name: "default", score: 0.9, matchedCount: 7, missingCount: 1 }],
          previewRows: [{ source_row_number: "2", customer_name: "Pat Smith", subject: "No heat", address: "123 Main St" }],
          validationIssues: [{ row: "3", level: "warning", message: "Questionable email format: bad-email" }],
        }}
        analysisLoading={false}
        analysisError=""
        onAnalyze={onAnalyze}
        preview={null}
        previewLoading={false}
        previewError=""
        onPreview={vi.fn()}
        importResult={null}
        importLoading={false}
        importError=""
        onImport={vi.fn()}
        onUploadSpreadsheet={onUploadSpreadsheet}
        onSaveProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onDeleteProfile={vi.fn(() => Promise.resolve({ success: true }))}
      />
    );

    const file = new File(["name,subject\nPat Smith,No heat"], "intake.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Upload spreadsheet"), { target: { files: [file] } });
    await screen.findByText("Uploaded intake.csv.");
    fireEvent.click(screen.getByText("Analyze spreadsheet"));

    expect(onUploadSpreadsheet).toHaveBeenCalled();
    expect(onAnalyze).toHaveBeenCalledWith(expect.objectContaining({ spreadsheetPath: "/tmp/dispatch-intake.csv" }));
    expect(screen.getByText("Supported formats")).toBeInTheDocument();
    expect(screen.getByText("vendor-a")).toBeInTheDocument();
    expect(screen.getByText("Missing: Zip")).toBeInTheDocument();
    expect(screen.getByText("Questionable email format: bad-email")).toBeInTheDocument();
    expect(screen.getByText("Run import")).toBeDisabled();
  });

  it("refreshes saved presets after a profile load error", () => {
    const onRefreshProfiles = vi.fn();
    const { rerender } = render(
      <IntakeView
        formats={{ items: [] }}
        formatsLoading={false}
        formatsError=""
        profiles={{ items: [{ name: "vendor-a", formatName: "vendor_a" }] }}
        profilesLoading={false}
        profilesError="Could not load intake presets."
        onRefreshProfiles={onRefreshProfiles}
        analysis={null}
        analysisLoading={false}
        analysisError=""
        onAnalyze={vi.fn()}
        preview={null}
        previewLoading={false}
        previewError=""
        onPreview={vi.fn()}
        importResult={null}
        importLoading={false}
        importError=""
        onImport={vi.fn()}
        onUploadSpreadsheet={vi.fn()}
        onSaveProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onDeleteProfile={vi.fn(() => Promise.resolve({ success: true }))}
      />
    );

    expect(screen.getByText("Could not load intake presets.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh presets" }));
    expect(onRefreshProfiles).toHaveBeenCalledTimes(1);

    rerender(
      <IntakeView
        formats={{ items: [] }}
        formatsLoading={false}
        formatsError=""
        profiles={{ items: [{ name: "vendor-a", formatName: "vendor_a" }, { name: "vendor-b", formatName: "default" }] }}
        profilesLoading={false}
        profilesError=""
        onRefreshProfiles={onRefreshProfiles}
        analysis={null}
        analysisLoading={false}
        analysisError=""
        onAnalyze={vi.fn()}
        preview={null}
        previewLoading={false}
        previewError=""
        onPreview={vi.fn()}
        importResult={null}
        importLoading={false}
        importError=""
        onImport={vi.fn()}
        onUploadSpreadsheet={vi.fn()}
        onSaveProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onDeleteProfile={vi.fn(() => Promise.resolve({ success: true }))}
      />
    );

    expect(screen.queryByText("Could not load intake presets.")).not.toBeInTheDocument();
    expect(screen.getByText("vendor-b")).toBeInTheDocument();
  });

  it("submits manual service requests for preview before create", async () => {
    const onManualPreview = vi.fn(() => Promise.resolve({ success: true }));

    render(
      <IntakeView
        formats={{ items: [] }}
        formatsLoading={false}
        formatsError=""
        profiles={{ items: [] }}
        profilesLoading={false}
        profilesError=""
        onRefreshProfiles={vi.fn()}
        analysis={null}
        analysisLoading={false}
        analysisError=""
        onAnalyze={vi.fn()}
        preview={null}
        previewLoading={false}
        previewError=""
        onPreview={vi.fn()}
        importResult={null}
        importLoading={false}
        importError=""
        onImport={vi.fn()}
        onUploadSpreadsheet={vi.fn()}
        onSaveProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onDeleteProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onManualPreview={onManualPreview}
      />
    );

    fireEvent.change(screen.getByLabelText("Customer name"), { target: { value: "Pat Smith" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "2075551212" } });
    fireEvent.change(screen.getByLabelText("Street address"), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "No heat" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview manual SR" }));

    await waitFor(() =>
      expect(onManualPreview).toHaveBeenCalledWith({
        duplicateMode: "error",
        request: {
          customerName: "Pat Smith",
          customerPhone: "2075551212",
          address: "123 Main St",
          state: "ME",
          subject: "No heat",
        },
      })
    );
  });

  it("opens the created service request from manual intake results", () => {
    const onOpenServiceRequestById = vi.fn();

    render(
      <IntakeView
        formats={{ items: [] }}
        formatsLoading={false}
        formatsError=""
        profiles={{ items: [] }}
        profilesLoading={false}
        profilesError=""
        onRefreshProfiles={vi.fn()}
        analysis={null}
        analysisLoading={false}
        analysisError=""
        onAnalyze={vi.fn()}
        preview={null}
        previewLoading={false}
        previewError=""
        onPreview={vi.fn()}
        importResult={null}
        importLoading={false}
        importError=""
        onImport={vi.fn()}
        onUploadSpreadsheet={vi.fn()}
        onSaveProfile={vi.fn(() => Promise.resolve({ success: true }))}
        onDeleteProfile={vi.fn(() => Promise.resolve({ success: true }))}
        manualResult={{
          success: true,
          summary: { "status:imported": 1 },
          result: { service_request_id: "96285", customer_id: "100" },
        }}
        onOpenServiceRequestById={onOpenServiceRequestById}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open created SR" }));

    expect(onOpenServiceRequestById).toHaveBeenCalledWith("96285");
  });
});
