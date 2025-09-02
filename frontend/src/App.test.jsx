import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Dummy(){ return <div>ok</div>; }

describe("App placeholder", () => {
  it("renders ok", () => {
    render(<Dummy />);
    expect(screen.getByText("ok")).toBeDefined();
  });
});