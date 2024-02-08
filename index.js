import OpenAI from 'openai';
import dotenv from 'dotenv';
import shell from 'shelljs';
import readline from 'readline';
import process from 'process';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Function to load environment variables from a .env file
function loadEnvFromFile() {
    console.log('Loading environment variables from .commit-gpt file...');
    const envFilePath = path.resolve(process.cwd(), '.commit-gpt');
    console.log('Loading environment variables from:', envFilePath);
    try {
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
        console.log('Environment variables loaded:', envConfig);
        if (envConfig.OPENAI_API_KEY) {
            console.log('Setting OPENAI_API_KEY...');
            process.env.OPENAI_API_KEY = envConfig.OPENAI_API_KEY;
        }
        if (envConfig.OPENAI_API_MODEL) {
            console.log('Setting OPENAI_API_MODEL...');
            process.env.OPENAI_API_MODEL = envConfig.OPENAI_API_MODEL;
        }
        console.log('Environment variables loaded successfully.');
        console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
        console.log('OPENAI_API_MODEL:', process.env.OPENAI_API_MODEL);
    } catch (error) {
        console.error(
            `Failed to load environment variables from ${envFilePath}: ${error.message}`,
        );
        process.exit(1);
    }
    console.log('Environment variables loaded successfully.');
}

// Load environment variables from file if not available in process.env
console.log('Loading environment variables...');
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_MODEL) {
    console.log('Loading environment variables from .commit-gpt file...');
    loadEnvFromFile();
    console.log('Environment variables loaded successfully.');
}

// Check if OPENAI_API_KEY is available, otherwise prompt user to create a .commit-gpt file
console.log('Checking for OPENAI_API_KEY...');
if (!process.env.OPENAI_API_KEY) {
    console.error(
        `OPENAI_API_KEY is not set. Please create a .commit-gpt file in the current directory with your OPENAI_API_KEY.\nYou can create a new one here: https://platform.openai.com/api-keys`,
    );
    process.exit(1);
}

// Check if OPENAI_API_MODEL is available, otherwise prompt user to set the model name
console.log('Checking for OPENAI_API_MODEL...');
if (!process.env.OPENAI_API_MODEL) {
    console.log('OPENAI_API_MODEL is not set.');
    const answer = await new Promise((resolve) => {
        rl.question(
            'OPENAI_API_MODEL is not set. Please input the model name (leave empty for default gpt-3.5-turbo-0125): ',
            resolve,
        );
    });
    process.env.OPENAI_API_MODEL = answer || 'gpt-3.5-turbo-0125';
    console.log('OPENAI_API_MODEL set to:', process.env.OPENAI_API_MODEL);
}

// if (!process.env.OPENAI_API_KEY) {
//     console.error(
//         'OPENAI_API_KEY is not set. Please create a .env file with your OPENAI_API_KEY. You can create a new one here: https://platform.openai.com/api-keys',
//     );
//     process.exit(1);
// }

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
        const prompt = `
Act like a very experienced senior software engineer, I need a succinct and informative commit message. 

You will generate a commit message for the file '${file}'. In the process, you should:

- Encapsulate the essence of the change within 72 characters, using the imperative mood (e.g., "Add", "Fix").
- Specify the action taken (Added, Renamed, Moved, Deleted), and reflect on the main impact or purpose of the change.
- Provide context on why the change is being made, its effects, and any limitations.
- Please avoid using emojis, slang, and do not end the subject line with a period.
- Never encapsulate the commit message in quotes or double quotes.
- Check the file extension and provide the appropriate context (e.g., "Add support for .ts files.").
- Check the file changes and provide the appropriate context (e.g., "Fix buffer overflow in image processing.").
- Evaluate the changes to provide a concise, single-line commit message.
- Add a period at the end of the commit message.
- In case of insufficient information, provide a generic commit message (e.g., "Update file.").

Input the final result in a concise, single-line format. Here is an example: "Fix buffer overflow in image processing."

Here are the changes in '${file}':\n${diff}
`.trim();

        const response = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
            model: model,
        });
        return response.choices[0].message.content.replace(/^"|"$/g, '');
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
        // Construct the full path to the file
        const fullPath = `./${file}`;

        // Check if the path is a file using fs.lstatSync
        if (fs.lstatSync(fullPath).isFile()) {
            await confirmAndCommitFile(file, trust);
        }
    }

    rl.close();
}

const args = process.argv.slice(2);
const trustFlag = args.includes('--trust');

processFiles(trustFlag);
