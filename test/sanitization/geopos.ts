import { expect } from "@jest/globals";
import { OverpassExpression, OverpassGeoPos, OverpassState, OverpassStatement, ParamType } from "../../src";
import { ItSymetrically } from "../utils";
import { ExpectParamteterError, SanitizationAdapter } from "./adapter";

function getInside(state: OverpassState, geoPos: OverpassExpression<OverpassGeoPos>): OverpassStatement {
	return state.node.inside([geoPos]);
}

export function sanitizationGeoPosTests() {
	ItSymetrically(
		"Should be fine when geopos is fine",
		SanitizationAdapter,
		getInside,
		[{ exp: { lat: 1, lon: 1 }, type: ParamType.GeoPos }],
		async (result) => await expect(result).resolves.toHaveProperty("elements"),
	);

	ItSymetrically(
		"Should error when geopos is undefined",
		SanitizationAdapter,
		getInside,
		[{ exp: undefined! as OverpassGeoPos, type: ParamType.GeoPos }],
		ExpectParamteterError,
	);

	ItSymetrically(
		"Should error when geopos is null",
		SanitizationAdapter,
		getInside,
		[{ exp: null! as OverpassGeoPos, type: ParamType.GeoPos }],
		ExpectParamteterError,
	);

	Array<number>(NaN, Infinity, null!, undefined!).forEach((number) => {
		ItSymetrically(
			`Should error when geopos lat is ${number}`,
			SanitizationAdapter,
			getInside,
			[{ exp: { lat: number, lon: 1 }, type: ParamType.GeoPos }],
			ExpectParamteterError,
		);

		ItSymetrically(
			`Should error when geopos lon is ${number}`,
			SanitizationAdapter,
			getInside,
			[{ exp: { lat: 1, lon: number }, type: ParamType.GeoPos }],
			ExpectParamteterError,
		);
	});

	const ranges: { [K in keyof OverpassGeoPos]: number } = {
		lat: 90,
		lon: 180,
	};

	const coords: (keyof OverpassGeoPos)[] = ["lat", "lon"];

	[+1, -1].forEach((sign) => {
		coords.forEach((coord) => {
			const outOfRange = sign * (ranges[coord] + 1);
			const geoPos: OverpassGeoPos = { lat: 1, lon: 1, ...{ [coord]: outOfRange } };
			const signStr = outOfRange >= 0 ? "+" : "-";

			ItSymetrically(
				`Should error when geopos ${coord} is out of range [${signStr}]`,
				SanitizationAdapter,
				getInside,
				[{ exp: geoPos, type: ParamType.GeoPos }],
				ExpectParamteterError,
			);
		});
	});
}