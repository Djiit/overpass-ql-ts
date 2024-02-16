import { expect, it } from "@jest/globals";
import {
	OverpassApiObject,
	OverpassErrorType,
	OverpassFormat,
	OverpassRemarkError,
	OverpassSettings,
	OverpassState,
} from "../../src";
import { BuildApi, MDEO_BBOX, MDEO_ID, ONLY_IDS } from "../utils";
import { expectUruguay, uruguayStatementBuilder } from "./uruguay";

export function apiSettingsTests() {
	it("Should run timeout queries", async () => {
		const api: OverpassApiObject = BuildApi();

		const query = api.buildQuery(uruguayStatementBuilder, ONLY_IDS, {
			timeout: 12345,
			format: OverpassFormat.JSON,
		});

		expect(query).toMatch(/\[[\s\n]*timeout[\s\n]*:[\s\n]*12345[\s\n]*\]/);

		const result = await api.execQuery(query);

		expectUruguay(result);
	});

	it("Should run date queries", async () => {
		const api: OverpassApiObject = BuildApi();

		const query = api.buildQuery(uruguayStatementBuilder, ONLY_IDS, { date: new Date(Date.UTC(2000, 1, 2)) });

		expect(query).toMatch(/\[[\s\n]*date[\s\n]*:[\s\n]*"2000-02-02T00:00:00\.000Z"[\s\n]*\]/);

		const promise = api.execQuery(query);

		await expect(promise).rejects.toThrow(OverpassRemarkError);
		await expect(promise).rejects.toHaveProperty("type", OverpassErrorType.NoAtticData);
	});

	it("Should run diff queries", async () => {
		const api: OverpassApiObject = BuildApi();

		const query = api.buildQuery(uruguayStatementBuilder, ONLY_IDS, {
			format: OverpassFormat.XML,
			diff: [new Date(Date.UTC(2000, 1, 2)), new Date(Date.UTC(2003, 4, 5))],
		});

		expect(query).toMatch(
			/\[[\s\n]*diff[\s\n]*:[\s\n]*"2000-02-02T00:00:00\.000Z"[\s\n]*,[\s\n]*"2003-05-05T00:00:00\.000Z"[\s\n]*\]/,
		);

		const promise = api.execQuery(query);

		await expect(promise).rejects.toThrow(OverpassRemarkError);
		await expect(promise).rejects.toHaveProperty("type", OverpassErrorType.NoAtticData);
	});

	it("Should run queries with no settings", async () => {
		const api: OverpassApiObject = BuildApi();

		const result = await api.exec({}, uruguayStatementBuilder, ONLY_IDS);

		expect(typeof result).toBe("string");

		expect(result).toMatch("<?xml");
	});

	it("Should run queries with maxSize", async () => {
		const api: OverpassApiObject = BuildApi();

		const query = api.buildQuery(uruguayStatementBuilder, ONLY_IDS, {
			maxSize: 500,
			format: OverpassFormat.JSON,
		});

		expect(query).toMatch(/\[[\s\n]*maxsize[\s\n]*:[\s\n]*500[\s\n]*\]/);

		const result = await api.execQuery(query);

		expectUruguay(result);
	});

	it("Should run queries with globalBoundingBox", async () => {
		const api: OverpassApiObject = BuildApi();

		const settings: OverpassSettings = { globalBoundingBox: MDEO_BBOX };

		const result = await api.execJson(
			(s: OverpassState) => [
				s.node.query((b) => [
					["name", b.equals("Montevideo")],
					["capital", b.equals("yes")],
				]),
			],
			ONLY_IDS,
			settings,
		);

		expect(result.elements.length).toBe(1);
		const [element] = result.elements;

		expect(element.id).toEqual(MDEO_ID);
		expect(element.type).toBe("node");
	});
}
