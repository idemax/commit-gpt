# Commit GPT

## Overview

This tool automatically generates succinct and informative commit messages for files within a Git repository, leveraging OpenAI's GPT model. Designed for developers seeking to improve commit message quality without the overhead of crafting detailed descriptions manually.

## Features

- Generates commit messages based on file changes
- Supports custom models from OpenAI
- Interactive confirmation for each commit
- Option to skip confirmations with `--trust` flag
- Ensures commit messages follow best practices for professional software development

## Prerequisites

- Node.js (v20.11.0 or later)
- Git
- An OpenAI API key

## Setup

1. **Clone the Repository**

   Clone the project repository and navigate to the project directory:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies**

   Install the required Node.js dependencies. Ensure you have Node.js installed (refer to `.nvmrc` for the required version):

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the project root with your OpenAI credentials:

   ```
   OPENAI_API_KEY=<your-key-from-https://platform.openai.com/api-keys>
   OPENAI_API_MODEL=gpt-4
   ```

## Usage

1. **Check for Git Changes**

   Ensure you're in a Git repository with staged changes ready for commit.

2. **Run the Tool**

   Execute the script to start generating commit messages:

   ```bash
   node index.js
   ```

   Use the `--trust` flag to skip commit confirmations:

   ```bash
   node index.js --trust
   ```

3. **Follow Prompts**

   The script will prompt you to confirm commit messages for each changed file. Respond with `yes` or `no`.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for improvements or bug fixes.

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is provided as-is with no guarantees. Use at your own risk.