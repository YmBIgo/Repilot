# repilot README

![repilot logo](https://repilot.s3.us-west-1.amazonaws.com/repilotLogo.png)

"Repilot (***Re***ading co***pilot***)" is VS Code extension which support user's code reading for ***Golang*** using LLM(***Claude***). User can use this tool to accelerate their code reading. Since this tool only supports ***Golang***, I expect user to read CNCF's code faster using this tool.

## What is difference between code reading using this agent and eye code reading

- Speed :

Code Reading using this agent is better. I found I gain at least 2x faster for finding important functions, 3x faster for returning to original function, 5x faster for getting report summarizing code base.

- Accuracy of code route :

Code Reading using this agent is better. When human read code, it sometimes become random walk. But since LLM knows architecture of code (like Kubernetes or argo-cd or prometheus or so on ...), LLM can pick good candidate of function in code base. So it is better for the beginner.

- Ability to code jump :

Sometime human is better, but for most case equal. When This agent using "gopls implementation" to search code base, the accuracy of code reading is being worse, but this is not often happen.

## How to use it

- Demo

[![Repilot Demo Movie](https://repilot.s3.us-west-1.amazonaws.com/repilot_youtube_thumbnail.png)](https://youtu.be/SXU8dG6u330)

0. Firstly goto Setting Page and set `API Key(claude)`, `gopls Path` (default /opt/homebrew/bin/gopls), `download report path` (default \~/Desktop) and `language`(default English)

![Setting Page](https://repilot.s3.us-west-1.amazonaws.com/SettingPage.png)

1. Go back to chat view and input `rootPath`(file path contains function you want to search), `rootFunctionName`(functionName you want to search from, it is better to contain one whole line), `Purpose`(purpose of code reading), and Tap `Start Task`.

2. AI would suggest 1〜5 candidates which AI thought is relavent to purpose, and you can input 0〜4 index to search deeper of the code base.

3. not only search deeper, you can `ask AI to search again` by 5, `show history` by 6, `get summary report` by 7, `get file that AI is reading` by 8.

4. continue 2, 3 process until you think it is good.

## Features

- Code reading with AI

![Code reading with AI](https://repilot.s3.us-west-1.amazonaws.com/candidatePage.png)

> AI would pick 1〜5 candidates of important code (and you don't have to read whole codes! ), and you can choose one candidate to search deeper recursively.

- Show history and re-search previous route

![Show history and re-search previous route](https://repilot.s3.us-west-1.amazonaws.com/showHistory.png)

> You can see your search route and history, and you can back to previous search route at any time (so you don't have to be worried about code jump)

- Get summary of code

![Get summary of code](https://repilot.s3.us-west-1.amazonaws.com/reportResult.png)

> You can get summary report of code base which already be read.

- Check What AI is reading

![Check What AI is reading](https://repilot.s3.us-west-1.amazonaws.com/openFilePage.png)

> You can check what kind of file content AI is reading.

## Requirements

- gopls >= v0.17.1

You can install gopls using `brew install gopls` for Mac User.

- Claude API

We use "claude-3-5-sonnet-20241022" as AI model, so please prepare Claude API to use it.

## Extension Settings

I registered `repilot.openInNewTab` for opeing the main `repilot` view.
Please use `Command + shift + p` to open command pallet and input `repilot` to start main view!

## Known Issues

Please report any issue on Github.

## Release Notes

### 1.0.0

Initial release of repilot

---

### 1.0.1

fix small bugs (bugs when retry and search history hash)

---

### 1.0.2 ~ 1.0.4

fix installation bug