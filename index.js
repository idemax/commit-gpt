import OpenAI from 'openai';
import dotenv from 'dotenv';
import shell from 'shelljs';
import readline from 'readline';
import process from 'process';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error(
        'OPENAI_API_KEY is not set. Please create a .env file with your OPENAI_API_KEY. You can create a new one here: https://platform.openai.com/api-keys',
    );
    process.exit(1);
}

let model = process.env.OPENAI_API_MODEL || 'gpt-3.5-turbo-0125'; // Default model

const openai = new OpenAI();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function getModelFromUser() {
    if (!process.env.OPENAI_API_MODEL) {
        const answer = await new Promise((resolve) => {
            rl.question(
                'OPENAI_API_MODEL is not set. Please input the model name (leave empty for default gpt-3.5-turbo-0125): ',
                resolve,
            );
        });
        model = answer || 'gpt-3.5-turbo-0125';
    }
}

async function isGitRepository() {
    if (
        shell.exec('git rev-parse --is-inside-work-tree', { silent: true })
            .code !== 0
    ) {
        console.error(
            'This is not a git repository. Please run this script in the root of a git repository.',
        );
        process.exit(1);
    }
}

async function hasChangesToCommit() {
    const status = shell.exec('git status --porcelain', {
        silent: true,
    }).stdout;
    if (!status) {
        console.log('There are no changes to commit.');
        process.exit(0);
    }
}

async function generateCommitMessageForFile(file) {
    const diff = shell.exec(`git diff ${file}`, { silent: true }).stdout;
    try {
        const prompt = `Act like a very experienced senior software engineer, I need a succinct and informative commit message, you will generate a commit message for the file '${file}', in the process, you should encapsulate the essence of the change within 72 characters, using the imperative mood (e.g., "Add", "Fix"), specify the action taken (Added, Renamed, Moved, Deleted), and reflect on the main impact or purpose of the change. Include issue references when relevant using formats like [#123] for GitHub or CAT-123 for Jira. Provide context on why the change is being made, its effects, and any limitations. Please avoid using emojis, slang, and do not end the subject line with a period. Input the final result in a concise, single-line format, here is an example: "Fix buffer overflow in image processing [#456]"\n\n${diff}`;

        const response = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
            model: model,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating commit message for file:', file, error);
        return null;
    }
}

async function confirmAndCommitFile(file, trust) {
    const commitMessage = await generateCommitMessageForFile(file);
    if (!commitMessage) {
        console.log(`Failed to generate commit message for ${file}.`);
        return;
    }
    console.log(`Generated Commit Message for ${file}: ${commitMessage}`);

    let answer = 'yes';
    if (!trust) {
        answer = await new Promise((resolve) => {
            rl.question(`Commit this change for ${file}? (yes/no): `, resolve);
        });
    }

    if (answer.toLowerCase() === 'yes') {
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

async function processFiles(trust = false) {
    await getModelFromUser();
    await isGitRepository();
    await hasChangesToCommit();

    const gitStatusCommand = 'git status --porcelain';
    const gitStatusOutput = shell.exec(gitStatusCommand, {
        silent: true,
    }).stdout;
    const filePaths = gitStatusOutput
        .split('\n')
        .filter(Boolean)
        .map((line) => line.substring(3));

    for (const file of filePaths) {
        await confirmAndCommitFile(file, trust);
    }

    rl.close();
}

const args = process.argv.slice(2);
const trustFlag = args.includes('--trust');

processFiles(trustFlag);
