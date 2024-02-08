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
        const prompt = `Generate a commit message for the file '${file}' following these comprehensive guidelines:

1. Start with a concise summary under 72 characters, capturing the essence of the change in the imperative mood (e.g., "Add", "Fix").
2. Specify the action taken (Added, Renamed, Moved, Deleted) and reflect the main impact or purpose of the change.
3. Separate the summary from the body with a blank line. Use the body to explain the "what" and "why" of the changes, not the "how". Wrap lines at 72 characters.
4. Use bullet points for lists, preceded by a hyphen or asterisk and a single space. Use a hanging indent for multiline bullet points.
5. Include references to issues or tickets when relevant, using a format like [#123] for GitHub or CAT-123 for Jira in the header or body. You can check the branch name for the issue number.
6. Avoid emojis, slang, and end the subject line without a period. Capitalize the subject line and each paragraph.
7. The first line is the most important: it should be able to complete the sentence "If applied, this commit will...".
8. Provide context on why a change is being made, its effects, and any limitations of the current code. Avoid assuming the code is self-evident.

Here are the changes in '${file}':\n${diff}`;

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
