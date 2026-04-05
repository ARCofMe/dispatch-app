import { fireEvent, render, screen } from "@testing-library/react";
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
});
