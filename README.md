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

The soul of this project is AI thus I push you to use AI to improve this project.

Rules for contributing:
- The commits and commit message should be made by this project.
- *Maybe more along the project...*

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is provided as-is with no guarantees. Use at your own risk.

Check OpenAI's usage policies and pricing before using the API: https://openai.com/pricing

This project is AI based and may generate inappropriate or offensive content. Use with caution and review the generated messages before committing.

Everything you see here is mostly done or with help of AI.

Enjoy! =)

---

# Change Log

All notable changes to this project will be documented in this file.

## Future updates...

- [Support Assistants API when leave Beta phase](https://platform.openai.com/docs/assistants/overview)

## alpha-0.0.2 (2024-02-08)
- Contributing guidelines
- Change log
- Better disclaimer
- Add `.npmignore` file
- Added repository, bugs, and homepage URLs to `package.json`
- Refactored debug logging for better maintainability
- Supported loading env variables from `.commit-gpt` file
- Expanded README with guidelines and project details


## alpha-0.0.1 (2024-02-07)
- Initial release
- Support for all GPT models
- Support external API key
- Interactive commit confirmation
- Trust flag for skipping confirmations
- Best practices for commit messages
- Add .nvmrc file
- README.md generation
- License information
- Disclaimer
