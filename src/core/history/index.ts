import { generateHexString } from "../util/rand";

export type Choice = {
    functionName: string;
    functionCodeLine: string;
    originalFilePath: string;
    id: string;
    functionCodeContent?: string;
}
export type ProcessChoice = {
    functionName: string;
    functionCodeLine: string;
    originalFilePath: string;
}
type ChoiceTree = {
    content: Choice
    children: ChoiceTree[]
}
type ChoicePosition = {
    depth: number;
    width: number;
}

const HISTORY_PREFIX = " ".repeat(2)

export class HistoryHandler {
    private rootPath: string;
    private choiceTree: ChoiceTree
    private currentChoicePosition: ChoicePosition[];
    private visualizeResult: string;
    constructor(rootPath: string, rootFunctionName: string, rootFunctionCodeLine: string) {
        this.rootPath = rootPath;
        const rootChoice: Choice = {
            functionName: rootFunctionName,
            functionCodeLine: rootFunctionCodeLine,
            originalFilePath: rootPath,
            id: generateHexString()
        }
        this.choiceTree = {
            content: rootChoice,
            children: []
        };
        this.currentChoicePosition = [{depth: 0, width: 0}];
        this.visualizeResult = "";
    }
    addHistory(choices: ProcessChoice[]) {
        console.log("choice pos", this.currentChoicePosition)
        try {
            let currentTree = this.choiceTree;
            let currentIndex = 1;
            while(true) {
                const currentWidth = this.currentChoicePosition.find((ccp) => {
                    return ccp.depth === currentIndex;
                })
                if (!currentWidth) break;
                const newCurrentTree = currentTree.children[currentWidth.width];
                if (!newCurrentTree) break;
                currentTree = newCurrentTree;
                currentIndex += 1;
            }
            currentTree.children = choices.map((c) => ({
                content: {
                    ...c,
                    id: generateHexString(),
                },
                children: []
            }));
        } catch (e) {
            console.error(e)
            return
        }
    }
    choose(selectIndex: number, functionCodeContent: string) {
        const maxDepthPosition = this.currentChoicePosition.find((ccp) =>
            ccp.depth === this.currentChoicePosition.length - 1
        );
        if (!maxDepthPosition) return;
        const maxDepth = maxDepthPosition.depth
        this.currentChoicePosition = [...this.currentChoicePosition, {
            depth: maxDepth + 1,
            width: selectIndex
        }]
        this.searchByChoicePositionArray((choiceTree) => {
            choiceTree.content.functionCodeContent = functionCodeContent;
        })
    }
    private searchByChoicePositionArray(callbackFn?: (choiceTree: ChoiceTree) => void) {
        let currentTree = this.choiceTree;
        let currentDepth = 0;
        for(let choicePosition of this.currentChoicePosition) {
            const depth = choicePosition.depth;
            const width = choicePosition.width;
            if (depth !== currentDepth + 1) continue;
            currentTree = currentTree.children[width];
            currentDepth += 1;
        }
        if (callbackFn) callbackFn(currentTree);
        return currentTree;
    }
    private move(selectedChoicePosition: ChoicePosition[]) {
        this.currentChoicePosition = selectedChoicePosition
    }
    moveById(id: string): ProcessChoice | null {
        const searchResult = this.searchTreeById(this.choiceTree, id, 0, 0, []);
        if (!searchResult || !searchResult.pos.length) {
            console.log(`id not found for ${id} ...`)
            return null;
        }
        this.move(searchResult.pos)
        return searchResult.processChoice
    }
    searchTreeById(searchChoiceTree: ChoiceTree, id: string, depth: number, width: number, searchPath: ChoicePosition[]): {pos: ChoicePosition[], processChoice: ProcessChoice} | null {
        const newSearchPath = [...searchPath, {depth, width}]
        const isSame = searchChoiceTree.content.id.slice(0, 7) === id;
        if (isSame) return {pos: newSearchPath, processChoice: searchChoiceTree.content}
        let res = null
        searchChoiceTree.children.forEach((st, index) => {
            const result = this.searchTreeById(st, id, depth+1, index, newSearchPath);
            if (result) res = result
        })
        return res
    }
    showHistory(): string {
        this.visualizeResult =`rootPath: ${this.rootPath}\n\n`
        this.printTree(this.choiceTree)
        console.log(this.visualizeResult);
        return this.visualizeResult;
    }
    private printTree(tree: ChoiceTree, prefix: string = "") {
        this.visualizeResult += `${prefix}|${tree.content.functionName}
${prefix}|${tree.content.id.slice(0, 7)}

`
        for (let child of tree.children) {
            this.printTree(child, prefix + HISTORY_PREFIX)
        }
    }
    traceFunctionContent(): [string, string] {
        /* desired result is following...
            ```file_name1:function_name1
            content1...
            ```
            ```file_name2:function_name2
            content2...
            ```
         */
        let result: string = "";
        let functionResult: string = "";
        let currentTree = this.choiceTree;
        let currentDepth = 0;
        for(let index in this.currentChoicePosition) {
            const choicePosition = this.currentChoicePosition[index]
            const depth = choicePosition.depth;
            const width = choicePosition.width;
            if (depth !== currentDepth) continue;
            if (depth !== 0) currentTree = currentTree.children[width];
            const fileName = currentTree.content.originalFilePath;
            const functionName = currentTree.content?.functionName ?? currentTree.content.functionCodeLine;
            const functionCode = currentTree.content.functionCodeContent || "not provided..."
            functionResult += `${functionName} -> `
            const currentResult = `\`\`\`${index} : ${fileName}:${functionName}
${functionCode}
\`\`\`

`
            result += currentResult;
            currentDepth += 1;
        }
        return [result, functionResult];
    }
}