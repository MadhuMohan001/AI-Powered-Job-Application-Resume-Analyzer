import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { ScoreGauge } from "../components/charts/ScoreGauge";
import { SkillBars } from "../components/charts/SkillBars";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { LoginPage } from "../pages/AuthPages";
import { validateFile } from "../pages/ResumeUploadPage";

describe("ScoreGauge", () => {
  it("shows the score with an accessible label", () => {
    render(<ScoreGauge score={82} />);
    expect(screen.getByRole("img", { name: /match score 82 out of 100/i })).toBeInTheDocument();
  });
});

describe("SkillBars", () => {
  it("computes coverage and lists skills", () => {
    render(<SkillBars matching={["Python", "SQL", "Git"]} missing={["Docker"]} />);
    expect(screen.getByRole("progressbar", { name: /skill coverage/i })).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText(/3 of 4 skills/)).toBeInTheDocument();
  });

  it("handles no skills without dividing by zero", () => {
    render(<SkillBars matching={[]} missing={[]} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});

describe("validateFile", () => {
  it("accepts pdf/docx and rejects others or oversized files", () => {
    expect(validateFile(new File(["x"], "cv.pdf"))).toBeNull();
    expect(validateFile(new File(["x"], "cv.DOCX"))).toBeNull();
    expect(validateFile(new File(["x"], "cv.txt"))).toMatch(/only pdf and docx/i);
    const big = new File(["x"], "cv.pdf");
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    expect(validateFile(big)).toMatch(/smaller than 5 MB/);
  });
});

describe("ProtectedRoute", () => {
  it("redirects anonymous users to the login page", () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <ToastProvider><AuthProvider>
          <Routes>
            <Route path="/login" element={<p>Login screen</p>} />
            <Route element={<ProtectedRoute />}><Route path="/secret" element={<p>Secret</p>} /></Route>
          </Routes>
        </AuthProvider></ToastProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login screen")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });
});

describe("LoginPage", () => {
  it("shows validation errors for empty fields", async () => {
    localStorage.clear();
    render(<MemoryRouter><ToastProvider><AuthProvider><LoginPage /></AuthProvider></ToastProvider></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows the server error when login fails", async () => {
    localStorage.clear();
    const { api } = await import("../api/client");
    vi.spyOn(api, "post").mockRejectedValueOnce({
      isAxiosError: true, response: { status: 401, data: { detail: "Incorrect email or password." } },
    });
    render(<MemoryRouter><ToastProvider><AuthProvider><LoginPage /></AuthProvider></ToastProvider></MemoryRouter>);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  });
});
