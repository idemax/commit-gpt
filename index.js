import OpenAI from 'openai';
import dotenv from 'dotenv';
import shell from 'shelljs';
import readline from 'readline';
dotenv.config();

const openai = new OpenAI();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function generateCommitMessageForFile(file) {
    const diff = shell.exec(`git diff ${file}`, { silent: true }).stdout;
    try {
        const prompt = `Given the changes in the file '${file}', generate a clear, professional commit message within 50 characters, embodying senior engineer Git practices. Here are the changes:\n${diff}`;
        const response = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
            model: 'gpt-3.5-turbo-0125',
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating commit message for file:', file, error);
        return null;
    }
}

async function confirmAndCommitFile(file) {
    const commitMessage = await generateCommitMessageForFile(file);
    if (!commitMessage) {
        console.log(`Failed to generate commit message for ${file}.`);
        return; // Skip this file if commit message generation failed
    }
    console.log(`Generated Commit Message for ${file}: ${commitMessage}`);
    const answer = await new Promise((resolve) => {
        rl.question(`Commit this change for ${file}? (yes/no): `, (answer) => {
            resolve(answer.toLowerCase());
        });
    });
    if (answer && answer.toLowerCase() === 'yes') {
        shell.exec(
            `git add "${file}" && git commit -m '${commitMessage.trim()}' '${file}'`,
            { silent: false },
            (code, stdout, stderr) => {
                if (code === 0) {
                    console.log(`Commit successful for ${file}.`);
                } else {
                    console.error(`Commit failed for ${file}:`, stderr);
                }
            },
        );
    } else {
        console.log(`Commit skipped for ${file}.`);
    }
}

async function processFiles() {
    const gitStatusCommand = 'git status --porcelain';
    const gitStatusOutput = shell.exec(gitStatusCommand, {
        silent: true,
    }).stdout;
    const filePaths = gitStatusOutput
        .split('\n')
        .filter(Boolean)
        .map((line) => line.substring(3));

    for (const file of filePaths) {
        await confirmAndCommitFile(file);
    }

    rl.close(); // Close readline after processing all files
}

processFiles();
