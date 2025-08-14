import readline from "readline";
import Variables from "./src/config/Variables";
import FalAIService from "./src/service/FalAIService";

async function ask(question: string): Promise<string> {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});
    return new Promise(resolve => rl.question(question, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

(async () => {
    try {
        Variables.boot();
        const url = await ask("Enter video URL: ");
        if (!url) {
            console.error("No URL provided.");
            process.exit(1);
        }

        console.log("[Test] Processing video, please wait...");
        const result = await FalAIService.downloadAndSave(url);
        console.log("[Test] Done. Public URL:");
        console.log(result);

    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
