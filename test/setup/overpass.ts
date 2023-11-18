import { ChildProcess, exec as childExec } from "child_process";
import { networkName, overpassContainerName, pipeChildStdio, run, waitFor } from "./containers.mjs";

const imageName = "juancouste/overpass-test-api:1.0";
const envVariables = {
	OVERPASS_RATE_LIMIT: 0,
	OVERPASS_ALLOW_DUPLICATE_QUERIES: "yes",
};

async function main() {
	console.log("[1] Pulling image");
	await run(`docker pull ${imageName}`, { pipeStdio: true });

	console.log("[2] Network setup");
	try {
		await run(`docker network create ${networkName}`, { pipeStdio: true });
	} catch (error) {
		console.log("Network already exists, it will be reused");
	}

	console.log("[3] Cheking runing container");
	try {
		await run(`docker stop ${overpassContainerName}`, { pipeStdio: true });
		await run(`docker rm ${overpassContainerName}`, { pipeStdio: true });
		console.log("Container was runing, terminated");
	} catch (error) {}

	console.log("[4] Running container");
	const envParams = Object.entries(envVariables)
		.map(([key, val]) => `-e ${key}="${val}"`)
		.join(" ");
	const container = childExec(
		`docker run -p 127.0.0.1:80:80 -i --rm --network ${networkName} ${envParams} --name ${overpassContainerName} ${imageName}`,
	);

	pipeChildStdio(container);

	setupTermination(container);

	await waitFor(container);

	console.log("Container was terminated");
}

function setupTermination(container: ChildProcess) {
	async function interrupt(signal: NodeJS.Signals) {
		console.log(`Process was interrupted ${signal}`);
		container.kill(signal);
		await cleanup();
		console.log("Exiting");
		process.exit(0);
	}

	async function cleanup() {
		console.log("Terminatning container ...");
		try {
			await run(`docker stop ${overpassContainerName}`);
			console.log("Container was terminated, removing ...");
			await run(`docker rm ${overpassContainerName}`);
			console.log("Done");
		} catch (error) {
			console.error(error);
		}
	}

	process.on("SIGINT", interrupt);
	process.on("SIGTERM", interrupt);
	process.on("SIGKILL", interrupt);
	process.on("uncaughtException", cleanup);
	process.on("exit", cleanup);
}

main().then(console.log, console.error);
