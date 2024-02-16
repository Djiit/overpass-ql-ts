import { OverpassBoundingBox } from "@/model";
import {
	OverpassApiObject,
	OverpassJsonOutput,
	OverpassOutputGeoInfo,
	OverpassOutputVerbosity,
	OverpassRelation,
	OverpassSortOrder,
	OverpassState,
} from "@/query";
import { expect, it } from "@jest/globals";
import { buildApi, mdeoDeparmentId } from "../utils";

export function apiOutOptionsTests() {
	it("Should run queries with limit", async () => {
		const api: OverpassApiObject = buildApi();

		const result = (await api.execJson((s: OverpassState) => [s.node.query({ name: "Montevideo" })], {
			limit: 1,
		})) as OverpassJsonOutput;

		expect(result.elements.length).toBe(1);
	});

	it("Should run queries with bounding box", () => {
		const api: OverpassApiObject = buildApi();

		const boundingBox: OverpassBoundingBox = [-34.9, -56.2, -34.9, -56.2];

		const query = api.buildQuery((s: OverpassState) => [s.node.query({ name: "Zabala" })], { boundingBox });

		expect(query).toMatch(/\([\s\n]*-34.9[\s\n]*,[\s\n]*-56.2[\s\n]*,[\s\n]*-34.9[\s\n]*,[\s\n]*-56.2[\s\n]*\)/);
	});

	it("Should run queries with geometry", async () => {
		const api: OverpassApiObject = buildApi();

		const result = (await api.execJson((s: OverpassState) => [s.relation.byId(mdeoDeparmentId)], {
			geoInfo: OverpassOutputGeoInfo.BoundingBox,
			verbosity: OverpassOutputVerbosity.Ids,
		})) as OverpassJsonOutput;

		const mdeoDeparment = result.elements[0] as OverpassRelation;

		expect(mdeoDeparment).toHaveProperty("bounds");
	});

	it("Should run queries with sort", () => {
		const api: OverpassApiObject = buildApi();

		const query = api.buildQuery((s: OverpassState) => [s.node.byId(0)], {
			sortOrder: OverpassSortOrder.QuadtileIndex,
		});

		expect(query).toMatch(/\bqt\b/);
	});

	it("Should run queries with target set", () => {
		const api: OverpassApiObject = buildApi();

		const query = api.buildQuery((s: OverpassState) => [s.node.byId(0)], { targetSet: "someset" });

		expect(query).toMatch(/\.[\s\n]*\bsomeset\b[\s\n]*out/);
	});
}
