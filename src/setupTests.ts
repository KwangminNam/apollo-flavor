import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

declare module "vitest" {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	interface Assertion<T = any> extends jest.Matchers<void, T> {}
}

expect.extend(matchers);
